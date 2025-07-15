#!/usr/bin/env node

const fs = require('fs');

const specificFixes = {
  'starget': 'target',
  'edit2': 'edit-2', 
  'ousepointer2': 'mouse-pointer-2',
  'circledollarsign': 'circle-dollar-sign'
};

const filesToFix = [
  'src/app/financials/valuation/page.tsx',
  'src/components/layout/sidebar.tsx',
  'src/components/features/VirtualHoldingDashboard.tsx',
  'src/components/features/IntegrationTestingDashboard.tsx',
  'src/components/features/BalanceStats.tsx',
  'src/components/features/ProfitLossMetrics.tsx',
  'src/components/features/ARRDashboard.tsx',
  'src/components/features/ValuationCalculator.tsx',
  'src/components/features/BalanceListItem.tsx',
  'src/components/features/BookkeepingStats.tsx',
  'src/components/features/ProfitLossComparison.tsx',
  'src/components/features/onboarding/ShareholderSection.tsx',
  'src/components/features/onboarding/RepresentativeSection.tsx'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [malformed, correct] of Object.entries(specificFixes)) {
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

console.log('🔧 Fixing specific malformed patterns...');

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Specific pattern fixes complete!`);
console.log(`📊 Fixed: ${fixedCount} files`);