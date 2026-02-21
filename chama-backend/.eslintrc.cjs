module.exports = {
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: ['eslint:recommended'],
  ignorePatterns: ['node_modules/', 'dist/', 'prisma/migrations/'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
}
