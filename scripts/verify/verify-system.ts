import fs from 'fs';
import path from 'path';

console.log('🔍 Running CraveCanteen System Integrity Check...');

const requiredDirs = [
  'frontend',
  'backend',
  'database',
  'shared',
  'tests',
  'scripts',
  'docs'
];

let missing = false;
for (const dir of requiredDirs) {
  const fullPath = path.resolve(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Directory [${dir}] present.`);
  } else {
    console.error(`  ✗ MISSING Directory [${dir}]!`);
    missing = true;
  }
}

if (missing) {
  console.error('System integrity check failed!');
  process.exit(1);
} else {
  console.log('✅ System structure verification passed cleanly!');
}
