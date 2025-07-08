# Database Setup Guide

This guide will help you set up a PostgreSQL database for the PortalPro application.

## Prerequisites

- PostgreSQL 12 or higher installed
- Node.js and npm installed
- Access to create databases and users in PostgreSQL

## Setup Steps

### 1. Install PostgreSQL (if not already installed)

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Database and User

Connect to PostgreSQL as the superuser:
```bash
psql -U postgres
```

Run the following SQL commands:
```sql
-- Create a new user
CREATE USER portalpro_user WITH PASSWORD 'your_secure_password';

-- Create the database
CREATE DATABASE portalpro_db OWNER portalpro_user;

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE portalpro_db TO portalpro_user;

-- Exit psql
\q
```

### 3. Update Environment Variables

Update your `.env` file with the correct database connection string:

```env
DATABASE_URL="postgresql://portalpro_user:your_secure_password@localhost:5432/portalpro_db?schema=public"
```

Replace `your_secure_password` with the password you set in step 2.

### 4. Generate and Set JWT Secret

A secure JWT secret has been generated for you:
```
NcQn0H8RqF5Oxbv8dItBNxffNgv6mNKHH8Kg7jxKeio=
```

Update your `.env` file:
```env
JWT_SECRET="NcQn0H8RqF5Oxbv8dItBNxffNgv6mNKHH8Kg7jxKeio="
```

**For production**, generate your own secret using:
```bash
openssl rand -base64 32
```

### 5. Run Database Migrations

Generate Prisma client and run migrations:
```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# (Optional) Seed the database with sample data
npm run db:seed
```

### 6. Verify Database Connection

Test your database connection:
```bash
npm run db:studio
```

This will open Prisma Studio in your browser where you can view and manage your database.

## Troubleshooting

### Connection Refused Error
If you get a connection refused error:
1. Make sure PostgreSQL is running: `pg_ctl status` or `systemctl status postgresql`
2. Check that PostgreSQL is listening on the correct port (default 5432)
3. Verify your connection string in `.env`

### Authentication Failed
If authentication fails:
1. Double-check the username and password in your connection string
2. Make sure the user has the necessary privileges
3. Check PostgreSQL's `pg_hba.conf` file for authentication settings

### Migration Errors
If migrations fail:
1. Make sure the database exists and is accessible
2. Check that the user has CREATE TABLE privileges
3. Look for any existing tables that might conflict

## Optional: Redis Setup (for caching)

Redis is optional but recommended for better performance:

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

The application will automatically use Redis if it's running on localhost:6379. If Redis is not available, it will fall back to in-memory caching.

## Next Steps

1. Start the development server: `npm run dev`
2. Visit http://localhost:3000
3. Create a new account at http://localhost:3000/auth/signup
4. Start using the application!

## Security Notes

- Always use strong passwords for database users
- Never commit `.env` files to version control
- Use different credentials for development and production
- Regularly update your JWT secret in production
- Enable SSL for database connections in production