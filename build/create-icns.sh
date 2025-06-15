#!/bin/bash

# Create ICNS file for macOS from PNG
# Requires ImageMagick or iconutil (macOS native tool)

if [ ! -f "icon.png" ]; then
    echo "icon.png not found in build directory"
    exit 1
fi

# Method 1: Using iconutil (macOS only)
if command -v iconutil &> /dev/null; then
    echo "Creating ICNS using iconutil..."
    
    # Create iconset directory
    mkdir -p icon.iconset
    
    # Generate different sizes
    sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
    sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
    sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
    sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
    sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
    sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
    sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
    sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
    sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
    sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
    
    # Convert to ICNS
    iconutil -c icns icon.iconset
    
    # Clean up
    rm -rf icon.iconset
    
    echo "ICNS file created successfully: icon.icns"
    
# Method 2: Using ImageMagick
elif command -v magick &> /dev/null || command -v convert &> /dev/null; then
    echo "Creating ICNS using ImageMagick..."
    
    # Use magick if available, otherwise fall back to convert
    if command -v magick &> /dev/null; then
        CMD="magick"
    else
        CMD="convert"
    fi
    
    $CMD icon.png -resize 16x16     icon_16x16.png
    $CMD icon.png -resize 32x32     icon_32x32.png
    $CMD icon.png -resize 64x64     icon_64x64.png
    $CMD icon.png -resize 128x128   icon_128x128.png
    $CMD icon.png -resize 256x256   icon_256x256.png
    $CMD icon.png -resize 512x512   icon_512x512.png
    $CMD icon.png -resize 1024x1024 icon_1024x1024.png
    
    echo "Multiple PNG files created. Please use an online converter or macOS to create ICNS."
    echo "You can use: https://cloudconvert.com/png-to-icns"
    
else
    echo "Neither iconutil nor ImageMagick found."
    echo "Please install ImageMagick or use macOS to create ICNS file."
    echo "You can also use online converters like: https://cloudconvert.com/png-to-icns"
    exit 1
fi