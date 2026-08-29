// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'examples/', 'docs/', 'coverage/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // The serializer and simulation layers intentionally use `as any`
      // to restore protected state; revisit in the v0.2 serializer rework.
      '@typescript-eslint/no-explicit-any': 'off',
      // `_`-prefixed unused args are the project convention (see CLAUDE.md).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  }
);
