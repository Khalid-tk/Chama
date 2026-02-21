import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    timeout: 60000, // Increase timeout to 60 seconds
    seed: 'node prisma/seed.js',
  },
})
