# ðŸ§ª Test Database Connection
# Run this AFTER you've reset the password in pgAdmin

param(
    [Parameter(Mandatory = $true)]
    [string]$Password
)

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host "  PostgreSQL Connection Test" -ForegroundColor Cyan
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# Configuration
$env:PGPASSWORD = $Password
$pgPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\13\bin\psql.exe"
}

if (-not (Test-Path $pgPath)) {
    Write-Host "âŒ ERROR: psql.exe not found" -ForegroundColor Red
    Write-Host "   Expected location: C:\Program Files\PostgreSQL\18\bin\psql.exe" -ForegroundColor Yellow
    exit 1
}

Write-Host "âœ“ Found psql at: $pgPath" -ForegroundColor Green
Write-Host ""

# Test 1: Connection
Write-Host "Test 1: Testing connection..." -ForegroundColor Yellow
$output = & $pgPath -h your-db-host -p 5432 -U postgres -d webapp -c "SELECT 'Connected!' as status;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ“ Connection successful!" -ForegroundColor Green
    Write-Host ""
    
    # Test 2: Database exists
    Write-Host "Test 2: Checking database..." -ForegroundColor Yellow
    $dbCheck = & $pgPath -h your-db-host -p 5432 -U postgres -d webapp -c "SELECT current_database();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "âœ“ Database 'webapp' exists and is accessible" -ForegroundColor Green
    }
    Write-Host ""
    
    # Test 3: List tables
    Write-Host "Test 3: Listing tables..." -ForegroundColor Yellow
    $tables = & $pgPath -h your-db-host -p 5432 -U postgres -d webapp -c "\dt" 2>&1
    if ($tables -match "Did not find any relations") {
        Write-Host "âœ“ Database is empty (tables will be created on first app start)" -ForegroundColor Green
    }
    else {
        Write-Host "âœ“ Found existing tables:" -ForegroundColor Green
        Write-Host $tables
    }
    Write-Host ""
    
    # Update .env file
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
    Write-Host "  Next Steps" -ForegroundColor Cyan
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Update your .env file:" -ForegroundColor Yellow
    Write-Host "   DB_PASSWORD=$Password" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Start your application:" -ForegroundColor Yellow
    Write-Host "   npm run start:dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Would you like me to update the .env file automatically? (Y/N)" -ForegroundColor Cyan
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        $envPath = ".env"
        $envContent = Get-Content $envPath -Raw
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$Password"
        Set-Content $envPath $envContent -NoNewline
        Write-Host "âœ“ .env file updated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run: npm run start:dev" -ForegroundColor Cyan
    }
    
}
else {
    Write-Host "âŒ Connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $output -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure you've reset the password in pgAdmin first" -ForegroundColor White
    Write-Host "2. Double-check the password you entered" -ForegroundColor White
    Write-Host "3. Ensure PostgreSQL service is running (services.msc)" -ForegroundColor White
    Write-Host ""
    Write-Host "See RESET_PASSWORD_GUIDE.md for detailed instructions" -ForegroundColor Cyan
    exit 1
}

