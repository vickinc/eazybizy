const { PrismaClient } = require('@prisma/client');

/**
 * Calculate COGS for an invoice based on its items and linked products
 */
function calculateInvoiceCOGS(invoiceItems) {
  let totalCOGS = 0;
  const cogsBreakdown = [];
  
  invoiceItems.forEach(item => {
    if (item.product && item.product.cost > 0) {
      const itemCOGS = item.product.cost * item.quantity;
      totalCOGS += itemCOGS;
      
      cogsBreakdown.push({
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.product.cost,
        costCurrency: item.product.costCurrency,
        itemCOGS: itemCOGS
      });
    }
  });
  
  return {
    totalCOGS,
    cogsBreakdown,
    hasCOGSData: cogsBreakdown.length > 0
  };
}

async function testCOGSCalculation(invoiceNumber) {
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
  });
  
  try {
    console.log(`🧪 TESTING COGS CALCULATION FOR INVOICE: ${invoiceNumber}`);
    
    // Fetch the invoice with its items and product costs
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                cost: true,
                costCurrency: true,
                price: true,
                currency: true
              }
            }
          }
        }
      }
    });
    
    if (!invoice) {
      console.error(`❌ Invoice ${invoiceNumber} not found`);
      return null;
    }
    
    console.log(`📄 Found invoice: ${invoice.invoiceNumber}`);
    console.log(`📊 Client: ${invoice.clientName}`);
    console.log(`💰 Total Amount: ${invoice.currency} ${invoice.totalAmount}`);
    console.log(`📦 Items: ${invoice.items.length}`);
    
    // Calculate COGS using our function
    const cogsResult = calculateInvoiceCOGS(invoice.items);
    
    console.log('\n🔍 COGS CALCULATION RESULTS:');
    
    if (!cogsResult.hasCOGSData) {
      console.log('❌ No COGS data available for this invoice');
      console.log('💡 Items without product costs:');
      invoice.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.productName} ${item.product ? '(no cost data)' : '(no product linked)'}`);
      });
      return null;
    }
    
    console.log('✅ COGS breakdown:');
    cogsResult.cogsBreakdown.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.productName}`);
      console.log(`     Quantity: ${item.quantity}`);
      console.log(`     Unit Cost: ${item.costCurrency} ${item.unitCost}`);
      console.log(`     Item COGS: ${item.costCurrency} ${item.itemCOGS}`);
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`Total Revenue: ${invoice.currency} ${invoice.subtotal}`);
    console.log(`Total COGS: ${invoice.currency} ${cogsResult.totalCOGS.toFixed(2)}`);
    console.log(`Gross Profit: ${invoice.currency} ${(invoice.subtotal - cogsResult.totalCOGS).toFixed(2)}`);
    console.log(`Profit Margin: ${(((invoice.subtotal - cogsResult.totalCOGS) / invoice.subtotal) * 100).toFixed(1)}%`);
    
    // Test validation scenarios
    console.log('\n🧪 VALIDATION TESTS:');
    
    // Test 1: Verify calculations are correct
    let manualTotal = 0;
    invoice.items.forEach(item => {
      if (item.product && item.product.cost > 0) {
        manualTotal += item.product.cost * item.quantity;
      }
    });
    
    const calculationCorrect = Math.abs(cogsResult.totalCOGS - manualTotal) < 0.01;
    console.log(`✅ Calculation accuracy: ${calculationCorrect ? 'PASS' : 'FAIL'}`);
    if (!calculationCorrect) {
      console.log(`   Expected: ${manualTotal}, Got: ${cogsResult.totalCOGS}`);
    }
    
    // Test 2: Verify profit margin is reasonable
    const profitMargin = ((invoice.subtotal - cogsResult.totalCOGS) / invoice.subtotal) * 100;
    const reasonableMargin = profitMargin > 0 && profitMargin < 100;
    console.log(`✅ Profit margin sanity: ${reasonableMargin ? 'PASS' : 'FAIL'} (${profitMargin.toFixed(1)}%)`);
    
    // Test 3: Verify COGS is less than revenue
    const cogsLessThanRevenue = cogsResult.totalCOGS < invoice.subtotal;
    console.log(`✅ COGS < Revenue: ${cogsLessThanRevenue ? 'PASS' : 'FAIL'}`);
    
    return {
      invoice,
      cogsResult,
      tests: {
        calculationCorrect,
        reasonableMargin,
        cogsLessThanRevenue
      }
    };
    
  } catch (error) {
    console.error('❌ Error testing COGS calculation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly, execute the function
if (require.main === module) {
  const invoiceNumber = process.argv[2];
  
  if (!invoiceNumber) {
    console.error('❌ Please provide an invoice number as argument');
    console.log('Usage: node test-cogs-calculation.js INV-COGS-1753395074885');
    process.exit(1);
  }
  
  testCOGSCalculation(invoiceNumber)
    .then((result) => {
      if (result) {
        const allTestsPassed = Object.values(result.tests).every(test => test);
        console.log(`\n${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        console.log(`🎯 COGS calculation is ${allTestsPassed ? 'working correctly' : 'needs attention'}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script error:', error);
      process.exit(1);
    });
}

module.exports = { testCOGSCalculation, calculateInvoiceCOGS };