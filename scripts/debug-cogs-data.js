const { PrismaClient } = require('@prisma/client');

async function debugCOGSData() {
  const prisma = new PrismaClient();
  
  try {
    // Find the revenue entry for our test invoice
    const entries = await prisma.bookkeepingEntry.findMany({
      where: {
        invoiceId: 'cmdhy5miv00099khsq8cxupj8',
        isFromInvoice: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 Bookkeeping entries for test invoice:');
    entries.forEach((entry, index) => {
      console.log(`${index + 1}. Entry ID: ${entry.id}`);
      console.log(`   Description: ${entry.description}`);
      console.log(`   Amount: ${entry.amount}`);
      console.log(`   COGS: ${entry.cogs}`);
      console.log(`   COGS Paid: ${entry.cogsPaid}`);
      console.log(`   Created: ${entry.createdAt}`);
      console.log('');
    });
    
    // Also check the invoice and its items
    const invoice = await prisma.invoice.findUnique({
      where: { id: 'cmdhy5miv00099khsq8cxupj8' },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                cost: true,
                costCurrency: true
              }
            }
          }
        }
      }
    });
    
    console.log('🧾 Invoice details:');
    console.log(`Invoice Number: ${invoice.invoiceNumber}`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Total Amount: ${invoice.totalAmount}`);
    console.log(`Items: ${invoice.items.length}`);
    
    let manualCOGS = 0;
    console.log('\n📦 Invoice items and COGS calculation:');
    invoice.items.forEach((item, index) => {
      const itemCOGS = item.product ? item.product.cost * item.quantity : 0;
      manualCOGS += itemCOGS;
      
      console.log(`${index + 1}. ${item.productName}`);
      console.log(`   Quantity: ${item.quantity}`);
      console.log(`   Unit Price: ${item.unitPrice}`);
      console.log(`   Total: ${item.total}`);
      if (item.product) {
        console.log(`   Product Cost: ${item.product.cost}`);
        console.log(`   Item COGS: ${itemCOGS}`);
      } else {
        console.log(`   No product linked!`);
      }
      console.log('');
    });
    
    console.log(`💰 Manual COGS calculation: ${manualCOGS}`);
    console.log(`📊 Database COGS value: ${entries[0]?.cogs || 'N/A'}`);
    console.log(`❓ Match: ${manualCOGS === (entries[0]?.cogs || 0) ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCOGSData();