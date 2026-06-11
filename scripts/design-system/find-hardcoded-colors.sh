#!/bin/bash
#
# find-hardcoded-colors.sh
# Find all hardcoded hex colors in JSX/JS files
#
# Usage: ./find-hardcoded-colors.sh [directory]
# Example: ./find-hardcoded-colors.sh frontend/src/components

set -e

DIR="${1:-frontend/src/components}"
TEMP_FILE=$(mktemp)

echo "🔍 Searching for hardcoded hex colors in $DIR..."
echo ""

# Find all files with hardcoded hex colors in style attributes
grep -rn "style={{.*#[0-9A-Fa-f]\{6\}" "$DIR" \
  --include="*.jsx" --include="*.tsx" --include="*.js" \
  > "$TEMP_FILE" 2>/dev/null || true

if [ ! -s "$TEMP_FILE" ]; then
  echo "✅ No hardcoded hex colors found!"
  rm "$TEMP_FILE"
  exit 0
fi

# Count total occurrences
TOTAL=$(wc -l < "$TEMP_FILE" | tr -d ' ')

echo "❌ Found $TOTAL instances of hardcoded hex colors:"
echo ""

# Group by file and show unique files
echo "📁 Files with hardcoded colors:"
awk -F: '{print $1}' "$TEMP_FILE" | sort -u | while read -r file; do
  COUNT=$(grep -c "^$file:" "$TEMP_FILE")
  echo "   - $file ($COUNT instances)"
done

echo ""
echo "📊 Top 5 most common colors:"
grep -o "#[0-9A-Fa-f]\{6\}" "$TEMP_FILE" | sort | uniq -c | sort -rn | head -5 | \
  awk '{printf "   - %s (%d times)\n", $2, $1}'

echo ""
echo "💡 Recommendations:"
echo "   1. Replace with CSS variables (e.g., var(--background))"
echo "   2. Use Tailwind classes (e.g., bg-background, text-foreground)"
echo "   3. Run: ./replace-color.sh <OLD_COLOR> <NEW_COLOR>"

rm "$TEMP_FILE"
exit 1
