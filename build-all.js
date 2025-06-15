#!/usr/bin/env node

import { build, Platform } from 'electron-builder';
import { execSync } from 'child_process';
import { platform } from 'os';

// Determine which platforms to build for based on current OS
const currentPlatform = platform();
let targets = [];

// Parse command line arguments
const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const buildMac = args.includes('--mac') || args.includes('-m');
const buildWin = args.includes('--win') || args.includes('-w');
const buildLinux = args.includes('--linux') || args.includes('-l');

console.log('🚀 Glimpse Multi-Platform Build Tool');
console.log('====================================\n');

// Determine targets
if (buildAll) {
    console.log('📦 Building for all platforms...\n');
    targets = [Platform.MAC, Platform.WINDOWS, Platform.LINUX];
} else if (buildMac || buildWin || buildLinux) {
    if (buildMac) targets.push(Platform.MAC);
    if (buildWin) targets.push(Platform.WINDOWS);
    if (buildLinux) targets.push(Platform.LINUX);
} else {
    // Default: build for current platform
    switch (currentPlatform) {
        case 'darwin':
            targets = [Platform.MAC];
            break;
        case 'win32':
            targets = [Platform.WINDOWS];
            break;
        case 'linux':
            targets = [Platform.LINUX];
            break;
        default:
            console.error('❌ Unsupported platform:', currentPlatform);
            process.exit(1);
    }
}

// Show warning for cross-platform builds
if (currentPlatform !== 'darwin' && targets.includes(Platform.MAC)) {
    console.warn('⚠️  Warning: Building for macOS on a non-macOS system.');
    console.warn('   Code signing and notarization will not be available.\n');
}

// Build configuration
const config = {
    config: {
        // Use the configuration from package.json
        extends: null,
    }
};

// Add specific configurations for unsigned builds
if (currentPlatform !== 'darwin' && targets.includes(Platform.MAC)) {
    config.config.mac = {
        identity: null,
        hardenedRuntime: false,
        gatekeeperAssess: false
    };
}

// Show build targets
console.log('🎯 Build targets:');
targets.forEach(target => {
    const targetName = target.name.charAt(0).toUpperCase() + target.name.slice(1);
    console.log(`   - ${targetName}`);
});
console.log('');

// Check for required files
console.log('📋 Pre-build checks:');
try {
    // Check if icon files exist
    const iconChecks = [
        { file: 'build/icon.png', platform: 'All platforms' },
        { file: 'build/icon.ico', platform: 'Windows' },
        { file: 'build/icon.icns', platform: 'macOS' }
    ];
    
    iconChecks.forEach(check => {
        try {
            execSync(`ls ${check.file}`, { stdio: 'ignore' });
            console.log(`   ✅ ${check.file} (${check.platform})`);
        } catch {
            console.log(`   ⚠️  ${check.file} not found (required for ${check.platform})`);
        }
    });
    console.log('');
} catch (error) {
    console.error('❌ Pre-build check failed:', error.message);
}

// Run the build
console.log('🔨 Starting build process...\n');

build({
    targets: targets.map(platform => platform.createTarget()),
    ...config
})
.then((result) => {
    console.log('\n✅ Build completed successfully!');
    console.log('\n📁 Output files:');
    result.forEach(file => {
        console.log(`   - ${file}`);
    });
})
.catch((error) => {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
});

// Show post-build instructions
process.on('exit', (code) => {
    if (code === 0) {
        console.log('\n📝 Post-build notes:');
        if (targets.includes(Platform.MAC) && currentPlatform !== 'darwin') {
            console.log('   - macOS DMG was built but is not signed/notarized');
            console.log('   - For distribution, build on a Mac with proper certificates');
        }
        console.log('   - All builds are located in the "dist" directory');
        console.log('\n🎉 Happy distributing!');
    }
});