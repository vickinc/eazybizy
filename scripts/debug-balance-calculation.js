const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugBalanceCalculation() {
  console.log('🔍 Debugging balance calculation for tron4ik wallet...')

  try {
    // Find the tron4ik wallet
    const tronWallet = await prisma.digitalWallet.findFirst({
      where: {
        walletName: 'tron4ik'
      },
      include: {
        company: true
      }
    })

    if (!tronWallet) {
      console.log('❌ tron4ik wallet not found')
      return
    }

    console.log('📋 Wallet details:', {
      id: tronWallet.id,
      name: tronWallet.walletName,
      currency: tronWallet.currency,
      currencies: tronWallet.currencies,
      companyId: tronWallet.companyId,
      company: tronWallet.company.tradingName
    })

    // Get initial balances for this wallet
    const initialBalances = await prisma.initialBalance.findMany({
      where: {
        accountId: tronWallet.id,
        accountType: 'wallet'
      }
    })

    console.log(`💰 Initial balances for tron4ik:`, initialBalances.map(ib => ({
      currency: ib.currency,
      amount: ib.amount,
      notes: ib.notes
    })))

    // Get transactions for this wallet
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: tronWallet.id,
        accountType: 'wallet'
      },
      orderBy: {
        date: 'desc'
      }
    })

    console.log(`📊 Transactions for tron4ik (${transactions.length} total):`)
    transactions.slice(0, 10).forEach(tx => {
      console.log(`   ${tx.date.toISOString().split('T')[0]} | ${tx.currency} | Net: ${tx.netAmount} | In: ${tx.incomingAmount || 0} | Out: ${tx.outgoingAmount || 0} | ${tx.description || 'No description'}`)
    })

    if (transactions.length > 10) {
      console.log(`   ... and ${transactions.length - 10} more transactions`)
    }

    // Parse currencies and simulate balance calculation
    let currenciesArray = []
    if (tronWallet.currencies) {
      if (typeof tronWallet.currencies === 'string') {
        currenciesArray = tronWallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0)
      }
    }

    console.log(`\n🔄 Simulating balance calculation for currencies: ${currenciesArray.join(', ')}`)

    for (const currency of currenciesArray) {
      // Find initial balance for this currency
      const initialBalance = initialBalances.find(ib => ib.currency === currency)
      const initialAmount = initialBalance?.amount || 0

      // Calculate transaction sum for this currency
      const currencyTransactions = transactions.filter(tx => tx.currency === currency)
      const transactionSum = currencyTransactions.reduce((sum, tx) => sum + tx.netAmount, 0)

      // Calculate final balance
      const finalBalance = initialAmount + transactionSum

      console.log(`   ${currency}:`)
      console.log(`     Initial: ${initialAmount}`)
      console.log(`     Transactions: ${transactionSum} (from ${currencyTransactions.length} transactions)`)
      console.log(`     Final: ${finalBalance}`)
    }

    // Test with a specific historical date
    const testDate = '2025-08-04'
    console.log(`\n📅 Testing historical date: ${testDate}`)

    for (const currency of currenciesArray) {
      const initialBalance = initialBalances.find(ib => ib.currency === currency)
      const initialAmount = initialBalance?.amount || 0

      const historicalTransactions = transactions.filter(tx => 
        tx.currency === currency && 
        tx.date <= new Date(testDate + 'T23:59:59.999Z')
      )
      
      const historicalTransactionSum = historicalTransactions.reduce((sum, tx) => sum + tx.netAmount, 0)
      const historicalBalance = initialAmount + historicalTransactionSum

      console.log(`   ${currency} as of ${testDate}:`)
      console.log(`     Initial: ${initialAmount}`)
      console.log(`     Historical transactions: ${historicalTransactionSum} (from ${historicalTransactions.length} transactions)`)
      console.log(`     Historical balance: ${historicalBalance}`)
    }

  } catch (error) {
    console.error('❌ Error debugging balance calculation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugBalanceCalculation().catch(console.error)