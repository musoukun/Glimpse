# PowerShell script to convert PNG to ICO using ImageMagick
$pngPath = ".\icon.png"
$icoPath = ".\icon.ico"

if (Test-Path $pngPath) {
    # Try to use ImageMagick
    try {
        magick convert $pngPath -define icon:auto-resize=256,128,64,48,32,16 $icoPath
        Write-Host "ICO file created successfully using ImageMagick"
    } catch {
        Write-Host "ImageMagick not found. Please install ImageMagick or use an online converter."
        Write-Host "You can download ImageMagick from: https://imagemagick.org/script/download.php"
    }
} else {
    Write-Host "icon.png not found in build directory"
}