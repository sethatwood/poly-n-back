import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    ignores: ['dist/', 'ios/', 'android/', 'node_modules/'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      // Project uses single-word component names intentionally (Footer, Stimulus)
      'vue/multi-word-component-names': 'off',
      // Footer is a valid component name in this project despite being an HTML element
      'vue/no-reserved-component-names': 'off',
      // Required props without defaults are intentional -- parent always provides them
      'vue/require-default-prop': 'off',
      // Temporarily off during incremental TS migration (Plans 02-04 add lang="ts" to all .vue files)
      'vue/block-lang': 'off',
    },
  },
  eslintConfigPrettier,
)
