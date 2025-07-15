#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Comprehensive mapping of malformed patterns to correct ones
const iconFixes = {
  // Missing first character patterns
  'heck': 'check',
  'ircle': 'circle',
  'hevron': 'chevron',
  'rrow': 'arrow',
  'lert': 'alert',
  'ownload': 'download',
  'pload': 'upload',
  'ettings': 'settings',
  'efresh': 'refresh',
  'oader': 'loader',
  'cale': 'scale',
  'uilding': 'building',
  'alculator': 'calculator',
  'eceipt': 'receipt',
  'ile': 'file',
  'older': 'folder',
  'ome': 'home',
  'ser': 'user',
  'ail': 'mail',
  'hone': 'phone',
  'lobe': 'globe',
  'opy': 'copy',
  'dit': 'edit',
  'lus': 'plus',
  'inus': 'minus',
  'imes': 'times',
  'tar': 'star',
  'eart': 'heart',
  'ock': 'lock',
  'nlock': 'unlock',
  'ave': 'save',
  'lay': 'play',
  'ause': 'pause',
  'top': 'stop',
  'end': 'send',
  'ink': 'link',
  'ash': 'hash',
  'ag': 'tag',
  'lag': 'flag',
  'ift': 'gift',
  'ell': 'bell',
  'ye': 'eye',
  'ap': 'zap',
  'nfo': 'info',
  'elp': 'help',
  'enu': 'menu',
  'ore': 'more',
  'rid': 'grid',
  'ist': 'list',
  'imer': 'timer',
  'lock': 'clock',
  'epeat': 'repeat',
  'arkles': 'sparkles',
  'rash': 'trash',
  'rchive': 'archive',
  'hare': 'share',
  'xternal': 'external',
  'oggle': 'toggle',
  ' bookmark': 'bookmark',
  'eart': 'heart',
  
  // Icon suffix patterns (already mostly fixed but ensuring completeness)
  'heckicon': 'check',
  'ircleicon': 'circle',
  'ownloadicon': 'download',
  'ettingsicon': 'settings',
  'nfoicon': 'info',
  'aveicon': 'save',
  'lertcircleicon': 'alert-circle',
  'heckcircleicon': 'check-circle',
  'oadericon': 'loader',
  'archart3icon': 'bar-chart-3',
  'alendaricon': 'calendar',
  'ookopenicon': 'book-open',
  'uildingicon': 'building',
  'sericon': 'user',
  'lerttriangleicon': 'alert-triangle',
  
  // Compound patterns
  'oggleleft': 'toggle-left',
  'oggleright': 'toggle-right',
  'hecksquare': 'check-square',
  'lertcircle': 'alert-circle',
  'heckcircle': 'check-circle',
  'efreshcw': 'refresh-cw',
  'otate': 'rotate',
  'rrowleft': 'arrow-left',
  'rrowright': 'arrow-right',
  'rrowup': 'arrow-up',
  'rrowdown': 'arrow-down',
  'hevronleft': 'chevron-left',
  'hevronright': 'chevron-right',
  'hevronup': 'chevron-up',
  'hevrondown': 'chevron-down',
  'hevronsupdown': 'chevrons-up-down',
  'ore-horizontal': 'more-horizontal',
  'ore-vertical': 'more-vertical',
  'xternal-link': 'external-link',
  'ap-pin': 'map-pin',
  'hare-2': 'share-2',
  'rash-2': 'trash-2',
  'uilding-2': 'building-2',
  'ile-text': 'file-text',
  'redit-card': 'credit-card',
  'hoppingcart': 'shopping-cart',
  'ser-check': 'user-check',
  'rrow-rightleft': 'arrow-right-left',
  'andmark': 'landmark',
  'hieldcheck': 'shield-check',
  'onitorspeaker': 'monitor-speaker',
  'ard-drive': 'hard-drive',
  'ook-open': 'book-open',
  'ar-chart': 'bar-chart',
  'ar-chart-3': 'bar-chart-3',
  'ie-chart': 'pie-chart',
  'ctivity': 'activity',
  'ilebarchart': 'file-bar-chart',
  'hartline': 'chart-line',
  'ookopen': 'book-open',
  'rget': 'target',
  'uck': 'truck',
  'ackage': 'package',
  'hoppingcart': 'shopping-cart',
  'rrowrightleft': 'arrow-right-left',
  'ogglelefticon': 'toggle-left',
  'ogglerighticon': 'toggle-right',
  'tickynote': 'sticky-note',
  'adgecheck': 'badge-check',
  'parkles': 'sparkles',
  'ogout': 'log-out',
  'essagecircle': 'message-circle',
  'lendardays': 'calendar-days',
  'lendarclock': 'calendar-clock',
  'archart3': 'bar-chart-3',
  'rianglealert': 'triangle-alert'
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;
    
    // Apply all icon fixes
    for (const [malformed, correct] of Object.entries(iconFixes)) {
      const malformedPattern = `lucide-react/dist/esm/icons/${malformed}`;
      const correctPattern = `lucide-react/dist/esm/icons/${correct}`;
      
      if (content.includes(malformedPattern)) {
        content = content.replace(new RegExp(malformedPattern, 'g'), correctPattern);
        changed = true;
      }
    }
    
    // Handle icon suffix patterns more broadly
    content = content.replace(/lucide-react\/dist\/esm\/icons\/([a-z])([a-z-]*?)icon"/g, (match, first, rest) => {
      if (rest === '') {
        // Single character like "heckicon" -> "check"
        const fullIcon = first + rest;
        if (iconFixes[fullIcon + 'icon']) {
          return `lucide-react/dist/esm/icons/${iconFixes[fullIcon + 'icon']}"`;
        }
        return `lucide-react/dist/esm/icons/${first}${rest}"`;
      }
      return `lucide-react/dist/esm/icons/${first}${rest}"`;
    });
    
    // Handle empty icon paths
    content = content.replace(/lucide-react\/dist\/esm\/icons\/"/g, 'lucide-react/dist/esm/icons/help"');
    
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

console.log('🔧 Comprehensive fix for ALL malformed lucide-react imports...');

const allFiles = findTsxFiles(srcDir);
let fixedCount = 0;

for (const file of allFiles) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Comprehensive fix complete!`);
console.log(`📊 Fixed: ${fixedCount} files`);
console.log(`🎯 All lucide-react imports should now be correctly formatted`);