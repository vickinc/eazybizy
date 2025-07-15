#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Fix scalendar patterns
    if (content.includes('lucide-react/dist/esm/icons/scalendar-days')) {
      content = content.replace(/lucide-react\/dist\/esm\/icons\/scalendar-days/g, 'lucide-react/dist/esm/icons/calendar-days');
      changed = true;
    }
    
    if (content.includes('lucide-react/dist/esm/icons/scalendar-clock')) {
      content = content.replace(/lucide-react\/dist\/esm\/icons\/scalendar-clock/g, 'lucide-react/dist/esm/icons/calendar-clock');
      changed = true;
    }
    
    if (content.includes('lucide-react/dist/esm/icons/scalendar')) {
      content = content.replace(/lucide-react\/dist\/esm\/icons\/scalendar/g, 'lucide-react/dist/esm/icons/calendar');
      changed = true;
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

console.log('🔧 Fixing scalendar imports...');

const allFiles = findTsxFiles(srcDir);
let fixedCount = 0;

for (const file of allFiles) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Scalendar fixes complete!`);
console.log(`📊 Fixed: ${fixedCount} files`);