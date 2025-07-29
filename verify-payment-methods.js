#!/usr/bin/env node

/**
 * Verify that invoices show correct payment methods and they're properly reflected
 * in cashflow and transactions
 */

const { PrismaClient } = require('@prisma/client');

async function verifyPaymentMethods() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying invoice payment methods and their reflection in cashflow...');
    
    // Get all paid invoices with their payment details
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidDate: {
          gte: new Date('2025-07-20'),
          lte: new Date('2025-07-30')
        }
      },
      include: {
        company: {
          select: {
            tradingName: true
          }
        }
      },
      orderBy: { paidDate: 'desc' }
    });
    
    console.log(`📊 Found ${paidInvoices.length} paid invoices in date range:`);
    
    for (const invoice of paidInvoices) {
      console.log(`\n📋 Invoice: ${invoice.invoiceNumber}`);
      console.log(`   Amount: ${invoice.totalAmount} ${invoice.currency}`);
      console.log(`   Client: ${invoice.clientName}`);
      console.log(`   Company: ${invoice.company.tradingName}`);
      console.log(`   Paid Date: ${invoice.paidDate?.toDateString()}`);
      
      // Get the bookkeeping entry for this invoice
      const bookkeepingEntry = await prisma.bookkeepingEntry.findFirst({
        where: {
          invoiceId: invoice.id,
          isFromInvoice: true
        }
      });
      
      if (bookkeepingEntry) {
        console.log(`   📝 Bookkeeping Entry:`);
        console.log(`      Account Type: ${bookkeepingEntry.accountType}`);
        console.log(`      Account ID: ${bookkeepingEntry.accountId}`);
        
        // Get account details based on type
        let accountDetails = null;
        let paymentMethod = 'Unknown';
        
        if (bookkeepingEntry.accountType === 'bank' && bookkeepingEntry.accountId) {
          accountDetails = await prisma.bankAccount.findUnique({
            where: { id: bookkeepingEntry.accountId },
            select: {
              bankName: true,
              accountName: true,
              currency: true,
              iban: true
            }
          });
          paymentMethod = `BANK (${accountDetails?.currency || 'Unknown'})`;
        } else if (bookkeepingEntry.accountType === 'wallet' && bookkeepingEntry.accountId) {
          accountDetails = await prisma.digitalWallet.findUnique({
            where: { id: bookkeepingEntry.accountId },
            select: {
              walletName: true,
              walletType: true,
              currency: true,
              blockchain: true
            }
          });
          paymentMethod = `CRYPTO (${accountDetails?.currency || 'Unknown'})`;
        }
        
        console.log(`   💳 Payment Method: ${paymentMethod}`);
        if (accountDetails) {
          if (bookkeepingEntry.accountType === 'bank') {
            console.log(`      Bank: ${accountDetails.bankName}`);
            console.log(`      Account: ${accountDetails.accountName}`);
            console.log(`      IBAN: ${accountDetails.iban}`);
          } else {
            console.log(`      Wallet: ${accountDetails.walletName}`);
            console.log(`      Type: ${accountDetails.walletType}`);
            console.log(`      Blockchain: ${accountDetails.blockchain}`);
          }
        }
        
        // Get corresponding transaction
        const transaction = await prisma.transaction.findFirst({
          where: {
            linkedEntryId: bookkeepingEntry.id,
            linkedEntryType: 'bookkeeping_entry'
          }
        });
        
        if (transaction) {
          console.log(`   💰 Transaction Record:`);
          console.log(`      ID: ${transaction.id}`);
          console.log(`      Account Type: ${transaction.accountType}`);
          console.log(`      Account ID: ${transaction.accountId}`);
          console.log(`      Net Amount: ${transaction.netAmount} ${transaction.currency}`);
          console.log(`      Incoming: ${transaction.incomingAmount} ${transaction.currency}`);
          console.log(`      Status: ${transaction.status}`);
          
          // Verify consistency
          const accountMatch = transaction.accountId === bookkeepingEntry.accountId && 
                              transaction.accountType === bookkeepingEntry.accountType;
          const amountMatch = Math.abs(transaction.netAmount - invoice.totalAmount) < 0.01;
          
          console.log(`   ✅ Data Consistency:`);
          console.log(`      Account Match: ${accountMatch ? '✅' : '❌'}`);
          console.log(`      Amount Match: ${amountMatch ? '✅' : '❌'}`);
          
          if (!accountMatch) {
            console.log(`      ⚠️  Account mismatch: Entry(${bookkeepingEntry.accountType}:${bookkeepingEntry.accountId}) vs Transaction(${transaction.accountType}:${transaction.accountId})`);
          }
          if (!amountMatch) {
            console.log(`      ⚠️  Amount mismatch: Invoice(${invoice.totalAmount}) vs Transaction(${transaction.netAmount})`);
          }
        } else {
          console.log(`   ❌ No corresponding transaction found`);
        }
      } else {
        console.log(`   ❌ No bookkeeping entry found`);
      }
    }
    
    // Summary analysis
    console.log(`\n📈 Payment Method Analysis:`);
    
    // Count by payment method
    const bankPayments = await prisma.bookkeepingEntry.count({
      where: {
        isFromInvoice: true,
        accountType: 'bank',
        date: {
          gte: new Date('2025-07-20'),
          lte: new Date('2025-07-30')
        }
      }
    });
    
    const cryptoPayments = await prisma.bookkeepingEntry.count({
      where: {
        isFromInvoice: true,
        accountType: 'wallet',
        date: {
          gte: new Date('2025-07-20'),
          lte: new Date('2025-07-30')
        }
      }
    });
    
    console.log(`   Bank Payments: ${bankPayments}`);
    console.log(`   Crypto Payments: ${cryptoPayments}`);
    
    // Check if all bookkeeping entries have corresponding transactions
    const entriesWithTransactions = await prisma.bookkeepingEntry.count({
      where: {
        isFromInvoice: true,
        date: {
          gte: new Date('2025-07-20'),
          lte: new Date('2025-07-30')
        },
        linkedTransaction: {
          isNot: null
        }
      }
    });
    
    const totalEntries = await prisma.bookkeepingEntry.count({
      where: {
        isFromInvoice: true,
        date: {
          gte: new Date('2025-07-20'),
          lte: new Date('2025-07-30')
        }
      }
    });
    
    console.log(`\n🔗 Transaction Integration:`);
    console.log(`   Entries with Transactions: ${entriesWithTransactions}/${totalEntries}`);
    console.log(`   Integration Rate: ${((entriesWithTransactions/totalEntries)*100).toFixed(1)}%`);
    
    if (entriesWithTransactions === totalEntries) {
      console.log(`   ✅ Perfect! All invoice payments have corresponding transactions`);
    } else {
      console.log(`   ⚠️  Some invoice payments missing transaction records`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPaymentMethods().catch(console.error);