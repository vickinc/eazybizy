const { PrismaClient } = require('@prisma/client');

async function findInvoicesWithItems() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('🔍 SEARCHING FOR INVOICES WITH ITEMS AND PRODUCT COSTS');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Connected' : 'No URL');
    
    // First, let's check if we have any invoice items at all
    const itemCount = await prisma.invoiceItem.count();
    console.log(`📊 Total invoice items in database: ${itemCount}`);
    
    if (itemCount === 0) {
      console.log('❌ No invoice items found in the database');
      return null;
    }
    
    // Find invoices that have items with products that have costs
    const invoicesWithItems = await prisma.invoice.findMany({
      where: {
        items: {
          some: {
            product: {
              cost: {
                gt: 0  // Has a cost greater than 0
              }
            }
          }
        }
      },
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
      },
      take: 5  // Limit to first 5 invoices
    });
    
    console.log(`\n📋 Found ${invoicesWithItems.length} invoices with items that have product costs:`);
    
    invoicesWithItems.forEach((invoice, index) => {
      console.log(`\n--- Invoice ${index + 1} ---`);
      console.log(`Invoice Number: ${invoice.invoiceNumber}`);
      console.log(`Client: ${invoice.clientName}`);
      console.log(`Status: ${invoice.status}`);
      console.log(`Total Amount: ${invoice.currency} ${invoice.totalAmount}`);
      console.log(`Items (${invoice.items.length}):`);
      
      let totalCOGS = 0;
      invoice.items.forEach((item, itemIndex) => {
        const itemCOGS = item.product ? (item.product.cost * item.quantity) : 0;
        totalCOGS += itemCOGS;
        
        console.log(`  ${itemIndex + 1}. ${item.productName}`);
        console.log(`     Quantity: ${item.quantity}`);
        console.log(`     Unit Price: ${item.currency} ${item.unitPrice}`);
        console.log(`     Total: ${item.currency} ${item.total}`);
        if (item.product) {
          console.log(`     Product Cost: ${item.product.costCurrency} ${item.product.cost}`);
          console.log(`     Item COGS: ${item.product.costCurrency} ${itemCOGS}`);
        } else {
          console.log(`     Product Cost: N/A (no product linked)`);
        }
      });
      
      console.log(`📊 Total COGS for this invoice: ${totalCOGS > 0 ? `${invoice.currency} ${totalCOGS}` : 'N/A'}`);
      console.log(`💰 Gross Profit: ${totalCOGS > 0 ? `${invoice.currency} ${invoice.totalAmount - totalCOGS}` : 'Cannot calculate'}`);
    });
    
    if (invoicesWithItems.length === 0) {
      console.log('\n❌ No invoices found with items that have product costs');
      
      // Let's see what we do have
      const invoicesWithAnyItems = await prisma.invoice.findMany({
        where: {
          items: {
            some: {}
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  cost: true,
                  costCurrency: true
                }
              }
            }
          }
        },
        take: 3
      });
      
      console.log(`\n📋 Found ${invoicesWithAnyItems.length} invoices with any items:`);
      invoicesWithAnyItems.forEach((invoice, index) => {
        console.log(`\n--- Invoice ${index + 1} (Any Items) ---`);
        console.log(`Invoice Number: ${invoice.invoiceNumber}`);
        console.log(`Items (${invoice.items.length}):`);
        invoice.items.forEach((item, itemIndex) => {
          console.log(`  ${itemIndex + 1}. ${item.productName} (Qty: ${item.quantity})`);
          if (item.product) {
            console.log(`     Product Cost: ${item.product.costCurrency} ${item.product.cost}`);
          } else {
            console.log(`     No product linked`);
          }
        });
      });
      
      return invoicesWithAnyItems.length > 0 ? invoicesWithAnyItems[0] : null;
    }
    
    return invoicesWithItems[0];
    
  } catch (error) {
    console.error('❌ Database error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly, execute the function
if (require.main === module) {
  findInvoicesWithItems()
    .then((result) => {
      if (result) {
        console.log(`\n✅ Recommended invoice for COGS testing: ${result.invoiceNumber}`);
      } else {
        console.log('\n❌ No suitable invoice found for COGS testing');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script error:', error);
      process.exit(1);
    });
}

module.exports = { findInvoicesWithItems };