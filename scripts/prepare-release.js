#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

// package.jsonからバージョンを取得
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const platform = os.platform();

console.log(`📦 Preparing release for version ${version}...`);
console.log(`🖥️  Platform: ${platform}`);

// 1. ビルドを実行
console.log('\n🔨 Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// 2. 現在のプラットフォーム用にのみパッケージを作成
if (platform === 'win32') {
  console.log('\n📦 Packaging for Windows...');
  try {
    execSync('npm run package:win', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Packaging for Windows failed');
    process.exit(1);
  }
} else {
  console.log('\n⚠️  Note: macOS and Linux builds should be done via GitHub Actions');
  console.log('   This script only supports Windows packaging locally.');
}

// 3. Windows用のlatest.ymlを生成
const windowsExePath = join('dist', `Glimpse-Setup-${version}.exe`);
if (existsSync(windowsExePath)) {
  console.log('\n📝 Generating latest.yml for Windows...');
  try {
    execSync(`node scripts/generate-latest-yml.js "${windowsExePath}" ${version}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to generate latest.yml');
  }
}

// 4. リリースアセットの一覧を表示
console.log('\n📋 Release assets:');
const distFiles = [
  `Glimpse-Setup-${version}.exe`,
  `Glimpse-${version}.dmg`,
  `Glimpse-${version}.AppImage`,
  'latest.yml',
  'latest-mac.yml',
  'latest-linux.yml'
];

for (const file of distFiles) {
  const filePath = join('dist', file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file}`);
  }
}

console.log('\n✨ Release preparation complete!');
console.log('\nNext steps:');
console.log('1. Create a git tag: git tag v' + version);
console.log('2. Push the tag: git push origin v' + version);
console.log('3. GitHub Actions will create the release automatically');
console.log('\nOr manually upload the files in dist/ to your GitHub release.');