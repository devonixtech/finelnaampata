# Test PostgreSQL Connection
$env:PGPASSWORD = "postgres"

Write-Host "Testing PostgreSQL Connection..." -ForegroundColor Cyan
Write-Host "Host: your-db-host" -ForegroundColor Gray
Write-Host "Port: 5432" -ForegroundColor Gray
Write-Host "User: postgres" -ForegroundColor Gray
Write-Host "Database: webapp" -ForegroundColor Gray
Write-Host ""

# Find PostgreSQL installation
$pgPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\13\bin\psql.exe"
}

if (Test-Path $pgPath) {
    Write-Host "Found psql at: $pgPath" -ForegroundColor Green
    
    # Test connection
    & $pgPath -h your-db-host -p 5432 -U postgres -d webapp -c "SELECT version();"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nConnection successful!" -ForegroundColor Green
        
        # List tables
        Write-Host "`nListing tables in webapp database:" -ForegroundColor Cyan
        & $pgPath -h your-db-host -p 5432 -U postgres -d webapp -c "\dt"
    }
    else {
        Write-Host "`nConnection failed!" -ForegroundColor Red
        Write-Host "The database 'webapp' might not exist." -ForegroundColor Yellow
        Write-Host "`nTrying to create database..." -ForegroundColor Cyan
        & $pgPath -h your-db-host -p 5432 -U postgres -d postgres -c "CREATE DATABASE webapp;"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database 'webapp' created successfully!" -ForegroundColor Green
        }
    }
}
else {
    Write-Host "PostgreSQL psql not found in standard locations" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed" -ForegroundColor Yellow
}

