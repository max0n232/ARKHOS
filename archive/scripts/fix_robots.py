"""CLI script to fix robots.txt on studiokook.ee via FTP.

Usage:
    python fix_robots.py fix [--dry-run] [--file PATH]
    python fix_robots.py validate
    python fix_robots.py show
"""

import argparse
import difflib
import json
import os
import sys
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from ftplib import FTP_TLS, FTP, error_perm
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

SITE_URL = "https://studiokook.ee"
ROBOTS_URL = f"{SITE_URL}/robots.txt"
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
CREDENTIALS_PATH = PROJECT_DIR / "credentials" / "zone_ee.json"
TEMPLATE_PATH = SCRIPT_DIR / "robots_template.txt"

# FTP paths to try (Zone.ee web root)
FTP_PATHS = ["/htdocs/robots.txt", "/public_html/robots.txt", "/robots.txt"]

EXIT_OK = 0
EXIT_CONNECTION = 1
EXIT_BACKUP = 2
EXIT_VALIDATION = 3
EXIT_WRITE = 4
EXIT_VERIFY = 5


@dataclass
class Issue:
    severity: str  # ERROR, WARNING, INFO
    message: str


def log(tag: str, msg: str) -> None:
    colors = {
        "INFO": "\033[36m",
        "OK": "\033[32m",
        "WARN": "\033[33m",
        "ERROR": "\033[31m",
        "DIFF": "\033[35m",
    }
    reset = "\033[0m"
    color = colors.get(tag, "")
    print(f"{color}[{tag}]{reset} {msg}")


# --- Credentials ---

def load_credentials(
    ftp_host: str | None = None,
    ftp_user: str | None = None,
    ftp_pass: str | None = None,
) -> dict:
    # Priority: CLI flags > env vars > zone_ee.json
    host = ftp_host or os.environ.get("FTP_HOST")
    user = ftp_user or os.environ.get("FTP_USER")
    pwd = ftp_pass or os.environ.get("FTP_PASS")

    if host and user and pwd:
        return {"host": host, "user": user, "pass": pwd}

    if not CREDENTIALS_PATH.exists():
        log("ERROR", f"Credentials not found: {CREDENTIALS_PATH}")
        log("INFO", "Set FTP_HOST, FTP_USER, FTP_PASS env vars or use --ftp-* flags")
        sys.exit(EXIT_CONNECTION)

    with open(CREDENTIALS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    ftp = data.get("ftp", {})
    return {
        "host": host or ftp.get("host", "ftp.zone.ee"),
        "user": user or ftp.get("username", ""),
        "pass": pwd or ftp.get("password", ""),
    }


# --- Validation ---

def validate_robots(content: str) -> list[Issue]:
    issues: list[Issue] = []
    lines = content.strip().splitlines()

    has_sitemap = False
    has_allow_root = False
    current_agent = ""

    for line in lines:
        stripped = line.strip()

        if stripped.lower().startswith("user-agent:"):
            current_agent = stripped.split(":", 1)[1].strip().lower()

        elif stripped.lower().startswith("sitemap:"):
            has_sitemap = True

        elif stripped.lower().startswith("allow:"):
            path = stripped.split(":", 1)[1].strip()
            if path == "/":
                has_allow_root = True

        elif stripped.lower().startswith("disallow:"):
            path = stripped.split(":", 1)[1].strip()

            if path == "/" and current_agent in ("googlebot", "*"):
                issues.append(Issue(
                    "ERROR",
                    f"'Disallow: /' for {current_agent} blocks ALL content",
                ))

            if path == "/wp-":
                issues.append(Issue(
                    "ERROR",
                    "'Disallow: /wp-' is too broad -- blocks /wp-content/uploads/ (media)",
                ))

            if path == "/?":
                issues.append(Issue(
                    "WARNING",
                    "'Disallow: /?' blocks all query parameters",
                ))

    if not has_sitemap:
        issues.append(Issue("WARNING", "No Sitemap: directive found"))

    if not has_allow_root:
        issues.append(Issue("INFO", "No explicit 'Allow: /' found"))

    return issues


# --- FTP ---

@contextmanager
def ftp_connect(host: str, user: str, password: str):
    ftp = None
    try:
        try:
            ftp = FTP_TLS(host, timeout=30)
            ftp.login(user, password)
            ftp.prot_p()
            log("INFO", f"Connected to {host} (TLS)")
        except error_perm:
            raise  # auth errors -- don't fallback
        except Exception:
            if ftp:
                try:
                    ftp.quit()
                except Exception:
                    pass
            ftp = FTP(host, timeout=30)
            ftp.login(user, password)
            log("INFO", f"Connected to {host} (plain FTP)")
        yield ftp
    finally:
        if ftp:
            try:
                ftp.quit()
            except Exception:
                pass


def ftp_find_robots(ftp: FTP) -> str:
    for path in FTP_PATHS:
        try:
            ftp.size(path)
            return path
        except error_perm:
            continue
    return FTP_PATHS[0]


def ftp_download(ftp: FTP, path: str) -> str:
    buf = BytesIO()
    ftp.retrbinary(f"RETR {path}", buf.write)
    return buf.getvalue().decode("utf-8")


def ftp_backup(ftp: FTP, path: str) -> str:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dir_name = "/".join(path.split("/")[:-1])
    backup_name = f"{dir_name}/robots.txt.bak.{ts}" if dir_name else f"robots.txt.bak.{ts}"

    buf = BytesIO()
    ftp.retrbinary(f"RETR {path}", buf.write)
    buf.seek(0)
    ftp.storbinary(f"STOR {backup_name}", buf)
    return backup_name


def ftp_upload(ftp: FTP, path: str, content: str) -> None:
    buf = BytesIO(content.encode("utf-8"))
    ftp.storbinary(f"STOR {path}", buf)


# --- HTTP ---

def check_wp_virtual_robots() -> None:
    try:
        req = Request(f"{SITE_URL}/wp-json/", headers={"User-Agent": "fix_robots/1.0"})
        with urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                log("INFO", "WordPress detected -- ensure 'Discourage search engines' is OFF in Settings > Reading")
    except Exception:
        pass


def fetch_live_robots(url: str = ROBOTS_URL) -> str:
    req = Request(url, headers={"User-Agent": "fix_robots/1.0"})
    with urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8")


def normalize(text: str) -> str:
    return "\n".join(line.rstrip() for line in text.strip().splitlines()) + "\n"


# --- Diff ---

def show_diff(old: str, new: str) -> str:
    old_lines = old.splitlines(keepends=True)
    new_lines = new.splitlines(keepends=True)
    diff = difflib.unified_diff(old_lines, new_lines, fromfile="current", tofile="new")
    return "".join(diff)


# --- Template ---

def load_template(file_path: str | None = None) -> str:
    if file_path:
        p = Path(file_path)
        if not p.exists():
            log("ERROR", f"File not found: {file_path}")
            sys.exit(EXIT_VALIDATION)
        return p.read_text(encoding="utf-8")

    if TEMPLATE_PATH.exists():
        return TEMPLATE_PATH.read_text(encoding="utf-8")

    log("ERROR", f"Template not found: {TEMPLATE_PATH}")
    sys.exit(EXIT_VALIDATION)


# --- Commands ---

def cmd_show(args: argparse.Namespace) -> int:
    try:
        content = fetch_live_robots(args.url)
    except URLError as e:
        log("ERROR", f"Cannot fetch {args.url}: {e}")
        return EXIT_CONNECTION
    print(content)
    return EXIT_OK


def cmd_validate(args: argparse.Namespace) -> int:
    try:
        content = fetch_live_robots(args.url)
    except URLError as e:
        log("ERROR", f"Cannot fetch {args.url}: {e}")
        return EXIT_CONNECTION

    issues = validate_robots(content)
    if not issues:
        log("OK", "No issues found")
        return EXIT_OK

    has_error = False
    for issue in issues:
        tag = "ERROR" if issue.severity == "ERROR" else "WARN" if issue.severity == "WARNING" else "INFO"
        log(tag, issue.message)
        if issue.severity == "ERROR":
            has_error = True

    return EXIT_VALIDATION if has_error else EXIT_OK


def cmd_fix(args: argparse.Namespace) -> int:
    new_content = load_template(args.file)

    issues = validate_robots(new_content)
    errors = [i for i in issues if i.severity == "ERROR"]
    if errors:
        log("ERROR", "New robots.txt has critical issues:")
        for issue in errors:
            log("ERROR", f"  {issue.message}")
        return EXIT_VALIDATION

    for issue in issues:
        tag = "WARN" if issue.severity == "WARNING" else "INFO"
        log(tag, issue.message)

    log("OK", "Validation passed")

    check_wp_virtual_robots()

    creds = load_credentials(args.ftp_host, args.ftp_user, args.ftp_pass)
    log("INFO", f"Connecting to {creds['host']}...")

    try:
        with ftp_connect(creds["host"], creds["user"], creds["pass"]) as ftp:
            robots_path = ftp_find_robots(ftp)
            log("INFO", f"robots.txt path: {robots_path}")

            try:
                current = ftp_download(ftp, robots_path)
                log("INFO", f"Current robots.txt downloaded ({len(current)} bytes)")
            except error_perm:
                current = ""
                log("WARN", "No existing robots.txt on server")

            diff_text = show_diff(current, new_content)
            if diff_text:
                for line in diff_text.splitlines():
                    log("DIFF", line)
            else:
                log("INFO", "No changes needed -- files are identical")
                return EXIT_OK

            if args.dry_run:
                log("INFO", "Dry run -- no changes applied")
                return EXIT_OK

            if current:
                try:
                    backup_name = ftp_backup(ftp, robots_path)
                    log("INFO", f"Backed up -> {backup_name}")
                except Exception as e:
                    log("ERROR", f"Backup failed: {e}")
                    return EXIT_BACKUP

            try:
                ftp_upload(ftp, robots_path, new_content)
                log("INFO", "New robots.txt uploaded")
            except Exception as e:
                log("ERROR", f"Upload failed: {e}")
                return EXIT_WRITE

    except Exception as e:
        log("ERROR", f"FTP connection failed: {e}")
        return EXIT_CONNECTION

    log("INFO", f"Verifying {ROBOTS_URL}...")
    try:
        live = fetch_live_robots()
        if normalize(live) == normalize(new_content):
            log("OK", "robots.txt updated successfully. Sitemap directive present.")
            return EXIT_OK
        else:
            log("WARN", "Live content differs from uploaded (may be cached or WP virtual robots.txt)")
            log("INFO", "Try clearing cache or check WP Settings > Reading > search engine visibility")
            return EXIT_VERIFY
    except URLError as e:
        log("ERROR", f"Verification failed: {e}")
        return EXIT_VERIFY


# --- CLI ---

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fix robots.txt on studiokook.ee via FTP",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # fix
    p_fix = sub.add_parser("fix", help="Replace robots.txt with correct version")
    p_fix.add_argument("--dry-run", action="store_true", help="Show diff without applying")
    p_fix.add_argument("--file", help="Path to custom robots.txt file")
    p_fix.add_argument("--ftp-host", help="Override FTP host")
    p_fix.add_argument("--ftp-user", help="Override FTP username")
    p_fix.add_argument("--ftp-pass", help="Override FTP password")

    # validate
    p_val = sub.add_parser("validate", help="Validate current live robots.txt")
    p_val.add_argument("--url", default=ROBOTS_URL, help="URL to check")

    # show
    p_show = sub.add_parser("show", help="Show current live robots.txt")
    p_show.add_argument("--url", default=ROBOTS_URL, help="URL to fetch")

    args = parser.parse_args()

    commands = {"fix": cmd_fix, "validate": cmd_validate, "show": cmd_show}
    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())


