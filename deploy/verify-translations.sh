#!/bin/bash
# Translation Verification Script for Studiokook.ee
# Usage: bash verify-translations.sh [page_slug]
# Example: bash verify-translations.sh materjalid

SITE="https://studiokook.ee"
LANGUAGES=("et" "ru" "en" "fi")

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_page() {
    local slug=$1
    local page_name=$2

    echo ""
    echo "=========================================="
    echo "Checking: $page_name ($slug)"
    echo "=========================================="

    # Check ET (base language)
    echo -n "  ET (base): "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ $status${NC}"
    else
        echo -e "${RED}❌ $status${NC}"
    fi

    # Check RU
    echo -n "  RU:        "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/ru/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ $status${NC}"
    else
        echo -e "${RED}❌ $status${NC}"
    fi

    # Check EN
    echo -n "  EN:        "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/en/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ $status${NC}"
    else
        echo -e "${RED}❌ $status${NC}"
    fi

    # Check FI
    echo -n "  FI:        "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/fi/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✅ $status${NC}"
    else
        echo -e "${RED}❌ $status${NC}"
    fi
}

check_page_with_title() {
    local slug=$1
    local page_name=$2

    echo ""
    echo "=========================================="
    echo "Checking: $page_name ($slug)"
    echo "=========================================="

    # Check ET with title
    echo "  ET (base):"
    title=$(curl -s "$SITE/$slug/" | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g' | head -1)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "    Status: ${GREEN}✅ $status${NC}"
        echo "    Title: $title"
    else
        echo -e "    Status: ${RED}❌ $status${NC}"
    fi

    # Check RU with title
    echo "  RU:"
    title=$(curl -s "$SITE/ru/$slug/" | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g' | head -1)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/ru/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "    Status: ${GREEN}✅ $status${NC}"
        echo "    Title: $title"
    else
        echo -e "    Status: ${RED}❌ $status${NC}"
    fi

    # Check EN with title
    echo "  EN:"
    title=$(curl -s "$SITE/en/$slug/" | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g' | head -1)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/en/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "    Status: ${GREEN}✅ $status${NC}"
        echo "    Title: $title"
    else
        echo -e "    Status: ${RED}❌ $status${NC}"
    fi

    # Check FI with title
    echo "  FI:"
    title=$(curl -s "$SITE/fi/$slug/" | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g' | head -1)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/fi/$slug/")
    if [ "$status" -eq 200 ]; then
        echo -e "    Status: ${GREEN}✅ $status${NC}"
        echo "    Title: $title"
    else
        echo -e "    Status: ${RED}❌ $status${NC}"
    fi
}

# If argument provided, check single page
if [ -n "$1" ]; then
    check_page_with_title "$1" "$1"
    exit 0
fi

# Otherwise, check all priority pages
echo "=========================================="
echo "TRANSLATION VERIFICATION REPORT"
echo "Site: $SITE"
echo "Date: $(date +%Y-%m-%d)"
echo "=========================================="

# Priority pages
echo ""
echo "=========================================="
echo "PRIORITY PAGES (HIGH)"
echo "=========================================="

check_page "" "Homepage"
check_page "hinnaparing" "Price Inquiry"
check_page "kontakt" "Contact"
check_page "koogid" "Gallery"

echo ""
echo "=========================================="
echo "PRIORITY PAGES (MEDIUM)"
echo "=========================================="

check_page "materjalid" "Materials"
check_page "toopinnad" "Worktops"
check_page "fassaadid" "Facades"
check_page "koogid-eritellimusel" "Custom Kitchens"

echo ""
echo "=========================================="
echo "PRODUCT PAGES - Worktops"
echo "=========================================="

check_page "hpl-tootasapinnad" "HPL Kompaktlaminaat"
check_page "kividest-tootasapinnad" "Stone Worktops"
check_page "laminaadist-tootasapinnad" "Laminate Worktops"

echo ""
echo "=========================================="
echo "PRODUCT PAGES - Facades"
echo "=========================================="

check_page "egger-fassaadid" "Egger Facades"
check_page "fenix" "Fenix"
check_page "egger" "Egger"
check_page "monokroom" "Monochrome"
check_page "puit" "Wood"
check_page "kivi" "Stone"

echo ""
echo "=========================================="
echo "HARDWARE PAGES"
echo "=========================================="

check_page "meie-furnituur" "Our Hardware"
check_page "ladustamissusteemid" "Storage Systems"
check_page "nurgamehhanismid" "Corner Mechanisms"
check_page "sahtlid" "Drawers"
check_page "tostemehhanismid" "Lift Mechanisms"

echo ""
echo "=========================================="
echo "COMPANY PAGES"
echo "=========================================="

check_page "valmistamine" "Manufacturing"
check_page "privacy" "Privacy Policy"

echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "Legend:"
echo -e "  ${GREEN}✅ 200${NC} = Page exists and accessible"
echo -e "  ${YELLOW}⚠️  301/302${NC} = Redirect (check if correct)"
echo -e "  ${RED}❌ 404${NC} = Page not found (translation missing)"
echo ""
