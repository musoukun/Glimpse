# PowerShell script to build Windows package
# Run this script from Windows PowerShell (not WSL)

Write-Host "Building Glimpse for Windows..." -ForegroundColor Green

# Ensure we're in the correct directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Build the application
Write-Host "Running build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Package for Windows
Write-Host "Creating Windows installer..." -ForegroundColor Yellow
npm run package

if ($LASTEXITCODE -ne 0) {
    Write-Host "Packaging failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "Installer can be found in the 'dist' directory" -ForegroundColor Cyan