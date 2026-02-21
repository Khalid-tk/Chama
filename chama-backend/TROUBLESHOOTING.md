# Troubleshooting Prisma Migration Lock Issues

## Problem: Advisory Lock Timeout (P1002)

If you encounter `Error: P1002 - The database server was reached but timed out` with advisory lock errors, try these solutions:

### Solution 1: Wait and Retry
Sometimes a migration is still running. Wait a few seconds and try again:
```bash
npm run prisma:migrate
```

### Solution 2: Check for Running Processes
Make sure no other Prisma processes are running:
- Close any terminals running `prisma migrate dev` or `prisma studio`
- Check Task Manager for Node.js processes
- Kill any hanging Prisma processes

### Solution 3: Clear Stale Locks (PostgreSQL)
If a lock is stuck, you can manually clear it:

1. Connect to your PostgreSQL database:
```bash
psql -U postgres -d chama1_db
```

2. Check for active advisory locks:
```sql
SELECT * FROM pg_locks WHERE locktype = 'advisory';
```

3. If you see locks with `objid = 72707369` (or similar), you can release them:
```sql
SELECT pg_advisory_unlock_all();
```

4. Exit psql:
```sql
\q
```

5. Try migration again:
```bash
npm run prisma:migrate
```

### Solution 4: Restart PostgreSQL Service
Sometimes restarting PostgreSQL helps clear locks:

**Windows (as Administrator):**
```powershell
# Stop PostgreSQL
net stop postgresql-x64-XX

# Start PostgreSQL
net start postgresql-x64-XX
```

**Or use Services:**
1. Press `Win + R`, type `services.msc`
2. Find "PostgreSQL" service
3. Right-click → Restart

### Solution 5: Use `prisma migrate deploy` Instead
If you're deploying to production or want to skip the interactive prompt:
```bash
npx prisma migrate deploy
```

### Solution 6: Check Database Connection
Verify your database is accessible:
```bash
# Test connection
psql -U postgres -d chama1_db -c "SELECT 1;"
```

If connection fails, check:
- PostgreSQL service is running
- `.env` file has correct `DATABASE_URL`
- Database `chama1_db` exists

### Solution 7: Create Fresh Migration
If all else fails, you can create a fresh migration:
```bash
# Reset migrations (WARNING: This will drop all data!)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name init
```

## Prevention
- Always wait for migrations to complete before starting new ones
- Close Prisma Studio before running migrations
- Don't run multiple migration commands simultaneously
- Ensure database connections are properly closed in your application
