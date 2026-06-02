# Try different common PostgreSQL passwords
$passwords = @("postgres", "admin", "root", "", "password", "12345", "123456")
$pgPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $pgPath)) {
    $pgPath = "C:\Program Files\PostgreSQL\13\bin\psql.exe"
}

Write-Host "Testing different passwords..." -ForegroundColor Cyan
Write-Host ""

foreach ($pwd in $passwords) {
    $env:PGPASSWORD = $pwd
    $displayPwd = if ($pwd -eq "") { "(empty)" } else { $pwd }
    Write-Host "Trying password: $displayPwd" -ForegroundColor Yellow
    
    $output = & $pgPath -h your-db-host -p 5432 -U postgres -d webapp -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! Password is: $displayPwd" -ForegroundColor Green
        Write-Host ""
        Write-Host "Update your .env file with:" -ForegroundColor Cyan
        Write-Host "DB_PASSWORD=$pwd" -ForegroundColor White
        exit 0
    }
}

Write-Host ""
Write-Host "None of the common passwords worked." -ForegroundColor Red
Write-Host "Please check your PostgreSQL password or reset it." -ForegroundColor Yellow

