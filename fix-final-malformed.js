#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const finalMalformedFixes = {
  'users2icon': 'users-2',
  'hield': 'shield',
  'externallink': 'external-link',
  'filetext': 'file-text',
  'ug': 'bug',
  'ercent': 'percent',
  'ilter': 'filter',
  'itcoin': 'bitcoin',
  'ortasc': 'sort-asc',
  'ortdesc': 'sort-desc',
  'able': 'table'
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [malformed, correct] of Object.entries(finalMalformedFixes)) {
      const malformedPattern = `lucide-react/dist/esm/icons/${malformed}`;
      const correctPattern = `lucide-react/dist/esm/icons/${correct}`;
      
      if (content.includes(malformedPattern)) {
        content = content.replace(new RegExp(malformedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctPattern);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findTsxFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
        scan(fullPath);
      } else if ((item.endsWith('.tsx') || item.endsWith('.ts')) && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'src');

console.log('🔧 Fixing final batch of malformed imports...');

const allFiles = findTsxFiles(srcDir);
let fixedCount = 0;

for (const file of allFiles) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Final malformed import fixes complete!`);
console.log(`📊 Fixed: ${fixedCount} files`);
console.log(`🎯 Build should now work!`);