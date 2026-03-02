import pluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', 'ios/', 'android/', 'node_modules/'],
  },
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Project uses single-word component names intentionally (Footer, Stimulus)
      'vue/multi-word-component-names': 'off',
      // Footer is a valid component name in this project despite being an HTML element
      'vue/no-reserved-component-names': 'off',
      // Required props without defaults are intentional -- parent always provides them
      'vue/require-default-prop': 'off',
    },
  },
  eslintConfigPrettier,
];
