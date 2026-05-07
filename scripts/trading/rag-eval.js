#!/usr/bin/env node
/**
 * RAG Eval — local runner that mirrors n8n WF "Trading: RAG Eval Weekly" (Y37kwWc9rnCG5AZv) 1:1.
 * Reads eval set from prod, embeds via Gemini, calls search_knowledge, writes baseline run.
 * For one-shot baseline. Routine weekly runs are owned by the n8n WF.
 */

const fs = require('fs');
const https = require('https');
const { spawnSync } = require('child_process');

const GEMINI_KEY = fs.readFileSync('C:/Users/sorte/.claude/credentials/gemini-api.key', 'utf8').trim();
const SSH_KEY = 'C:/Users/sorte/.claude/credentials/n8n-host-ssh.key';
const SSH_TARGET = 'root@157.180.33.253';
const SSH_OPTS = ['-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null'];

function runPsqlFile(sql) {
  const localFile = `C:/tmp/rag_psql_${Date.now()}_${Math.random().toString(36).slice(2,8)}.sql`;
  const remoteFile = `/tmp/${localFile.split('/').pop()}`;
  fs.writeFileSync(localFile, sql);

  let r = spawnSync('scp', [...SSH_OPTS, localFile, `${SSH_TARGET}:${remoteFile}`], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('scp: ' + r.stderr);

  const remoteCmd = `docker cp ${remoteFile} postgres:${remoteFile} && docker exec postgres psql -U postgres -d n8n -A -t -F '|' -v ON_ERROR_STOP=1 -f ${remoteFile}`;
  r = spawnSync('ssh', [...SSH_OPTS, SSH_TARGET, remoteCmd], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('psql: ' + (r.stderr || r.stdout));

  return r.stdout
    .split('\n')
    .map(s => s.replace(/\r$/, ''))
    .filter(s => s && !s.startsWith('WARNING:') && !s.startsWith('HINT:') && !s.startsWith('DETAIL:'));
}

function embed(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      outputDimensionality: 768,
      taskType: 'RETRIEVAL_QUERY'
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) return reject(new Error(`embed ${res.statusCode}: ${text.slice(0, 300)}`));
        try {
          const j = JSON.parse(text);
          const v = j.embedding && j.embedding.values;
          if (!Array.isArray(v) || v.length !== 768) return reject(new Error('bad embedding shape'));
          resolve(v);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('embed timeout')); });
    req.write(body);
    req.end();
  });
}

async function parallelLimit(arr, n, fn) {
  const out = new Array(arr.length);
  let i = 0;
  async function worker() {
    while (i < arr.length) {
      const idx = i++;
      try { out[idx] = await fn(arr[idx], idx); }
      catch (e) { out[idx] = { __error: e.message }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, arr.length) }, worker));
  return out;
}

(async () => {
  console.log('[rag-eval] loading eval set...');
  const lines = runPsqlFile("SELECT id, query, expected_book_slug, expected_chunk_idx FROM rag_eval_set WHERE active ORDER BY id;");
  const evalSet = lines.map(l => {
    const [id, query, slug, idx] = l.split('|');
    return { id: Number(id), query, expected_book_slug: slug, expected_chunk_idx: Number(idx) };
  });
  console.log(`[rag-eval] ${evalSet.length} queries`);
  if (evalSet.length === 0) { console.error('empty eval set'); process.exit(1); }

  console.log('[rag-eval] embedding 30 queries (parallelism=8)...');
  const t0 = Date.now();
  const embeddings = await parallelLimit(evalSet, 8, q => embed(q.query));
  const failed = embeddings.filter(e => e && e.__error);
  if (failed.length) {
    console.error(`embedding failures: ${failed.length}/${evalSet.length}`);
    failed.forEach((f, i) => console.error(`  [${i}] ${f.__error}`));
    process.exit(1);
  }
  console.log(`[rag-eval] embedded in ${(Date.now() - t0) / 1000}s`);

  console.log('[rag-eval] building batched search SQL...');
  const sqlParts = evalSet.map((q, i) => {
    const vecLit = embeddings[i].join(',');
    return `SELECT ${q.id}::int AS query_id, k.book_slug, k.chunk_idx, COALESCE(k.title, '') AS title, k.score::float8 AS score FROM search_knowledge('[${vecLit}]'::vector, 3) k`;
  });
  const batchedSql = sqlParts.join('\nUNION ALL\n') + '\nORDER BY query_id, score DESC;';

  console.log('[rag-eval] running batched search on prod...');
  const tSearch = Date.now();
  const searchLines = runPsqlFile(batchedSql);
  console.log(`[rag-eval] search done in ${(Date.now() - tSearch) / 1000}s, ${searchLines.length} rows`);

  const byQuery = {};
  for (const l of searchLines) {
    const [qid, book_slug, chunk_idx, title, score] = l.split('|');
    const id = Number(qid);
    if (!byQuery[id]) byQuery[id] = [];
    byQuery[id].push({ book_slug, chunk_idx: Number(chunk_idx), title, score: Number(score) });
  }

  let hit1 = 0, hit3 = 0;
  const perQuery = [];
  for (const q of evalSet) {
    const top3 = (byQuery[q.id] || []).slice(0, 3).map((r, i) => ({ ...r, rank: i + 1 }));
    const matches = c => c.book_slug === q.expected_book_slug && Number(c.chunk_idx) === Number(q.expected_chunk_idx);
    const inTop1 = top3.length > 0 && matches(top3[0]);
    const inTop3 = top3.some(matches);
    if (inTop1) hit1++;
    if (inTop3) hit3++;
    const status = inTop1 ? 'HIT@1' : (inTop3 ? 'hit@3' : 'MISS');
    console.log(`[${q.id}] ${status}  expected ${q.expected_book_slug}/${q.expected_chunk_idx}  -> top1=${top3[0]?.book_slug}/${top3[0]?.chunk_idx}`);
    perQuery.push({
      query_id: q.id,
      query_text: q.query,
      expected_book_slug: q.expected_book_slug,
      expected_chunk_idx: q.expected_chunk_idx,
      top_3: top3,
      hit_at_1: inTop1,
      hit_at_3: inTop3
    });
  }

  const total = perQuery.length;
  console.log(`\n=== TOTALS ===`);
  console.log(`hit@1: ${hit1}/${total} = ${(100 * hit1 / total).toFixed(2)}%`);
  console.log(`hit@3: ${hit3}/${total} = ${(100 * hit3 / total).toFixed(2)}%`);

  // persist via file (UUIDs and JSON too big for arg list)
  const payloadFile = `C:/tmp/rag_eval_payload_${Date.now()}.json`;
  fs.writeFileSync(payloadFile, JSON.stringify(perQuery));
  const remotePayload = `/tmp/${payloadFile.split('/').pop()}`;
  let r = spawnSync('scp', [...SSH_OPTS, payloadFile, `${SSH_TARGET}:${remotePayload}`], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('scp payload:', r.stderr); process.exit(1); }
  r = spawnSync('ssh', [...SSH_OPTS, SSH_TARGET, `docker cp ${remotePayload} postgres:${remotePayload}`], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('docker cp payload:', r.stderr); process.exit(1); }

  const insertSql = `\\set payload \`cat ${remotePayload}\`
INSERT INTO rag_eval_runs (total_queries, hit_at_1, hit_at_3, per_query_results, embedding_model, notes)
VALUES (${total}, ${hit1}, ${hit3}, :'payload'::jsonb, 'gemini-embedding-001', 'baseline-local-runner-2026-05-05')
RETURNING id, run_at, hit_at_1_pct, hit_at_3_pct;
`;
  console.log('[rag-eval] saving baseline run...');
  console.log(runPsqlFile(insertSql).join('\n'));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
