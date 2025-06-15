#!/usr/bin/env node

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { basename, join } from 'path';

// 引数からファイルパスとバージョンを取得
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node generate-latest-yml.js <installer-path> <version>');
  console.error('Example: node generate-latest-yml.js dist/Glimpse-Setup-0.1.2.exe 0.1.2');
  process.exit(1);
}

const installerPath = args[0];
const version = args[1];

// ファイルが存在するか確認
if (!existsSync(installerPath)) {
  console.error(`Error: Installer file not found: ${installerPath}`);
  process.exit(1);
}

// ファイル情報を取得
const stats = statSync(installerPath);
const fileSize = stats.size;
const fileName = basename(installerPath);

// SHA512ハッシュを計算
console.log('Calculating SHA512 hash...');
const fileBuffer = readFileSync(installerPath);
const hash = createHash('sha512');
hash.update(fileBuffer);
const sha512 = hash.digest('base64');

// latest.yml の内容を生成（手動でYAML形式を作成）
const yamlContent = `version: ${version}
files:
  - url: ${fileName}
    sha512: ${sha512}
    size: ${fileSize}
path: ${fileName}
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
`;

// YAMLファイルを出力
const outputPath = join('dist', 'latest.yml');
writeFileSync(outputPath, yamlContent);

console.log(`✅ Generated latest.yml at: ${outputPath}`);
console.log('\nContent:');
console.log(yamlContent);

// 追加情報を表示
console.log('\nFile Information:');
console.log(`- File: ${fileName}`);
console.log(`- Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`- SHA512: ${sha512}`);
console.log(`- Version: ${version}`);