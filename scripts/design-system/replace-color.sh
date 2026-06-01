#!/bin/bash
#
# replace-color.sh
# Replace a hex color across all JSX/JS files
#
# Usage: ./replace-color.sh <OLD_COLOR> <NEW_COLOR> [directory]
# Example: ./replace-color.sh "#F8FAFC" "#FAF9F5" frontend/src/components

set -e

OLD_COLOR="$1"
NEW_COLOR="$2"
DIR="${3:-frontend/src/components}"

if [ -z "$OLD_COLOR" ] || [ -z "$NEW_COLOR" ]; then
  echo "❌ Error: Missing arguments"
  echo ""
  echo "Usage: $0 <OLD_COLOR> <NEW_COLOR> [directory]"
  echo ""
  echo "Examples:"
  echo "  $0 '#F8FAFC' '#FAF9F5'"
  echo "  $0 '#E2E8F0' '#E9E3D5' frontend/src"
  exit 1
fi

# Validate hex color format
if ! echo "$OLD_COLOR" | grep -qE '^#[0-9A-Fa-f]{6}$'; then
  echo "❌ Error: OLD_COLOR must be a valid hex color (e.g., #F8FAFC)"
  exit 1
fi

if ! echo "$NEW_COLOR" | grep -qE '^#[0-9A-Fa-f]{6}$'; then
  echo "❌ Error: NEW_COLOR must be a valid hex color (e.g., #FAF9F5)"
  exit 1
fi

echo "🔄 Replacing $OLD_COLOR → $NEW_COLOR in $DIR..."
echo ""

# Count occurrences before replacement
BEFORE=$(grep -r "$OLD_COLOR" "$DIR" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')

if [ "$BEFORE" -eq 0 ]; then
  echo "✅ No occurrences of $OLD_COLOR found."
  exit 0
fi

echo "📊 Found $BEFORE occurrences"
echo ""

# Show files that will be modified
echo "📁 Files to be modified:"
grep -rl "$OLD_COLOR" "$DIR" --include="*.jsx" --include="*.js" 2>/dev/null | \
  while read -r file; do
    COUNT=$(grep -c "$OLD_COLOR" "$file")
    echo "   - $file ($COUNT instances)"
  done

echo ""
read -p "❓ Continue with replacement? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted"
  exit 1
fi

# Perform replacement (macOS uses -i '' for in-place editing)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  find "$DIR" -type f \( -name "*.jsx" -o -name "*.js" \) \
    -exec sed -i '' "s/$OLD_COLOR/$NEW_COLOR/g" {} +
else
  # Linux
  find "$DIR" -type f \( -name "*.jsx" -o -name "*.js" \) \
    -exec sed -i "s/$OLD_COLOR/$NEW_COLOR/g" {} +
fi

# Count occurrences after replacement
AFTER=$(grep -r "$OLD_COLOR" "$DIR" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "✅ Replacement complete!"
echo "   Before: $BEFORE occurrences"
echo "   After:  $AFTER occurrences"
echo "   Replaced: $((BEFORE - AFTER)) instances"

if [ "$AFTER" -gt 0 ]; then
  echo ""
  echo "⚠️  Warning: $AFTER occurrences still remain (may be in strings/comments)"
fi

echo ""
echo "💡 Next steps:"
echo "   1. Review changes: git diff"
echo "   2. Test the app: npm run dev"
echo "   3. Commit: git add . && git commit -m 'refactor: replace $OLD_COLOR with $NEW_COLOR'"
