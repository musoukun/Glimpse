# Building Glimpse for Multiple Platforms

This guide explains how to build Glimpse for Windows, macOS, and Linux.

## Prerequisites

1. Node.js (v18 or higher)
2. npm or yarn
3. Platform-specific requirements:
   - **Windows**: NSIS (for installer creation)
   - **macOS**: Xcode Command Line Tools
   - **Linux**: Various packages (see below)

## Quick Start

```bash
# Install dependencies
npm install

# Build for current platform
npm run build
npm run package

# Build for specific platforms
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
npm run package:all    # All platforms
```

## Platform-Specific Instructions

### Building for Windows

On Windows:
```bash
npm run package:win
```

This creates:
- `dist/Glimpse-Setup-{version}.exe` - NSIS installer

### Building for macOS

On macOS:
```bash
npm run package:mac
```

This creates:
- `dist/Glimpse-{version}.dmg` - DMG installer
- Supports both Intel (x64) and Apple Silicon (arm64)

**Important for macOS Distribution:**
- The app needs to be code-signed for distribution
- Set up your Apple Developer certificates
- Configure notarization for macOS 10.15+

#### Code Signing (macOS)

For signed builds, set these environment variables:
```bash
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="your-certificate-password"
```

Or use base64 encoded certificate:
```bash
# Convert certificate to base64
base64 -i certificate.p12 -o cert-base64.txt
# Set as environment variable
export CSC_LINK="base64:$(cat cert-base64.txt)"
```

To build without signing (development only):
```bash
npm run package:mac -- -c.mac.identity=null
```

### Building for Linux

On Linux:
```bash
npm run package:linux
```

This creates:
- `dist/Glimpse-{version}.AppImage` - Universal Linux package

Required packages for Linux builds:
```bash
# Debian/Ubuntu
sudo apt-get install --no-install-recommends -y libopenjp2-tools

# For building other formats
sudo apt-get install --no-install-recommends -y rpm  # For RPM
sudo apt-get install --no-install-recommends -y bsdtar  # For pacman
```

## Cross-Platform Building

You can build for multiple platforms from a single machine, with limitations:

### From Windows
- ✅ Can build: Windows, Linux
- ❌ Cannot build: macOS (requires macOS for signing)

### From macOS
- ✅ Can build: macOS, Windows, Linux
- ⚠️  Windows builds require Wine

### From Linux
- ✅ Can build: Linux, Windows
- ❌ Cannot build: macOS (requires macOS for signing)

### Using Docker (Recommended for CI)

```bash
docker run --rm -ti \
  -v ${PWD}:/project \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run package:all"
```

## Icon Requirements

Place these files in the `build/` directory:

1. **icon.png** - Base icon (at least 512x512px, preferably 1024x1024px)
2. **icon.ico** - Windows icon (create with `build/create-ico.ps1`)
3. **icon.icns** - macOS icon (create with `build/create-icns.sh`)

### Creating Platform Icons

#### Windows (ICO)
```powershell
# On Windows with ImageMagick
cd build
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

#### macOS (ICNS)
```bash
# On macOS
cd build
./create-icns.sh
```

## Build Configuration

Configuration is in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.glimpse.app",
    "productName": "Glimpse",
    "mac": {
      "category": "public.app-category.productivity",
      "hardenedRuntime": true,
      "gatekeeperAssess": false
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

## Troubleshooting

### Windows Build Issues
- Ensure NSIS is installed if building installers
- Check that `build/icon.ico` exists

### macOS Build Issues
- For "identity not found" errors, either set up certificates or use `-c.mac.identity=null`
- Ensure `build/icon.icns` exists
- Check entitlements file at `build/entitlements.mac.plist`

### Linux Build Issues
- Install required system packages (see Linux section)
- Ensure `build/icon.png` exists

## Publishing

To publish releases:

1. Set up GitHub releases token:
   ```bash
   export GH_TOKEN="your-github-token"
   ```

2. Build and publish:
   ```bash
   npm run package -- --publish always
   ```

## More Information

- [electron-builder documentation](https://www.electron.build/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Multi Platform Build](https://www.electron.build/multi-platform-build)