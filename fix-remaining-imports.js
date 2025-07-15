#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Additional fixes found from build errors
const additionalFixes = {
  'scalendar': 'calendar',
  'scalendar-days': 'calendar-days',
  'scalendar-clock': 'calendar-clock',
  'arrow-rightleft': 'arrow-right-left'
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;
    
    // Apply additional fixes
    for (const [malformed, correct] of Object.entries(additionalFixes)) {
      const malformedPattern = `lucide-react/dist/esm/icons/${malformed}`;
      const correctPattern = `lucide-react/dist/esm/icons/${correct}`;
      
      if (content.includes(malformedPattern)) {
        content = content.replace(new RegExp(malformedPattern, 'g'), correctPattern);
        changed = true;
      }
    }
    
    if (content !== originalContent) {
      changed = true;
    }
    
    // Only write if content changed
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

if (!fs.existsSync(srcDir)) {
  console.error('❌ src directory not found. Run this script from the project root.');
  process.exit(1);
}

console.log('🔧 Fixing remaining malformed lucide-react imports...');

const allFiles = findTsxFiles(srcDir);
let fixedCount = 0;

for (const file of allFiles) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Additional fixes complete!`);
console.log(`📊 Fixed: ${fixedCount} files`);