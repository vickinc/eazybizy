const { PrismaClient } = require('@prisma/client');

async function checkInvoiceItems() {
  const prisma = new PrismaClient();
  
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: 'INV-COGS-1753395074885' }
    });
    
    if (!invoice) {
      console.log('Invoice not found');
      return;
    }
    
    console.log('✅ Invoice found:');
    console.log('ID:', invoice.id);
    console.log('Status:', invoice.status);
    console.log('Total Amount:', invoice.totalAmount);
    
    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: invoice.id },
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
    });
    
    console.log('\n📦 Invoice items for this invoice:', items.length);
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.productName}`);
      console.log(`   Quantity: ${item.quantity}`);
      console.log(`   Unit Price: ${item.unitPrice}`);
      console.log(`   Product:`, item.product ? `${item.product.name} (cost: ${item.product.cost})` : 'No product linked');
    });
    
    // Check if items exist but are not linked properly
    const orphanedItems = await prisma.invoiceItem.findMany({
      where: {
        OR: [
          { productName: { contains: 'Software License' } },
          { productName: { contains: 'Training Workshop' } },
          { productName: { contains: 'Premium Consulting' } }
        ]
      },
      include: {
        invoice: { select: { invoiceNumber: true } },
        product: { select: { name: true, cost: true } }
      }
    });
    
    console.log('\n🔍 Items with COGS-related names:', orphanedItems.length);
    orphanedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.productName} (Invoice: ${item.invoice?.invoiceNumber})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoiceItems();