import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['.vscode/*', 'dist/*', 'docker/*', 'upload/*', 'template/*', 'static/*'],
  }
];
