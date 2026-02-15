"""
Cleanup Studiokook project folder - organize and archive old files
Run: python cleanup_project.py
"""
import os
import shutil
from pathlib import Path
from datetime import datetime

BASE = Path("C:/Users/sorte/Desktop/Studiokook")
SCRIPTS = BASE / "scripts"
ARCHIVE = BASE / "archive"
ARCHIVE_SCRIPTS = ARCHIVE / "scripts_old"

# Create archive folders
ARCHIVE.mkdir(exist_ok=True)
ARCHIVE_SCRIPTS.mkdir(exist_ok=True)

# Files to KEEP (recent, working, HPL-related)
KEEP_FILES = {
    # HPL decors - active work
    "scrape_eamf_hpl_compact.py",
    "FIX_EGGER_META.sql",
    "HPL_TRANSLATIONS.sql",
    "SNIPPET_HPL_FINAL.php",
    "SNIPPET_REPLACE_FM_IMAGES_URL.php",
    "SNIPPET_FIX_EGGER_9.php",
    "create_f8001_w1101_thumbs.php",
    "fix_all_egger_thumbs.php",
    "generate_egger_thumbs.php",
    "rename_egger_thumbs.php",

    # Current credentials/config
    "wordpress_app_password.txt",
}

# Folders to KEEP
KEEP_FOLDERS = {
    "egger_compact_final",  # Final HPL images
    "fundermax_hpl",  # Fundermax images
}

# File patterns to ARCHIVE (move to archive/)
ARCHIVE_PATTERNS = [
    # Old screenshots
    "*.png",
    "*debug*.png",
    "*step*.png",
    "*verify*.png",

    # Old JSON dumps
    "egger_*.json",
    "eamf_*.json",
    "fenix_*.json",
    "*_audit.json",
    "*no_alt.json",

    # Old Python scripts (not in KEEP)
    "scrape_eamf_*.py",  # Old EAMF scrapers
    "download_*.py",
    "check_*.py",
    "verify_*.py",
    "debug_*.py",
    "upload_*.py",
    "set_alt_*.py",
    "*_ngg_*.py",

    # Old PHP snippets
    "SNIPPET_STEP*.php",
    "SNIPPET_UPDATE*.php",
    "SNIPPET_FIX_EGGER_HPL.php",
    "*updater*.php",
    "force_regenerate_ngg.php",
    "delete_thumbnails*.php",

    # Old markdown docs
    "*_INSTRUCTIONS.md",
    "*_SOLUTION.md",
    "*FIX*.md",
    "ACTION_PLAN.md",
]

# Folders to ARCHIVE
ARCHIVE_FOLDERS = [
    "egger_processed*",
    "egger_raw*",
    "egger_samples",
    "egger_upload",
    "egger_official",
    "egger_full_collection",
    "eamf_*",
    "fenix_*",
    "existing_worktops*",
    "problem_files*",
    "debug_screenshots",
]

def should_keep(file_path):
    """Check if file should be kept"""
    name = file_path.name
    return name in KEEP_FILES

def should_archive(file_path):
    """Check if file matches archive patterns"""
    name = file_path.name
    for pattern in ARCHIVE_PATTERNS:
        if pattern.startswith("*") and pattern.endswith("*"):
            # Contains pattern
            if pattern[1:-1] in name:
                return True
        elif pattern.startswith("*"):
            # Ends with pattern
            if name.endswith(pattern[1:]):
                return True
        elif pattern.endswith("*"):
            # Starts with pattern
            if name.startswith(pattern[:-1]):
                return True
    return False

def cleanup():
    print("Studiokook Project Cleanup")
    print("=" * 50)

    kept = []
    archived = []

    # Process files in scripts/
    for item in SCRIPTS.iterdir():
        if item.is_file():
            if should_keep(item):
                kept.append(item.name)
                print(f"[KEEP] {item.name}")
            elif should_archive(item):
                dest = ARCHIVE_SCRIPTS / item.name
                shutil.move(str(item), str(dest))
                archived.append(item.name)
                print(f"[ARCHIVE] {item.name}")

    # Process folders in scripts/
    for item in SCRIPTS.iterdir():
        if item.is_dir():
            if item.name in KEEP_FOLDERS:
                kept.append(item.name + "/")
                print(f"[KEEP] {item.name}/")
            else:
                # Check if matches archive pattern
                should_move = False
                for pattern in ARCHIVE_FOLDERS:
                    if pattern.endswith("*"):
                        if item.name.startswith(pattern[:-1]):
                            should_move = True
                            break
                    elif item.name == pattern:
                        should_move = True
                        break

                if should_move:
                    dest = ARCHIVE_SCRIPTS / item.name
                    shutil.move(str(item), str(dest))
                    archived.append(item.name + "/")
                    print(f"[ARCHIVE] {item.name}/")

    # Archive root-level old markdown files
    print("\nCleaning root folder...")
    root_archive_patterns = [
        "*_COMPLETE.md",
        "*_SETUP.md",
        "*_AUDIT.md",
        "*_PLAN.md",
        "*_STATUS.md",
        "*_SUMMARY.md",
        "QUICK_START.md",
        "SETUP_COMPLETE.md",
    ]

    for item in BASE.iterdir():
        if item.is_file() and item.suffix == ".md":
            name = item.name
            for pattern in root_archive_patterns:
                if pattern.startswith("*") and name.endswith(pattern[1:]):
                    dest = ARCHIVE / name
                    shutil.move(str(item), str(dest))
                    print(f"[ARCHIVE ROOT] {name}")
                    break

    # Archive old SQL/TXT files
    for ext in [".sql", ".txt"]:
        for item in BASE.glob(f"*{ext}"):
            if "SNIPPET" in item.name or "BACKUP" in item.name or "AUTO_" in item.name:
                dest = ARCHIVE / item.name
                shutil.move(str(item), str(dest))
                print(f"[ARCHIVE ROOT] {item.name}")

    # Archive old JSON files
    for item in BASE.glob("*.json"):
        dest = ARCHIVE / item.name
        shutil.move(str(item), str(dest))
        print(f"[ARCHIVE ROOT] {item.name}")

    print("\n" + "=" * 50)
    print(f"✓ Kept: {len(kept)} items")
    print(f"✓ Archived: {len(archived)} items")
    print(f"\nArchive location: {ARCHIVE}")
    print("\nCleanup complete!")

if __name__ == "__main__":
    cleanup()
