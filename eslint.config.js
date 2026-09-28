const expoConfig = require('eslint-config-expo/flat');

// Remove all react/ and problematic import/ rules from expo config because they crash ESLint 10 due to context api changes
const sanitizedConfig = expoConfig.map(configObj => {
  if (configObj.rules) {
    const newRules = { ...configObj.rules };
    for (const key of Object.keys(newRules)) {
      if (key.startsWith('react/') || key.startsWith('import/')) {
        delete newRules[key];
      }
    }
    return { ...configObj, rules: newRules };
  }
  return configObj;
});

module.exports = [
  ...sanitizedConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'web-build/**'],
  },
  {
    rules: {
      // Custom overrides
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
];
