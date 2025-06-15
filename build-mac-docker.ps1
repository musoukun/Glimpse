# PowerShell script to build macOS app using Docker on Windows
# Note: This creates an unsigned DMG that requires additional steps for distribution

Write-Host "Building Glimpse for macOS using Docker..." -ForegroundColor Green
Write-Host "Note: This will create an unsigned DMG file" -ForegroundColor Yellow

# Check if Docker is installed
try {
    docker --version | Out-Null
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Run electron-builder in Docker
Write-Host "Starting Docker build..." -ForegroundColor Yellow

docker run --rm `
    -v "${PWD}:/project" `
    -w /project `
    electronuserland/builder:wine-mono `
    /bin/bash -c "npm install && npm run build && npx electron-builder --mac --config.mac.identity=null"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "DMG file is located in the 'dist' directory" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor White
    Write-Host "IMPORTANT: The DMG is unsigned. For distribution:" -ForegroundColor Yellow
    Write-Host "1. Transfer the DMG to a Mac" -ForegroundColor White
    Write-Host "2. Sign it with your Apple Developer certificate" -ForegroundColor White
    Write-Host "3. Notarize it for macOS 10.15+" -ForegroundColor White
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}