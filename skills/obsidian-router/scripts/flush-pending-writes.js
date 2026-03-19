// flush-pending-writes.js
// Triggers Obsidian to flush any pending REST API writes by pinging the vault
// Run after bulk CRUD operations via obsidian REST API while Obsidian is open

import { readFileSync } from "fs";
import { join } from "path";
import https from "https";

const HOME = process.env.USERPROFILE || process.env.HOME;
const keyFile = join(HOME, ".claude", "credentials", "obsidian-api.env");
const apiKey = readFileSync(keyFile, "utf8").trim().replace(/^.*=/, "");

const options = {
  hostname: "127.0.0.1",
  port: 27124,
  path: "/",
  method: "GET",
  headers: { Authorization: `Bearer ${apiKey}` },
  rejectUnauthorized: false,
};

https.get(options, (res) => {
  console.log(`Obsidian vault ping: ${res.statusCode}`);
  res.resume();
});
