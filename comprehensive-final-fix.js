#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Comprehensive mapping from all observed errors
const finalComprehensiveFixes = {
  // New ones from latest errors
  'starget': 'target',
  'ruck': 'truck',
  'alendar': 'calendar',
  'allet': 'wallet',
  
  // Previous patterns
  'rendingdown': 'trending-down',
  'rendingup': 'trending-up',
  'listory': 'history',
  'usercheck': 'user-check',
  'alertcircle': 'alert-circle',
  'alerttriangle': 'alert-triangle',
  'arget': 'target',
  'iechart': 'pie-chart',
  'folderopen': 'folder-open',
  'refreshcw': 'refresh-cw',
  'checkcircle': 'check-circle',
  'building2': 'building-2',
  'scalendar': 'calendar',
  'scalendar-days': 'calendar-days',
  'scalendar-clock': 'calendar-clock',
  'arrow-rightleft': 'arrow-right-left',
  
  // Original comprehensive patterns
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
  'bookmark': 'bookmark',
  
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
  'uck': 'truck',
  'ackage': 'package',
  'rrowrightleft': 'arrow-right-left',
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
    
    // Apply all comprehensive fixes
    for (const [malformed, correct] of Object.entries(finalComprehensiveFixes)) {
      const malformedPattern = `lucide-react/dist/esm/icons/${malformed}`;
      const correctPattern = `lucide-react/dist/esm/icons/${correct}`;
      
      if (content.includes(malformedPattern)) {
        content = content.replace(new RegExp(malformedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctPattern);
        changed = true;
      }
    }
    
    // Handle icon suffix patterns more broadly
    content = content.replace(/lucide-react\/dist\/esm\/icons\/([a-z-]+)icon"/g, (match, iconName) => {
      // Remove "icon" suffix
      return `lucide-react/dist/esm/icons/${iconName}"`;
    });
    
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

console.log('🔧 FINAL comprehensive fix for ALL malformed lucide-react imports...');

const allFiles = findTsxFiles(srcDir);
let fixedCount = 0;

for (const file of allFiles) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ FINAL comprehensive fixes complete!`);
console.log(`📊 Fixed: ${fixedCount} files`);
console.log(`🎯 ALL lucide-react imports should now be completely fixed!`);