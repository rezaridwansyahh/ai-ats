/**
 * Local ESLint Rules for Myralix ATS
 *
 * Custom rules to enforce design system best practices
 */

export default {
  'no-hardcoded-hex': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Disallow hardcoded hex colors in JSX style attributes',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        noHardcodedHex: 'Avoid hardcoded hex colors. Use CSS variables instead (e.g., var(--background), var(--primary))',
      },
      schema: [],
    },
    create(context) {
      return {
        JSXAttribute(node) {
          // Check if attribute is "style"
          if (node.name.name !== 'style') return;

          // Get the value (JSXExpressionContainer with ObjectExpression)
          const value = node.value;
          if (!value || value.type !== 'JSXExpressionContainer') return;

          const expression = value.expression;
          if (!expression || expression.type !== 'ObjectExpression') return;

          // Check each property in the style object
          expression.properties.forEach((prop) => {
            if (prop.type !== 'Property') return;

            const propValue = prop.value;

            // Check for Literal string values with hex colors
            if (propValue.type === 'Literal' && typeof propValue.value === 'string') {
              const hexRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
              if (hexRegex.test(propValue.value)) {
                context.report({
                  node: propValue,
                  messageId: 'noHardcodedHex',
                });
              }
            }
          });
        },
      };
    },
  },

  'prefer-css-variables': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Prefer Tailwind classes over inline styles for colors',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        preferCssVars: 'Use Tailwind classes (e.g., bg-background, text-foreground) instead of inline styles for better theme support',
      },
      schema: [],
    },
    create(context) {
      const colorProperties = ['background', 'backgroundColor', 'color', 'borderColor', 'fill', 'stroke'];

      return {
        JSXAttribute(node) {
          if (node.name.name !== 'style') return;

          const value = node.value;
          if (!value || value.type !== 'JSXExpressionContainer') return;

          const expression = value.expression;
          if (!expression || expression.type !== 'ObjectExpression') return;

          expression.properties.forEach((prop) => {
            if (prop.type !== 'Property') return;

            const propName = prop.key.name || prop.key.value;

            // Report if using color-related properties
            if (colorProperties.includes(propName)) {
              context.report({
                node: prop,
                messageId: 'preferCssVars',
              });
            }
          });
        },
      };
    },
  },
};
