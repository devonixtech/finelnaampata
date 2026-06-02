# ðŸ” PostgreSQL Password Reset Guide

## Step 1: Reset Password in pgAdmin

1. Open **pgAdmin**
2. Connect to **PostgreSQL 18** server (it should connect automatically)
3. Click on **PostgreSQL 18** in the left panel
4. Click **Tools** â†’ **Query Tool** (or press Alt+Shift+Q)
5. Copy and paste this SQL (replace `YourNewPassword` with your chosen password):

```sql
ALTER USER postgres WITH PASSWORD 'YourNewPassword';
```

6. Click the **Execute** button (â–¶ï¸) or press **F5**
7. You should see: `ALTER ROLE` in the output panel

## Step 2: Update .env File

1. Open `apps/api/.env`
2. Update the password line:

```env
DB_PASSWORD=YourNewPassword
```

**Important**: Use the EXACT same password from Step 1, no quotes!

## Step 3: Test Connection

Run this in PowerShell (from `apps/api` directory):

```powershell
# Replace YourNewPassword with your actual password
$env:PGPASSWORD = "YourNewPassword"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -c "SELECT 'Connection successful!' as status;"
```

Expected output:
```
       status
--------------------
 Connection successful!
```

## Step 4: Start Your Application

```powershell
npm run start:dev
```

You should see:
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [TypeOrmModule] Database connected successfully
[Nest] LOG [NestApplication] Nest application successfully started
```

## Troubleshooting

### If you get "database does not exist"

Run in pgAdmin Query Tool:
```sql
CREATE DATABASE webapp;
```

### If you get "peer authentication failed"

Check `pg_hba.conf` file at:
`C:\Program Files\PostgreSQL\18\data\pg_hba.conf`

Ensure this line exists:
```
host    all             all             your-db-private-ip/32            scram-sha-256
```

### If connection still fails

1. Verify PostgreSQL service is running:
   - Press `Win + R`
   - Type `services.msc`
   - Find "postgresql-x64-18"
   - Status should be "Running"

2. Set your production database host in `.env`:
   ```env
   DB_HOST=your-db-host
   ```

## Security Notes

- **Development**: Simple passwords are OK
- **Production**: Use strong passwords (16+ chars, mixed case, numbers, symbols)
- **Never commit** `.env` file to Git (it's in `.gitignore`)
- **Use environment variables** in production, not `.env` files


