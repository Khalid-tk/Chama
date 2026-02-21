// Run before any tests: use test DB if provided
process.env.NODE_ENV = 'test'
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
}
