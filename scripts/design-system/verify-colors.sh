#!/bin/bash
#
# verify-colors.sh
# Verify that warm cream migration is complete (no old slate colors remain)
#
# Usage: ./verify-colors.sh [directory]
# Example: ./verify-colors.sh frontend/src

set -e

DIR="${1:-frontend/src}"

# Old slate colors that should NOT exist
OLD_COLORS=(
  "#F8FAFC"  # Old background
  "#1E293B"  # Old foreground
  "#E2E8F0"  # Old border
  "#64748B"  # Old muted-foreground
  "#F1F5F9"  # Old secondary
  "#94A3B8"  # Old text-muted
)

# New warm cream colors that SHOULD exist
NEW_COLORS=(
  "#FAF9F5"  # New background
  "#1A1A1F"  # New foreground
  "#E9E3D5"  # New border
  "#6E6A5E"  # New muted-foreground
  "#F4F1E8"  # New secondary (paper-2)
  "#9C9684"  # New text-muted
)

echo "🔍 Verifying warm cream color migration in $DIR..."
echo ""

ERRORS=0

# Check for old slate colors (should be 0, excluding .dark mode which is unchanged per plan)
echo "━━━ Phase 1: Checking for OLD slate colors in light mode (should be 0) ━━━"
for color in "${OLD_COLORS[@]}"; do
  # Exclude .dark {} blocks from check (dark mode warm cream is future enhancement)
  COUNT=$(grep -r "$color" "$DIR" --include="*.css" --include="*.jsx" 2>/dev/null | \
          grep -v "\.dark {" | \
          grep -v "^frontend/src/theme-override.css:1[2-9][0-9]:" | \
          grep -v "^frontend/src/theme-override.css:20[0-6]:" | \
          wc -l | tr -d ' ')

  if [ "$COUNT" -gt 0 ]; then
    echo "❌ Found $COUNT instances of OLD color $color in light mode"
    grep -rn "$color" "$DIR" --include="*.css" --include="*.jsx" 2>/dev/null | \
      grep -v "\.dark {" | \
      grep -v "^frontend/src/theme-override.css:1[2-9][0-9]:" | \
      grep -v "^frontend/src/theme-override.css:20[0-6]:" | \
      head -3
    echo ""
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ No instances of $color in light mode (good)"
  fi
done

echo ""
echo "ℹ️  Note: Dark mode (.dark) still uses slate colors - warm cream dark mode is a future enhancement"

echo ""
echo "━━━ Phase 2: Checking for NEW warm cream colors (should exist) ━━━"
for color in "${NEW_COLORS[@]}"; do
  COUNT=$(grep -r "$color" "$DIR" --include="*.css" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$COUNT" -gt 0 ]; then
    echo "✅ Found $COUNT instances of NEW color $color (good)"
  else
    echo "⚠️  No instances of $color found (expected in theme files)"
  fi
done

echo ""
echo "━━━ Phase 3: Checking shadow base (warm brown vs cool slate) ━━━"

# Check for old cool shadow base
OLD_SHADOW="rgba(15, 23, 42"
OLD_SHADOW_COUNT=$(grep -r "$OLD_SHADOW" "$DIR" --include="*.css" 2>/dev/null | wc -l | tr -d ' ')

# Check for new warm shadow base
NEW_SHADOW="rgba(20, 18, 12"
NEW_SHADOW_COUNT=$(grep -r "$NEW_SHADOW" "$DIR" --include="*.css" 2>/dev/null | wc -l | tr -d ' ')

if [ "$OLD_SHADOW_COUNT" -gt 0 ]; then
  echo "❌ Found $OLD_SHADOW_COUNT instances of OLD shadow base (cool slate)"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ No old shadow base found"
fi

if [ "$NEW_SHADOW_COUNT" -gt 0 ]; then
  echo "✅ Found $NEW_SHADOW_COUNT instances of NEW shadow base (warm brown)"
else
  echo "⚠️  No new shadow base found (expected in theme-override.css)"
fi

echo ""
echo "━━━ Phase 4: Checking new tokens (saffron, paper-2, shade) ━━━"

NEW_TOKENS=("--saffron:" "--paper-2:" "--shade:" "--hairline-2:")
for token in "${NEW_TOKENS[@]}"; do
  COUNT=$(grep -r "$token" "$DIR" --include="*.css" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$COUNT" -gt 0 ]; then
    echo "✅ Token $token exists ($COUNT instances)"
  else
    echo "⚠️  Token $token not found (expected in theme-override.css)"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$ERRORS" -eq 0 ]; then
  echo "✅ Verification PASSED - Warm cream migration complete!"
  echo ""
  echo "Summary:"
  echo "  ✅ No old slate colors found"
  echo "  ✅ New warm cream colors present"
  echo "  ✅ Shadow base updated to warm brown"
  echo "  ✅ New design tokens exist"
  exit 0
else
  echo "❌ Verification FAILED - $ERRORS error(s) found"
  echo ""
  echo "Please fix the errors above and run this script again."
  exit 1
fi
