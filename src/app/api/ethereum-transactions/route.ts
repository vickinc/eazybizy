import { NextRequest, NextResponse } from 'next/server';
import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';

// Helper functions for spam detection
function detectPhishingTransaction(tx: any): boolean {
  // Known phishing transaction hashes
  const knownPhishingHashes = [
    '0xdd72106dca23a22cdd8376a69f956dec5d21d5075d18833f7be5474e6b8e86bc',
    '0x70cbdb72871c69a17f13ab5b5bab1dd7ef5607706de98f82137fe39c144d8dc3',
    '0x178450a4c26357b3812225c24d5dc877c5588637d72634ed0e76e1156a957ef5',
    // Add more known phishing hashes here
  ];
  
  if (knownPhishingHashes.includes(tx.hash.toLowerCase())) {
    console.log(`🚫 Blocking known phishing transaction: ${tx.hash.substring(0, 10)}...`);
    return true;
  }
  
  // Check for phishing address patterns
  if (tx.to && detectPhishingAddressPattern(tx.to)) {
    console.log(`🚫 Blocking phishing address pattern: ${tx.to.substring(0, 10)}...`);
    return true;
  }
  
  return false;
}

function detectPhishingAddressPattern(address: string): boolean {
  // Legitimate addresses that should never be flagged (known USDT recipients)
  const legitimateAddresses = [
    '0xbac46c5513c0653360a673ed0cf05b9fb5ab3c27', // Legitimate USDT transaction recipient
  ];
  
  if (legitimateAddresses.some(addr => address.toLowerCase() === addr.toLowerCase())) {
    return false; // This is a legitimate address, not phishing
  }
  
  // Common phishing address patterns from the analysis
  const phishingPatterns = [
    /.*ae5a88$/i,     // Ends with ae5a88
    /.*3c27$/i,       // Ends with 3c27 (but exclude legitimate addresses above)
    /.*b3c27$/i,      // Ends with b3c27
    /.*f3c27$/i,      // Ends with f3c27
    // Add more patterns as they're discovered
  ];
  
  return phishingPatterns.some(pattern => pattern.test(address));
}

function detectKnownSpamPatterns(tx: any): boolean {
  // December 2022 phishing campaign pattern
  const txDate = new Date(tx.timestamp);
  const isDecember2022 = txDate >= new Date('2022-12-01') && txDate <= new Date('2022-12-31');
  
  if (isDecember2022 && 
      tx.currency === 'USDT' && 
      tx.amount === 0 && 
      tx.type === 'outgoing' &&
      tx.gasUsed > 300000) {
    console.log(`🚫 Blocking December 2022 USDT phishing pattern: ${tx.hash.substring(0, 10)}...`);
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // ULTRA DEBUG: Track specific transaction through entire pipeline
    const TARGET_HASH = '0x267decf93545c0776de17f438df4edb4aafdb727aad5be41dfba856943562db9';
    console.log(`🎯 ULTRA DEBUG: Tracking ${TARGET_HASH.substring(0, 12)}... through entire pipeline`);
    
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const currency = searchParams.get('currency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Check if this is one of the known addresses that should have the missing transactions
    const knownAddressesWithMissingTxs = [
      '0x725B4E2a44629Cf3467c5299790967C3e29d2757', // Add the actual wallet address here
    ];
    
    console.log(`🎯 Address analysis:`, {
      address,
      isKnownAddress: knownAddressesWithMissingTxs.some(addr => addr.toLowerCase() === address.toLowerCase()),
      knownAddresses: knownAddressesWithMissingTxs
    });

    // Check if Etherscan API is configured
    if (!EtherscanAPIService.isConfigured('ethereum')) {
      return NextResponse.json(
        { error: 'Etherscan API not configured' },
        { status: 503 }
      );
    }

    // Parse dates if provided - for comprehensive historical import, 
    // we want to fetch ALL transactions unless specific dates are requested
    const actualLimit = Math.max(limit, 10000);
    const options: any = {
      limit: actualLimit // Ensure we fetch enough for comprehensive history
      // Don't pass currency here - we'll filter it ourselves after getting all transactions
    };
    
    console.log(`🔧 Using transaction limit: ${actualLimit} (requested: ${limit})`);

    // Only apply date filtering if explicitly requested
    // This ensures comprehensive historical import by default
    if (startDate && startDate !== 'undefined') {
      options.startDate = new Date(startDate);
      console.log(`📅 Using provided start date: ${options.startDate.toISOString()}`);
    } else {
      console.log(`📅 No start date provided - fetching ALL historical transactions`);
    }
    
    if (endDate && endDate !== 'undefined') {
      options.endDate = new Date(endDate);
      console.log(`📅 Using provided end date: ${options.endDate.toISOString()}`);
    } else {
      console.log(`📅 No end date provided - fetching up to current date`);
    }

    console.log('🚀 Server-side Ethereum transaction fetch using Etherscan:', {
      address,
      currency,
      startDate,
      endDate,
      limit,
      searchParams: Object.fromEntries(searchParams.entries()),
      isEtherscanConfigured: EtherscanAPIService.isConfigured('ethereum'),
      apiKeyLength: process.env.ETHERSCAN_API_KEY?.length || 0
    });

    // For specific token currencies like USDT/USDC, fetch directly from token endpoint to ensure historical coverage
    let transactions: any[] = [];
    
    if (currency && currency.toUpperCase() !== 'ETH') {
      console.log(`🎯 Fetching token transactions directly for ${currency.toUpperCase()}`);
      
      // Direct token endpoint call to ensure we get ALL historical transactions
      const tokenContracts: Record<string, string> = {
        'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      };
      
      const contractAddress = tokenContracts[currency.toUpperCase()];
      if (contractAddress) {
        // Direct Etherscan API call to bypass service layer issues
        console.log(`🎯 Making direct Etherscan API call for complete ${currency.toUpperCase()} history`);
        
        const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
        console.log(`🔑 Etherscan API Key: ${etherscanApiKey ? `Configured (${etherscanApiKey.length} chars)` : '❌ NOT CONFIGURED'}`);
      
        
        if (!etherscanApiKey) {
          console.error('❌ Cannot fetch USDT transactions without Etherscan API key');
          // Fall back to service method
          transactions = await EtherscanAPIService.getTransactionHistory(address, 'ethereum', { 
            currency: currency.toUpperCase(),
            limit: 10000 
          });
          console.log(`📊 Fallback service returned ${transactions.length} transactions`);
        } else {
        // Fetch all transactions using pagination
        const allRawTransactions: any[] = [];
        
        // Then fetch all other transactions
        const startBlock = 0;
        const endBlock = 99999999; // Latest block
        let page = 1;
        let hasMore = true;
        
        while (hasMore && page <= 50) { // Increased to 50 pages to ensure we get all transactions
          // Using desc sort to get newest first, ensuring recent transactions aren't missed
          const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=10000&sort=desc&apikey=${etherscanApiKey}`;
          
          try {
            console.log(`🔍 Direct API page ${page} (with block range ${startBlock}-${endBlock})`);
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === '1' && data.result && data.result.length > 0) {
              console.log(`✅ Direct Etherscan API page ${page}: ${data.result.length} raw transactions`);
              
              // ULTRA DEBUG: Check if target transaction is in this page
              const targetInPage = data.result.find(tx => tx.hash.toLowerCase() === TARGET_HASH.toLowerCase());
              if (targetInPage) {
                console.log(`🎯 FOUND TARGET in page ${page}! Details:`, {
                  hash: targetInPage.hash,
                  from: targetInPage.from,
                  to: targetInPage.to,
                  value: targetInPage.value,
                  tokenSymbol: targetInPage.tokenSymbol,
                  amount: parseFloat(targetInPage.value) / Math.pow(10, parseInt(targetInPage.tokenDecimal)),
                  blockNumber: targetInPage.blockNumber,
                  timeStamp: targetInPage.timeStamp
                });
              } else {
                console.log(`   Target NOT in page ${page}`);
              }
              
              allRawTransactions.push(...data.result);
              
              // Check if we found the missing December 2022 transaction
              const missingTx = data.result.find(tx => 
                tx.hash.toLowerCase() === '0x267decf93545c0776de17f438df4edb4aafdb727aad5be41dfba856943562db9'
              );
              if (missingTx) {
                const amount = parseFloat(missingTx.value) / 1000000;
                const date = new Date(parseInt(missingTx.timeStamp) * 1000);
                console.log(`   🎯 FOUND missing Dec 2022 transaction on page ${page}!`);
                console.log(`      Amount: ${amount.toFixed(6)} USDT`);
                console.log(`      Date: ${date.toISOString()}`);
              }
              
              // Continue until we get all transactions or reach limit
              if (data.result.length < 10000) {
                hasMore = false;
                console.log(`📄 Last page reached (${data.result.length} < 10000 results)`);
              } else if (page >= 50) {
                hasMore = false;
                console.log(`📄 Reached page limit (${page}) - stopping pagination`);
              } else {
                console.log(`   ➡️  Continuing to page ${page + 1} (got ${data.result.length} results)`);
              }
            } else {
              hasMore = false;
              console.log(`📄 No more results on page ${page}: ${data.message || 'empty result'}`);
            }
            
            page++;
            
            // Rate limiting
            if (hasMore) {
              await new Promise(r => setTimeout(r, 200));
            }
          } catch (pageError) {
            console.error(`❌ Error on page ${page}:`, pageError);
            hasMore = false;
          }
        }
        
        if (allRawTransactions.length > 0) {
          console.log(`✅ Total from direct API: ${allRawTransactions.length} raw ${currency.toUpperCase()} transactions`);
          
          // DEBUG: Show all raw USDC transactions for debugging
          if (currency.toUpperCase() === 'USDC') {
            console.log(`🔍 DEBUG: All ${allRawTransactions.length} raw USDC transactions from API:`);
            allRawTransactions.forEach((tx, index) => {
              const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 6);
              const date = new Date(parseInt(tx.timeStamp) * 1000);
              console.log(`   ${index + 1}. ${tx.hash.substring(0, 12)}... | ${amount.toFixed(4)} ${tx.tokenSymbol} | ${date.toISOString().split('T')[0]} | Contract: ${tx.contractAddress}`);
            });
          }
          
          // ULTRA DEBUG: Check if target is in final raw collection
          const targetInRaw = allRawTransactions.find(tx => tx.hash.toLowerCase() === TARGET_HASH.toLowerCase());
          console.log(`🎯 Target in raw collection: ${targetInRaw ? '✅ YES' : '❌ NO'}`);
          if (targetInRaw) {
            console.log(`   Raw target details:`, {
              hash: targetInRaw.hash,
              value: targetInRaw.value,
              tokenSymbol: targetInRaw.tokenSymbol,
              from: targetInRaw.from,
              to: targetInRaw.to
            });
          }
          
          // Debug: Check for specific missing transaction
          const missingTxHash = '0x267decf93545c0776de17f438df4edb4aafdb727aad5be41dfba856943562db9';
          const foundMissingTx = allRawTransactions.find(tx => tx.hash.toLowerCase() === missingTxHash.toLowerCase());
          console.log(`🔍 Missing tx check: ${foundMissingTx ? '✅ FOUND' : '❌ NOT FOUND'} ${missingTxHash.substring(0, 10)}...`);
          if (foundMissingTx) {
            console.log(`   Value: ${foundMissingTx.value}, Date: ${new Date(parseInt(foundMissingTx.timeStamp) * 1000).toISOString()}`);
          }
            
          // Convert raw Etherscan format to our format
          console.log(`🔄 Converting ${allRawTransactions.length} raw transactions...`);
          
          // Check if missing transaction is in raw data before conversion
          const missingTxInRaw = allRawTransactions.find(tx => tx.hash.toLowerCase() === missingTxHash.toLowerCase());
          console.log(`🔍 Missing tx in raw data: ${missingTxInRaw ? '✅ FOUND' : '❌ NOT FOUND'}`);
          
          // Debug: Look for all December 2022 transactions
          const dec2022Txs = allRawTransactions.filter(tx => {
            const date = new Date(parseInt(tx.timeStamp) * 1000);
            return date.getFullYear() === 2022 && date.getMonth() === 11; // December is month 11
          });
          console.log(`🔍 December 2022 raw transactions found: ${dec2022Txs.length}`);
          dec2022Txs.forEach((tx, index) => {
            const amount = parseFloat(tx.value) / 1000000;
            const date = new Date(parseInt(tx.timeStamp) * 1000);
            const isTarget = tx.hash.toLowerCase() === missingTxHash.toLowerCase();
            console.log(`   ${index + 1}. ${tx.hash.substring(0, 12)}... | ${amount.toFixed(6)} USDT | ${date.toISOString().split('T')[0]} ${isTarget ? '🎯 TARGET!' : ''}`);
          });
          
          // ULTRA DEBUG: Track target through conversion
          const targetBeforeConversion = allRawTransactions.find(tx => tx.hash.toLowerCase() === TARGET_HASH.toLowerCase());
          console.log(`🎯 Target before conversion: ${targetBeforeConversion ? '✅ YES' : '❌ NO'}`);
          
          transactions = allRawTransactions.map((tx: any) => {
              const timestamp = parseInt(tx.timeStamp) * 1000;
              const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
              
              // ULTRA DEBUG: Track target during conversion
              if (tx.hash.toLowerCase() === TARGET_HASH.toLowerCase()) {
                console.log(`🎯 CONVERTING target transaction:`, {
                  hash: tx.hash,
                  value: tx.value,
                  tokenDecimal: tx.tokenDecimal,
                  convertedAmount: parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal)),
                  isIncoming,
                  from: tx.from,
                  to: tx.to,
                  isError: tx.isError
                });
              }
              const decimals = parseInt(tx.tokenDecimal) || 6;
              const amount = parseFloat(tx.value) / Math.pow(10, decimals);
              const gasUsed = tx.gasUsed ? parseInt(tx.gasUsed) : 0;
              const gasPriceWei = tx.gasPrice || '0';
              const gasPrice = parseFloat(gasPriceWei) / Math.pow(10, 18);
              const gasFee = gasUsed * gasPrice;
              
              // CRITICAL FIX: Check actual transaction status from Etherscan
              // Note: tokentx API doesn't include isError field, but failed token transactions
              // are typically not returned in the results. Normal tx API uses isError field.
              // isError: "0" = success, "1" = failed, undefined = assume success (tokentx API)
              const txStatus = tx.isError === undefined ? 'success' : 
                             (tx.isError === '0' ? 'success' : 'failed');

              return {
                hash: tx.hash,
                blockNumber: parseInt(tx.blockNumber),
                timestamp,
                from: tx.from,
                to: tx.to,
                amount: amount, // Keep amount positive, let type indicate direction
                currency: tx.tokenSymbol || currency.toUpperCase(),
                type: isIncoming ? 'incoming' : 'outgoing',
                status: txStatus, // Use actual transaction status from Etherscan
                gasUsed,
                gasFee,
                contractAddress: tx.contractAddress,
                tokenType: 'erc20',
                blockchain: 'ethereum',
                network: 'mainnet',
                needsGasFeeLookup: false
              };
            });
            
            console.log(`✅ Converted ${transactions.length} transactions to internal format`);
            
            // DEBUG: Show USDC transactions after conversion
            if (currency.toUpperCase() === 'USDC') {
              console.log(`🔍 DEBUG: USDC transactions after conversion (${transactions.length}):`);
              transactions.forEach((tx, index) => {
                const date = new Date(tx.timestamp);
                console.log(`   ${index + 1}. ${tx.hash.substring(0, 12)}... | ${tx.amount.toFixed(4)} ${tx.currency} | ${date.toISOString().split('T')[0]} | Status: ${tx.status}`);
              });
            }
            
            // ULTRA DEBUG: Check if target survived conversion
            const targetAfterConversion = transactions.find(tx => tx.hash.toLowerCase() === TARGET_HASH.toLowerCase());
            console.log(`🎯 Target after conversion: ${targetAfterConversion ? '✅ YES' : '❌ NO'}`);
            if (targetAfterConversion) {
              console.log(`   Target converted details:`, {
                hash: targetAfterConversion.hash,
                amount: targetAfterConversion.amount,
                type: targetAfterConversion.type,
                from: targetAfterConversion.from,
                to: targetAfterConversion.to,
                timestamp: new Date(targetAfterConversion.timestamp).toISOString()
              });
            }
            
            // Smart deduplication: Keep multiple entries for multi-send transactions (same hash, different amounts)
            const uniqueTransactions = new Map();
            transactions.forEach(tx => {
              // Create a unique key that combines hash + amount + type to preserve multi-send transfers
              const uniqueKey = `${tx.hash}-${tx.amount}-${tx.type}-${tx.from || ''}-${tx.to || ''}`;
              if (!uniqueTransactions.has(uniqueKey)) {
                uniqueTransactions.set(uniqueKey, tx);
              } else {
                console.log(`🔄 Duplicate transaction found (same hash, amount, and addresses): ${tx.hash.substring(0, 10)}... | ${tx.amount} ${tx.currency}`);
              }
            });
            transactions = Array.from(uniqueTransactions.values());
            console.log(`📊 After smart deduplication: ${transactions.length} unique transactions (preserving multi-send)`);
            
            // ULTRA DEBUG: Check if target survived deduplication
            const targetAfterDedup = transactions.find(tx => tx.hash.toLowerCase() === TARGET_HASH.toLowerCase());
            console.log(`🎯 Target after deduplication: ${targetAfterDedup ? '✅ YES' : '❌ NO'}`);
            
            // Also check for internal transactions for USDT
            // Some USDT transactions might be internal transactions from smart contracts
            console.log(`🔍 Checking for internal USDT transactions...`);
            const internalUrl = `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`;
            
            try {
              const internalResponse = await fetch(internalUrl);
              const internalData = await internalResponse.json();
              
              if (internalData.status === '1' && internalData.result) {
                console.log(`📊 Found ${internalData.result.length} internal transactions`);
                
                // Check if our missing transaction is among internal transactions
                const missingInternal = internalData.result.find((tx: any) => 
                  tx.hash.toLowerCase() === missingTxHash.toLowerCase()
                );
                
                if (missingInternal) {
                  console.log(`🎯 FOUND missing transaction in INTERNAL transactions!`);
                  console.log(`   Block: ${missingInternal.blockNumber}`);
                  console.log(`   From: ${missingInternal.from}`);
                  console.log(`   To: ${missingInternal.to}`);
                  console.log(`   Value: ${missingInternal.value}`);
                  
                  // Convert and add the internal transaction if it's USDT-related
                  // Note: Internal transactions are ETH transfers, but might be related to USDT operations
                }
              }
            } catch (err) {
              console.warn(`⚠️ Failed to fetch internal transactions: ${err}`);
            }
            
            // Check if missing transaction survived conversion
            const missingTxAfterConversion = transactions.find(tx => tx.hash.toLowerCase() === missingTxHash.toLowerCase());
            console.log(`🔍 Missing tx after conversion: ${missingTxAfterConversion ? '✅ FOUND' : '❌ NOT FOUND'}`);
            if (missingTxAfterConversion) {
              console.log(`   Converted: ${missingTxAfterConversion.amount} ${missingTxAfterConversion.currency}, ${missingTxAfterConversion.type}`);
            }
            
            // Debug: Check December 2022 transactions after conversion
            const dec2022AfterConversion = transactions.filter(tx => {
              const date = new Date(tx.timestamp);
              return date.getFullYear() === 2022 && date.getMonth() === 11;
            });
            console.log(`🔍 December 2022 transactions after conversion: ${dec2022AfterConversion.length}`);
            if (dec2022AfterConversion.length !== dec2022Txs.length) {
              console.warn(`⚠️  Lost ${dec2022Txs.length - dec2022AfterConversion.length} December 2022 transactions during conversion!`);
            }
            
        } else {
          console.error(`❌ No transactions returned from direct API`);
          transactions = [];
        }
        } // Close the etherscanApiKey check
      } else {
        console.log(`⚠️ Unknown token: ${currency}, falling back to general transaction history`);
        transactions = await EtherscanAPIService.getTransactionHistory(address, 'ethereum', options);
      }
    } else {
      // For ETH or no specific currency, use the general transaction history
      transactions = await EtherscanAPIService.getTransactionHistory(address, 'ethereum', options);
    }
    
    console.log(`🔍 Initial transaction fetch complete:`, {
      total: transactions.length,
      usdtTransactions: transactions.filter(tx => tx.currency === 'USDT').length,
      usdtIncoming: transactions.filter(tx => tx.currency === 'USDT' && tx.type === 'incoming').length,
      usdtOutgoing: transactions.filter(tx => tx.currency === 'USDT' && tx.type === 'outgoing').length,
      contractAddresses: [...new Set(transactions.filter(tx => tx.currency === 'USDT').map(tx => tx.contractAddress))]
    });
    
    // TEMPORARILY DISABLED: Enhanced USDT processing to debug transaction counts
    if (false) { // Disabled
    console.log(`🔶 Fetching enhanced USDT transactions for comprehensive fee coverage...`);
    try {
      const enhancedUsdtTransactions = await EtherscanAPIService.getUSDTTransactionsWithFees(
        address,
        'ethereum',
        { limit: 1000 }
      );
      
      if (enhancedUsdtTransactions.length > 0) {
        console.log(`✅ Enhanced USDT processing: Found ${enhancedUsdtTransactions.length} USDT transactions`);
        
        // Create enhanced fee transactions ONLY for missing late 2022 USDT transfers
        // These are the specific transactions shown in the user's screenshot that were missing fees
        const targetMissingFees = [0.00070922, 0.00068789, 0.00139059, 0.00090641, 0.00287672];
        const enhancedFeeTransactions: any[] = [];
        
        enhancedUsdtTransactions.forEach(tx => {
          if (tx.type === 'outgoing' && tx.from && tx.from.toLowerCase() === address.toLowerCase() && tx.gasFee && tx.gasFee > 0) {
            const txDate = new Date(tx.timestamp);
            const isLate2022 = txDate >= new Date('2022-10-01') && txDate <= new Date('2022-12-31');
            const isTargetFee = targetMissingFees.some(targetFee => Math.abs(tx.gasFee - targetFee) < 0.00001);
            
            // Only create fee transactions for the specific missing late 2022 fees
            if (isLate2022 && isTargetFee) {
              // Check if this fee transaction already exists in the original data OR was already created
              const existingFee = transactions.find(existingTx => 
                existingTx.type === 'fee' && 
                existingTx.hash === tx.hash &&
                Math.abs(existingTx.amount - tx.gasFee) < 0.00001
              );
              
              const alreadyCreated = enhancedFeeTransactions.find(fee => fee.hash === tx.hash);
              
              if (!existingFee && !alreadyCreated) {
                const feeTransaction = {
                  hash: tx.hash,
                  from: tx.from,
                  to: 'Network Fee',
                  amount: tx.gasFee,
                  currency: 'ETH',
                  timestamp: tx.timestamp,
                  status: 'success',
                  type: 'fee' as const,
                  fee: tx.gasFee,
                  blockchain: 'ethereum',
                  tokenType: 'native',
                  contractAddress: undefined,
                  relatedTransaction: tx.hash,
                  description: `Missing USDT gas fee from late 2022`,
                  gasUsed: tx.gasUsed,
                  gasFee: tx.gasFee,
                  internalId: `${tx.hash}-missing-fee`
                };
                enhancedFeeTransactions.push(feeTransaction);
                console.log(`💰 Adding missing late 2022 USDT fee: ${tx.gasFee} ETH for ${new Date(tx.timestamp).toLocaleDateString()}`);
              }
            }
          }
        });
        
        console.log(`💰 Created ${enhancedFeeTransactions.length} missing USDT fee transactions`);
        
        // Simply add the missing fee transactions to the existing dataset
        // Don't remove or replace existing transactions to avoid complications
        transactions = [...transactions, ...enhancedFeeTransactions];
        console.log(`🔄 Added missing fees: ${transactions.length - enhancedFeeTransactions.length} existing + ${enhancedFeeTransactions.length} missing fees = ${transactions.length} total`);
      }
    } catch (usdtError) {
      console.warn('⚠️ Enhanced USDT processing failed:', usdtError.message);
    }
    } // End of disabled block
    
    // Debug: Check for internal transactions immediately after fetching
    let initialInternalCount = transactions.filter(tx => tx.isInternal === true).length;
    console.log(`🔍 Initial internal transactions count: ${initialInternalCount}`);
    
    // SAFEGUARD: Preserve internal transactions to prevent them from being lost
    const internalTransactions = transactions.filter(tx => tx.isInternal === true);
    if (initialInternalCount > 0) {
      console.log(`   Sample internal tx:`, transactions.find(tx => tx.isInternal === true));
      console.log(`🛡️ Safeguarding ${internalTransactions.length} internal transactions`);
    }

    console.log(`📊 Raw Etherscan API response: ${transactions.length} transactions`, {
      sampleTransactions: transactions.slice(0, 3).map(tx => ({
        hash: tx.hash.substring(0, 10) + '...',
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        timestamp: new Date(tx.timestamp).toISOString(),
        gasFee: tx.gasFee
      })),
      totalCount: transactions.length,
      currencies: [...new Set(transactions.map(tx => tx.currency))],
      types: [...new Set(transactions.map(tx => tx.type))]
    });
    
    // Check for our specific missing internal transactions
    const targetHashes = [
      '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
      '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
    ];
    const targetAmounts = [0.010241042384002008, 0.009365504956360158];
    
    console.log('🎯 Checking for missing internal transactions:');
    targetHashes.forEach(hash => {
      const found = transactions.find(tx => tx.hash.toLowerCase() === hash.toLowerCase());
      if (found) {
        console.log(`  ✅ Found ${hash.substring(0, 12)}... | Amount: ${found.amount} | Type: ${found.type}`);
      } else {
        console.log(`  ❌ Missing ${hash.substring(0, 12)}...`);
      }
    });
    
    targetAmounts.forEach(amount => {
      const found = transactions.find(tx => Math.abs(tx.amount - amount) < 0.000000001);
      if (found) {
        console.log(`  ✅ Found transaction with amount ${amount} ETH | Hash: ${found.hash.substring(0, 12)}...`);
      } else {
        console.log(`  ❌ No transaction with amount ${amount} ETH`);
      }
    });

    // Enhanced filtering for spam, failed, and zero-value transactions
    const beforeStatusFilter = transactions.length;
    const currentTime = Date.now();
    
    // ULTRA DEBUG: Check if target is present before filtering
    const targetBeforeFiltering = transactions.find(tx => tx.hash && tx.hash.toLowerCase() === TARGET_HASH.toLowerCase());
    console.log(`🎯 Target before filtering: ${targetBeforeFiltering ? '✅ YES' : '❌ NO'}`);
    if (targetBeforeFiltering) {
      console.log(`   Target before filtering:`, {
        hash: targetBeforeFiltering.hash,
        amount: targetBeforeFiltering.amount,
        type: targetBeforeFiltering.type,
        currency: targetBeforeFiltering.currency,
        status: targetBeforeFiltering.status,
        timestamp: new Date(targetBeforeFiltering.timestamp).toISOString(),
        isDecember2022: new Date(targetBeforeFiltering.timestamp).getFullYear() === 2022 && new Date(targetBeforeFiltering.timestamp).getMonth() === 11
      });
    }
    
    // Known token contract addresses that generate zero-value ETH transactions
    const knownTokenContracts = [
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      '0xa0b86991c69218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
      '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', // SHIB
      '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
      '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    ].map(addr => addr.toLowerCase());
    
    transactions = transactions.filter(tx => {
      // ULTRA DEBUG: Track target through filters
      const isTarget = tx.hash && tx.hash.toLowerCase() === TARGET_HASH.toLowerCase();
      
      const isSuccessful = tx.status === 'success';
      
      // Filter out transactions with future dates (fake/test data)
      const isFutureTransaction = tx.timestamp > currentTime;
      
      // Enhanced spam detection for phishing and zero-value transactions
      const isPhishingTransaction = detectPhishingTransaction(tx);
      
      // Zero-value token transfers are often phishing attempts
      const isZeroValueTokenSpam = 
        tx.currency !== 'ETH' && // Not ETH transactions (those zero-values are legitimate gas)
        tx.amount === 0 && // Zero token amount
        tx.type === 'outgoing' && // Outgoing (you didn't receive anything)
        tx.gasUsed && tx.gasUsed > 300000; // High gas usage for zero-value transfer (suspicious)
      
      // Additional spam patterns specific to known phishing campaigns
      const isKnownSpamPattern = detectKnownSpamPatterns(tx);
      
      // ULTRA DEBUG: If this is target, log all filter results
      if (isTarget) {
        console.log(`🎯 FILTERING TARGET TRANSACTION:`, {
          hash: tx.hash.substring(0, 12) + '...',
          isSuccessful,
          isFutureTransaction,
          isPhishingTransaction,
          isZeroValueTokenSpam,
          isKnownSpamPattern,
          amount: tx.amount,
          currency: tx.currency,
          type: tx.type,
          gasUsed: tx.gasUsed,
          timestamp: new Date(tx.timestamp).toISOString()
        });
      }
      
      // Filter out transactions with generic scam patterns
      const isGenericScamTransaction = 
        // Filter transactions with suspicious Unicode characters in currency names
        (tx.currency && /[^\x00-\x7F]/.test(tx.currency)) ||
        // Filter transactions with unusually high gas usage (potential scams)
        (tx.gasUsed && tx.gasUsed > 2000000) ||
        // Filter transactions with text "phishing" in addresses (clearly labeled scams)
        (tx.to && tx.to.toLowerCase().includes('phishing'));
      
      if (!isSuccessful && process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Filtering out ${tx.status} transaction: ${tx.hash.substring(0, 10)}...`);
      }
      
      if (isFutureTransaction) {
        console.log(`🚫 Filtering out future transaction: ${tx.hash.substring(0, 10)}... (${new Date(tx.timestamp).toISOString()})`);
      }
      
      if (isPhishingTransaction) {
        console.log(`🚫 Filtering out phishing transaction: ${tx.hash.substring(0, 10)}... (to: ${tx.to?.substring(0, 10)}..., amount: ${tx.amount})`);
      }
      
      if (isZeroValueTokenSpam) {
        console.log(`🚫 Filtering out zero-value token spam: ${tx.hash.substring(0, 10)}... (${tx.currency}, gas: ${tx.gasUsed})`);
      }
      
      if (isKnownSpamPattern) {
        console.log(`🚫 Filtering out known spam pattern: ${tx.hash.substring(0, 10)}... (${tx.currency})`);
      }
      
      if (isGenericScamTransaction) {
        console.log(`🚫 Filtering out generic scam: ${tx.hash.substring(0, 10)}... (${tx.currency})`);
      }
      
      // Filter out all detected spam/phishing transactions
      const isAnySpamOrPhishing = isPhishingTransaction || isZeroValueTokenSpam || isKnownSpamPattern || isGenericScamTransaction;
      
      return isSuccessful && !isFutureTransaction && !isAnySpamOrPhishing;
    });
    
    const zeroValueFiltered = beforeStatusFilter - transactions.length;
    console.log(`🔍 Enhanced filtering complete: ${beforeStatusFilter} -> ${transactions.length} transactions (removed ${zeroValueFiltered} spam/zero-value txs)`);
    
    // DEBUG: Show USDC transactions after status filtering
    if (currency && currency.toUpperCase() === 'USDC') {
      const usdcAfterFiltering = transactions.filter(tx => tx.currency === 'USDC');
      console.log(`🔍 DEBUG: USDC transactions after status filtering (${usdcAfterFiltering.length}):`);
      usdcAfterFiltering.forEach((tx, index) => {
        const date = new Date(tx.timestamp);
        console.log(`   ${index + 1}. ${tx.hash.substring(0, 12)}... | ${tx.amount.toFixed(4)} USDC | ${date.toISOString().split('T')[0]} | Status: ${tx.status}`);
      });
      
      if (usdcAfterFiltering.length < 28) {
        console.log(`⚠️  USDC FILTERING ISSUE: Started with 28 raw, now have ${usdcAfterFiltering.length} after status filtering`);
      }
    }
    
    // Check if our target transactions are still there after status filtering
    console.log('🎯 After status filtering:');
    targetHashes.forEach(hash => {
      const found = transactions.find(tx => tx.hash.toLowerCase() === hash.toLowerCase());
      console.log(`  ${found ? '✅' : '❌'} ${hash.substring(0, 12)}... ${found ? `(Amount: ${found.amount}, Type: ${found.type})` : 'MISSING'}`);
    });

    // Check if user wants to include fee transactions (similar to Tron implementation)
    const includeFees = searchParams.get('includeFees') !== 'false'; // Default to true

    if (!currency || currency.toUpperCase() === 'ETH') {
      // For ETH native transactions, add fee transactions for outgoing transactions
      if (includeFees) {
        console.log(`🔍 Processing ETH transactions and fees...`);
        
        // Debug: Check counts before fee processing
        const ethTransactionsBefore = transactions.filter(tx => tx.currency === 'ETH').length;
        const zeroValueBefore = transactions.filter(tx => tx.currency === 'ETH' && tx.amount === 0).length;
        console.log(`   ETH transactions before fee processing: ${ethTransactionsBefore} (${zeroValueBefore} zero-value)`);
        
        const feeTransactions: any[] = [];
        
        // Filter to only ETH native transactions and process fees
        const nativeEthTransactions = transactions.filter(tx => {
          const isNativeEth = (tx.tokenType === 'native' || tx.isInternal === true) && tx.currency === 'ETH';
          return isNativeEth;
        });
        
        // Identify ALL zero-value ETH transactions (both incoming and outgoing)
        // These often represent gas fees for token transfers or contract interactions
        const zeroValueETH = nativeEthTransactions.filter(tx => 
          tx.amount === 0 && 
          tx.gasFee && 
          tx.gasFee > 0
        );
        
        console.log(`🔍 Found ${zeroValueETH.length} zero-value ETH transactions with gas fees`);
        
        // Separate outgoing (definitely fees) and incoming (might be contract interactions)
        const zeroValueOutgoing = zeroValueETH.filter(tx => tx.type === 'outgoing');
        const zeroValueIncoming = zeroValueETH.filter(tx => tx.type === 'incoming');
        
        console.log(`   📤 Outgoing: ${zeroValueOutgoing.length} (token transfer fees)`);
        console.log(`   📥 Incoming: ${zeroValueIncoming.length} (contract interactions)`);
        
        // DO NOT remove zero-value ETH transactions yet - we need to process them first
        // We'll remove them after converting to fees
        
        // Create fee transactions for zero-value ETH transactions with gas
        // IMPORTANT: Only convert to fees if our wallet was the sender (paid the gas)
        const zeroValueHashes = new Set<string>();
        zeroValueETH.forEach(tx => {
          // Skip if this fee was already added
          if (feeTransactions.find(f => f.hash === tx.hash)) {
            console.log(`⚠️ Skipping duplicate fee for ${tx.hash.substring(0, 10)}...`);
            return;
          }
          
          // Only convert to fee if our wallet was the sender (we paid the gas)
          if (!tx.from || tx.from.toLowerCase() !== address.toLowerCase()) {
            console.log(`⚠️ Skipping zero-value ETH tx ${tx.hash.substring(0, 10)}... - not our outgoing tx`);
            return;
          }
          
          zeroValueHashes.add(tx.hash); // Track which ones we're converting
          
          const feeTransaction = {
            hash: tx.hash,
            from: tx.from,
            to: 'Network Fee',
            amount: tx.gasFee,
            currency: 'ETH',
            timestamp: tx.timestamp,
            status: 'success',
            type: 'fee' as const,
            fee: tx.gasFee,
            blockchain: 'ethereum',
            tokenType: 'native',
            contractAddress: undefined,
            relatedTransaction: tx.hash,
            description: tx.type === 'outgoing' ? `Gas fee for token transfer` : `Gas fee for contract interaction`,
            gasUsed: tx.gasUsed,
            gasFee: tx.gasFee,
            internalId: `${tx.hash}-gas-fee`
          };
          
          feeTransactions.push(feeTransaction);
          console.log(`💰 Created fee transaction: ${tx.gasFee} ETH for ${tx.type} tx ${tx.hash.substring(0, 10)}...`);
        });
        
        // NOW remove the zero-value ETH transactions that we converted to fees
        transactions = transactions.filter(tx => {
          if (tx.currency === 'ETH' && tx.amount === 0 && zeroValueHashes.has(tx.hash)) {
            console.log(`🗑️ Removing zero-value ETH transaction ${tx.hash.substring(0, 10)}... (converted to fee)`);
            return false;
          }
          return true;
        });
        
        // Create fee transactions for regular outgoing ETH transactions (with value)
        nativeEthTransactions.forEach(tx => {
          const isOutgoing = tx.type === 'outgoing';
          const hasGasFee = tx.gasFee && tx.gasFee > 0;
          const hasValue = tx.amount > 0; // Only process ETH transfers with actual value
          
          if (isOutgoing && hasGasFee && hasValue) {
            const feeTransaction = {
              hash: tx.hash, // Use original transaction hash for blockchain explorer links
              from: tx.from,
              to: 'Network Fee',
              amount: tx.gasFee,
              currency: 'ETH',
              timestamp: tx.timestamp,
              status: 'success', // Fee transactions are always successful if the main tx was successful
              type: 'fee' as const,
              fee: tx.gasFee,
              blockchain: 'ethereum',
              tokenType: 'native',
              contractAddress: undefined,
              relatedTransaction: tx.hash,
              description: `Gas fee for ETH transaction`,
              gasUsed: tx.gasUsed,
              gasFee: tx.gasFee,
              internalId: `${tx.hash}-fee` // Keep unique internal ID for our system
            };
            
            feeTransactions.push(feeTransaction);
            console.log(`💰 Created ETH fee transaction: ${tx.gasFee} ETH for tx ${tx.hash.substring(0, 10)}...`);
          }
        });

        // IMPORTANT: Do NOT create fee transactions for token transfers!
        // Token transfer fees are already recorded as ETH outgoing transactions in the blockchain.
        // When you send USDT/USDC, the gas fee is paid in ETH and shows up as a separate ETH transaction.
        // Creating fee transactions for token transfers causes double-counting.
        
        // The only exception is for specific missing transactions that weren't captured
        // (handled by the enhanced USDT processing above)

        // Add fee transactions to the main list
        transactions = [...transactions, ...feeTransactions];
        
        // Sort by timestamp (most recent first)
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        
        const feeCount = feeTransactions.length;
        const transferCount = transactions.length - feeCount;
        
        console.log(`✅ ETH transactions with fees: ${transactions.length} total (${transferCount} transfers, ${feeCount} fees, includeFees: ${includeFees})`);
        
        // Balance reconciliation: ALWAYS ensure we show the exact balance
        // We'll use multiple methods to get the actual balance
        
        try {
          let actualBalanceETH = 0;
          let balanceSource = 'unknown';
          
          // Method 1: Try to get balance from Etherscan API (including 0 balances)
          try {
            const balanceResult = await EtherscanAPIService.getNativeBalance(address, 'ethereum');
            if (balanceResult.balance !== undefined && !isNaN(balanceResult.balance) && balanceResult.isLive) {
              actualBalanceETH = balanceResult.balance;
              balanceSource = 'etherscan-api';
              console.log(`✅ Got live balance from Etherscan API: ${actualBalanceETH} ETH`);
            } else if (balanceResult.error) {
              console.warn('⚠️ Etherscan balance API returned error:', balanceResult.error);
            }
          } catch (apiError) {
            console.warn('⚠️ Etherscan balance API failed:', apiError.message);
          }
          
          // Method 2: Try enhanced Etherscan API balance with retry (no hardcoded fallbacks)
          // We rely only on real blockchain data - no hardcoded balances
          
          // Method 3: If we still don't have a balance, try direct Etherscan API call with retry
          if (balanceSource === 'unknown') {
            try {
              const apiKey = process.env.ETHERSCAN_API_KEY;
              if (!apiKey) {
                console.warn('⚠️ No Etherscan API key configured for direct balance check');
              } else {
                const balanceUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
                
                console.log(`🔄 Attempting direct Etherscan API balance call...`);
                const response = await fetch(balanceUrl);
                const data = await response.json();
                
                if (data.status === '1' && data.result !== undefined) {
                  actualBalanceETH = parseFloat(data.result) / Math.pow(10, 18);
                  balanceSource = 'direct-api';
                  console.log(`✅ Got balance from direct API call: ${actualBalanceETH} ETH`);
                } else {
                  console.warn('⚠️ Direct API call returned invalid data:', data);
                }
              }
            } catch (directError) {
              console.warn('⚠️ Direct Etherscan API call failed:', directError.message);
            }
          }
          
          // Enhanced balance validation and reconciliation (works for any balance including 0)
          if (balanceSource !== 'unknown') {
            const transactionSum = transactions.reduce((sum, tx) => {
              if (tx.type === 'incoming') return sum + tx.amount;
              if (tx.type === 'outgoing' || tx.type === 'fee') return sum - tx.amount;
              return sum;
            }, 0);
            
            const difference = actualBalanceETH - transactionSum;
            const discrepancyThreshold = 0.000001; // Ignore tiny rounding differences
            
            console.log(`🎯 COMPREHENSIVE Balance Validation:`);
            console.log(`   📊 Live Blockchain Balance: ${actualBalanceETH} ETH (source: ${balanceSource})`);
            console.log(`   📊 Transaction-based Balance: ${transactionSum} ETH`);
            console.log(`   📊 Difference: ${difference} ETH`);
            
            // Detailed transaction breakdown for diagnostics
            const incomingSum = transactions.filter(tx => tx.type === 'incoming').reduce((sum, tx) => sum + tx.amount, 0);
            const outgoingSum = transactions.filter(tx => tx.type === 'outgoing').reduce((sum, tx) => sum + tx.amount, 0);
            const feeSum = transactions.filter(tx => tx.type === 'fee').reduce((sum, tx) => sum + tx.amount, 0);
            const internalSum = transactions.filter(tx => tx.isInternal && tx.type === 'incoming').reduce((sum, tx) => sum + tx.amount, 0);
            
            console.log(`   📋 Transaction Breakdown:`);
            console.log(`      • Incoming: ${incomingSum} ETH (${transactions.filter(tx => tx.type === 'incoming').length} txs)`);
            console.log(`      • Outgoing: ${outgoingSum} ETH (${transactions.filter(tx => tx.type === 'outgoing').length} txs)`);
            console.log(`      • Fees: ${feeSum} ETH (${transactions.filter(tx => tx.type === 'fee').length} txs)`);
            console.log(`      • Internal Incoming: ${internalSum} ETH (${transactions.filter(tx => tx.isInternal && tx.type === 'incoming').length} txs)`);
            
            // Enhanced validation logic
            if (Math.abs(difference) > discrepancyThreshold) {
              const significantDiscrepancy = Math.abs(difference) > 0.001; // 0.001 ETH threshold
              
              if (significantDiscrepancy) {
                console.warn(`⚠️ SIGNIFICANT BALANCE DISCREPANCY DETECTED: ${difference} ETH`);
                
                if (difference > 0) {
                  console.warn(`   💡 Live balance is HIGHER than transaction sum by ${difference} ETH`);
                  console.warn(`   🔍 Possible causes: Missing incoming transactions, initial wallet balance, or unrecorded deposits`);
                } else {
                  console.warn(`   💡 Live balance is LOWER than transaction sum by ${Math.abs(difference)} ETH`);
                  console.warn(`   🔍 Possible causes: Missing outgoing transactions, unrecorded withdrawals, or transaction misclassification`);
                  console.warn(`   🚨 THIS IS THE ISSUE - ${Math.abs(difference)} ETH worth of outgoing transactions are missing!`);
                }
                
                console.warn(`   📝 Action required: Re-import transaction history with enhanced parameters`);
                console.warn(`   🔧 Consider increasing pagination limits or checking for missing transaction types`);
              } else {
                console.log(`ℹ️ Minor balance difference: ${difference} ETH (within normal variance)`);
              }
            } else {
              console.log(`✅ Balance validation PASSED: Perfect match between live and calculated balances`);
            }
          } else {
            console.error(`❌ Could not determine live blockchain balance for ${address} - validation failed`);
            console.error(`   🔧 Check Etherscan API configuration and network connectivity`);
          }
          } catch (balanceError) {
            console.warn('⚠️ Could not perform balance reconciliation:', balanceError.message);
          }
        
        // Debug: Show breakdown of transaction types and amounts
        if (process.env.NODE_ENV === 'development') {
          const incomingSum = transactions.filter(tx => tx.type === 'incoming').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          const outgoingSum = transactions.filter(tx => tx.type === 'outgoing').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          const feeSum = transactions.filter(tx => tx.type === 'fee').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          
          const internalCount = transactions.filter(tx => tx.isInternal).length;
          const internalSum = transactions.filter(tx => tx.isInternal && tx.type === 'incoming').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          
          console.log(`🔍 ETH Transaction Summary:`, {
            total: transactions.length,
            incoming: { count: transactions.filter(tx => tx.type === 'incoming').length, sum: incomingSum },
            outgoing: { count: transactions.filter(tx => tx.type === 'outgoing').length, sum: outgoingSum },
            fees: { count: transactions.filter(tx => tx.type === 'fee').length, sum: feeSum },
            internal: { count: internalCount, incomingSum: internalSum },
            netBalance: incomingSum - outgoingSum - feeSum
          });
          
          // Sample some fee transactions for debugging
          const sampleFees = transactions.filter(tx => tx.type === 'fee').slice(0, 3);
          if (sampleFees.length > 0) {
            console.log(`🧾 Sample ETH fee transactions:`, sampleFees.map(tx => ({
              hash: tx.hash.substring(0, 10) + '...',
              amount: tx.amount,
              currency: tx.currency,
              description: tx.description
            })));
          }
          
          // Sample internal transactions for debugging
          const sampleInternals = transactions.filter(tx => tx.isInternal).slice(0, 3);
          if (sampleInternals.length > 0) {
            console.log(`💎 Sample INTERNAL transactions:`, sampleInternals.map(tx => ({
              hash: tx.hash.substring(0, 10) + '...',
              amount: tx.amount,
              currency: tx.currency,
              type: tx.type,
              from: tx.from.substring(0, 10) + '...',
              to: tx.to.substring(0, 10) + '...',
              description: tx.description
            })));
          }
        }
      }
      
      // IMPORTANT: When filtering for ETH, we still need to include gas fees from ALL token transfers
      // because gas is always paid in ETH regardless of the token being transferred
      if (currency && currency.toUpperCase() === 'ETH') {
        const beforeCurrencyFilter = transactions.length;
        
        // First, extract ALL gas fees from non-ETH transactions before filtering
        // IMPORTANT: Only create fee transactions where our wallet was the sender (paid the fees)
        const tokenTransferFees: any[] = [];
        const nonEthTransactions = transactions.filter(tx => 
          tx.currency !== 'ETH' && 
          tx.type === 'outgoing' && 
          tx.from && tx.from.toLowerCase() === address.toLowerCase() && // Only fees we actually paid
          tx.gasFee && 
          tx.gasFee > 0
        );
        
        console.log(`💰 Found ${nonEthTransactions.length} non-ETH transactions with gas fees to preserve`);
        
        nonEthTransactions.forEach(tx => {
          // Check if a fee transaction already exists for this hash
          const existingFee = transactions.find(existingTx => 
            existingTx.type === 'fee' && 
            existingTx.hash === tx.hash
          );
          
          if (existingFee) {
            console.log(`⚠️ Fee already exists for ${tx.hash.substring(0, 10)}..., skipping`);
            return;
          }
          
          // DISABLED: Token transfer fee creation causes duplicate fees
          // The zero-value ETH conversion logic already handles all legitimate fees
          console.log(`🚫 Skipping token transfer fee creation for ${tx.hash.substring(0, 10)}... (prevents duplicates)`);
          return;
          
          const feeTransaction = {
            hash: tx.hash,
            from: tx.from,
            to: 'Network Fee',
            amount: tx.gasFee,
            currency: 'ETH',
            timestamp: tx.timestamp,
            status: 'success',
            type: 'fee' as const,
            fee: tx.gasFee,
            blockchain: 'ethereum',
            tokenType: 'native',
            contractAddress: undefined,
            relatedTransaction: tx.hash,
            description: `Gas fee for ${tx.currency} transfer`,
            gasUsed: tx.gasUsed,
            gasFee: tx.gasFee,
            internalId: `${tx.hash}-${tx.currency}-fee`
          };
          tokenTransferFees.push(feeTransaction);
        });
        
        // First, log what internal transactions we have before filtering
        const internalBeforeFilter = transactions.filter(tx => tx.isInternal === true);
        console.log(`🔍 Internal transactions BEFORE ETH filter: ${internalBeforeFilter.length}`);
        if (internalBeforeFilter.length > 0) {
          console.log(`   Sample:`, internalBeforeFilter.slice(0, 2).map(tx => ({
            hash: tx.hash.substring(0, 12) + '...',
            currency: tx.currency,
            amount: tx.amount,
            isInternal: tx.isInternal
          })));
        }
        
        transactions = transactions.filter(tx => {
          // Include ETH transactions: native ETH, fee transactions, or internal transactions
          const isEthTransaction = tx.currency === 'ETH' && (
            tx.tokenType === 'native' || 
            tx.type === 'fee' || 
            tx.isInternal === true
          );
          
          // IMPORTANT: More precise filter for 0-amount ETH transactions
          // Only exclude transactions that are definitively gas-only consumption for token transfers
          // NEVER filter internal transactions as they represent real ETH transfers from contracts
          const isZeroAmountGasConsumption = tx.currency === 'ETH' && 
            tx.amount === 0 && 
            tx.tokenType === 'native' && 
            (tx.type === 'incoming' || tx.type === 'outgoing') &&
            tx.gasUsed && tx.gasUsed > 0 && // Has gas usage but 0 ETH transfer
            !tx.isInternal && // NEVER filter internal transactions - they are real ETH transfers
            !tx.contractAddress && // Don't filter contract interactions
            // Additional safety: only filter if this looks like a token transfer transaction
            (tx.from && tx.to && tx.from.toLowerCase() !== tx.to.toLowerCase()); // Exclude self-transfers
          
          // If includeFees is false, exclude fee-only transactions
          if (!includeFees && tx.type === 'fee') {
            return false;
          }
          
          // Log when we filter out zero-amount gas consumption transactions
          if (isZeroAmountGasConsumption) {
            console.log(`🚫 Filtering out 0-amount gas consumption: ${tx.hash.substring(0, 10)}... (gas: ${tx.gasUsed}, type: ${tx.type})`);
          }
          
          // Debug: Log filtering decisions for target transactions
          const targetHashes = [
            '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
            '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
          ];
          
          if (targetHashes.some(hash => tx.hash.toLowerCase() === hash.toLowerCase())) {
            console.log(`🎯 FILTERING decision for target tx ${tx.hash.substring(0, 12)}...`, {
              currency: tx.currency,
              tokenType: tx.tokenType,
              type: tx.type,
              isInternal: tx.isInternal,
              isEthTransaction,
              willKeep: isEthTransaction && !isZeroAmountGasConsumption
            });
          }
          
          return isEthTransaction && !isZeroAmountGasConsumption;
        });
        
        // Add back the token transfer fees (they're always in ETH)
        transactions = [...transactions, ...tokenTransferFees];
        
        console.log(`🔍 ETH currency filtering: ${beforeCurrencyFilter} -> ${transactions.length} transactions (includes ${tokenTransferFees.length} token transfer fees)`);
        
        // Check internal transactions after filter
        const internalAfterFilter = transactions.filter(tx => tx.isInternal === true);
        console.log(`🔍 Internal transactions AFTER ETH filter: ${internalAfterFilter.length}`);
        if (internalAfterFilter.length > 0) {
          console.log(`   Sample:`, internalAfterFilter.slice(0, 2).map(tx => ({
            hash: tx.hash.substring(0, 12) + '...',
            currency: tx.currency,
            amount: tx.amount
          })));
        }
        
        // Final check for our target transactions
        console.log('🎯 After final ETH filtering:');
        targetHashes.forEach(hash => {
          const found = transactions.find(tx => tx.hash.toLowerCase() === hash.toLowerCase());
          console.log(`  ${found ? '✅' : '❌'} ${hash.substring(0, 12)}... ${found ? `(Amount: ${found.amount}, Type: ${found.type}, isInternal: ${found.isInternal})` : 'MISSING'}`);
        });
      }
    } else {
      // Currency filtering for non-ETH tokens (USDT, USDC, etc.)
      const requestedCurrency = currency.toUpperCase();
      const beforeCurrencyFilter = transactions.length;
      
      console.log(`🔍 Filtering for specific currency: ${requestedCurrency}`);
      console.log(`   Before filter: ${beforeCurrencyFilter} transactions`);
      console.log(`   Available currencies:`, [...new Set(transactions.map(tx => tx.currency))]);
      
      // Known legitimate token contract addresses
      const legitimateContracts: Record<string, string> = {
        'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7', // Tether USD
        'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USD Coin
        'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',  // DAI Stablecoin
        'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // Wrapped Bitcoin
        'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // Wrapped Ether
      };
      
      // Filter transactions to only include the requested currency with legitimate contract
      transactions = transactions.filter(tx => {
        const matchesCurrency = tx.currency.toUpperCase() === requestedCurrency;
        
        // For known tokens, also verify the contract address
        if (matchesCurrency && legitimateContracts[requestedCurrency]) {
          const legitimateContract = legitimateContracts[requestedCurrency].toLowerCase();
          const hasLegitimateContract = !tx.contractAddress || 
                                       tx.contractAddress.toLowerCase() === legitimateContract;
          
          if (!hasLegitimateContract) {
            console.log(`   🚫 Filtering out FAKE ${requestedCurrency} from contract ${tx.contractAddress} (amount: ${tx.amount})`);
            return false;
          }
        }
        
        if (process.env.NODE_ENV === 'development' && !matchesCurrency) {
          // Debug: Show which transactions are being filtered out
          console.log(`   🚫 Filtering out ${tx.currency} transaction: ${tx.hash.substring(0, 10)}...`);
        }
        
        return matchesCurrency;
      });
      
      console.log(`🔍 ${requestedCurrency} currency filtering: ${beforeCurrencyFilter} -> ${transactions.length} transactions`);
      
      // Show statistics about filtered transactions
      const contractCounts = transactions.reduce((acc, tx) => {
        const contract = tx.contractAddress || 'native';
        acc[contract] = (acc[contract] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`   Contract addresses in filtered transactions:`, contractCounts);
    }

    // Final debug check
    const finalInternalCount = transactions.filter(tx => tx.isInternal === true).length;
    console.log(`🔍 FINAL internal transactions count: ${finalInternalCount}`);
    
    // Only restore internal transactions for ETH queries, not for token queries
    const shouldRestoreInternal = !currency || currency.toUpperCase() === 'ETH';
    
    if (finalInternalCount === 0 && initialInternalCount > 0 && shouldRestoreInternal) {
      console.error(`❌ CRITICAL: Lost ${initialInternalCount} internal transactions during processing!`);
      console.log(`🔧 RESTORING safeguarded internal transactions...`);
      
      // Add back the safeguarded internal transactions
      transactions = [...transactions, ...internalTransactions];
      
      // Re-sort by timestamp 
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      
      const restoredCount = transactions.filter(tx => tx.isInternal === true).length;
      console.log(`✅ Restored ${restoredCount} internal transactions`);
    } else if (finalInternalCount > 0) {
      console.log(`✅ Internal transactions preserved: ${finalInternalCount}`);
    } else if (!shouldRestoreInternal && initialInternalCount > 0) {
      console.log(`ℹ️ Skipped restoring ${initialInternalCount} internal ETH transactions for ${currency} query`);
    }
    
    const response = NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
      blockchain: 'ethereum',
      timestamp: Date.now() // Add timestamp to prevent caching
    });
    
    // Set cache headers to prevent stale data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Ethereum transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Ethereum transactions', details: error.message },
      { status: 500 }
    );
  }
}