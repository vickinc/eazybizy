import { NextRequest, NextResponse } from 'next/server';
import { TronGridService } from '@/services/integrations/tronGridService';

/**
 * Server-side API endpoint for fetching Tron transactions using TronGrid API
 * This avoids CORS issues when accessing TronGrid API from the browser
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const blockchain = searchParams.get('blockchain');
    const currency = searchParams.get('currency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') || '1000';

    if (!address || !blockchain) {
      return NextResponse.json(
        { error: 'Address and blockchain are required' },
        { status: 400 }
      );
    }

    if (blockchain.toLowerCase() !== 'tron') {
      return NextResponse.json(
        { error: 'Only Tron blockchain is supported' },
        { status: 400 }
      );
    }

    // Check if TronGrid is configured (server-side check)
    const apiKey = process.env.TRONGRID_API_KEY;
    console.log('🔍 TronGrid API key check:', apiKey ? 'Configured' : 'Not configured');
    
    if (!apiKey || apiKey.length < 10) {
      console.error('❌ TronGrid API key not found in server environment variables');
      return NextResponse.json(
        { error: 'TronGrid API is not configured on the server. Please add TRONGRID_API_KEY to your .env.local file and restart the server.' },
        { status: 503 }
      );
    }

    console.log('🚀 Server-side Tron transaction fetch using TronGrid:', {
      address,
      currency,
      startDate,
      endDate,
      limit,
      apiKeyConfigured: !!apiKey
    });

    const options = {
      limit: parseInt(limit),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      onlyConfirmed: true
    };

    let transactions = [];

    if (!currency || currency.toUpperCase() === 'TRX') {
      // Fetch native TRX transactions
      const nativeTrxTransactions = await TronGridService.getTransactionHistory(address, options);
      
      // Filter out pending/failed transactions - only include successful ones
      const successfulTrxTransactions = nativeTrxTransactions.filter(tx => {
        const isSuccessful = tx.status === 'success';
        if (!isSuccessful) {
          console.log(`⚠️ Filtering out ${tx.status} TRX transaction: ${tx.hash.substring(0, 10)}...`);
        }
        return isSuccessful;
      });
      
      // Check if user wants to include fee transactions
      const includeFees = searchParams.get('includeFees') !== 'false'; // Default to true to show TRC-20 fees
      
      // Filter to only native TRX transactions (not TRC-20)
      let filteredNativeTransactions = successfulTrxTransactions.filter(tx => {
        const isNativeTrx = tx.tokenType === 'native' && tx.currency === 'TRX';
        
        if (!isNativeTrx) return false;
        
        // If includeFees is false, exclude fee-only transactions
        if (!includeFees && tx.type === 'fee') {
          return false;
        }
        
        return true;
      });
      
      // Additionally, if includeFees is true, fetch TRC-20 transactions to get their fees
      let trc20FeeTransactions: any[] = [];
      if (includeFees) {
        try {
          console.log(`🔍 Fetching TRC-20 transactions to extract TRX fees...`);
          
          // Fetch all TRC-20 transactions to get fees (not just USDT)
          const trc20Contracts = [
            'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT
            'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', // USDC
          ];
          
          for (const contractAddress of trc20Contracts) {
            try {
              const trc20Url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`;
              const trc20Params = new URLSearchParams({
                contract_address: contractAddress,
                limit: Math.min(parseInt(limit), 100).toString() // Reduced per contract to avoid too many requests
              });
          
              if (startDate) {
                trc20Params.append('min_timestamp', new Date(startDate).getTime().toString());
              }
              if (endDate) {
                trc20Params.append('max_timestamp', new Date(endDate).getTime().toString());
              }
              
              const headers: HeadersInit = {
                'Content-Type': 'application/json',
              };
              
              if (apiKey) {
                headers['TRON-PRO-API-KEY'] = apiKey;
              }
              
              const trc20Response = await fetch(`${trc20Url}?${trc20Params.toString()}`, {
                method: 'GET',
                headers
              });
              
              if (trc20Response.ok) {
                const trc20Data = await trc20Response.json();
                const trc20Transactions = trc20Data.data || [];
                
                // Get token symbol from contract address
                const tokenSymbol = contractAddress === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' ? 'USDT' : 
                                  contractAddress === 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8' ? 'USDC' : 'TRC20';
                
                console.log(`📊 Found ${trc20Transactions.length} ${tokenSymbol} transactions to extract fees from`);
                
                // Extract TRX fees from TRC-20 transactions
                for (const tx of trc20Transactions) {
                  const isOutgoing = tx.from?.toLowerCase() === address.toLowerCase();
                  
                  // Only create fee transactions for outgoing TRC-20 transactions
                  if (isOutgoing) {
                    try {
                      // Get transaction info for fee information (not basic transaction details)
                      const txInfoUrl = `https://api.trongrid.io/wallet/gettransactioninfobyid`;
                      const txInfoResponse = await fetch(txInfoUrl, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ value: tx.transaction_id })
                      });
                      
                      if (txInfoResponse.ok) {
                        const txInfo = await txInfoResponse.json();
                        
                        if (txInfo && txInfo.fee) {
                          // Extract fee from transaction info - fees are in receipt object and top-level fee
                          const totalFee = (txInfo.fee || 0) / 1_000_000; // Total fee in TRX
                          const receipt = txInfo.receipt || {};
                          const energyFee = (receipt.energy_fee || 0) / 1_000_000;
                          
                          if (totalFee > 0) {
                            // Check if we already have a fee transaction for this hash to avoid duplicates
                            const existingFee = trc20FeeTransactions.find(f => f.relatedTransaction === tx.transaction_id);
                            if (!existingFee) {
                              const feeTransaction = {
                                hash: `${tx.transaction_id}-fee`,
                                from: tx.from,
                                to: 'Network Fee',
                                amount: totalFee,
                                currency: 'TRX',
                                timestamp: tx.block_timestamp || Date.now(),
                                status: 'success',
                                type: 'fee' as const,
                                fee: totalFee,
                                blockchain: 'tron',
                                tokenType: 'native',
                                contractAddress: undefined,
                                relatedTransaction: tx.transaction_id,
                                description: `Fee for ${tokenSymbol} transfer`
                              };
                              
                              trc20FeeTransactions.push(feeTransaction);
                              console.log(`💰 Extracted ${totalFee} TRX fee from ${tokenSymbol} transaction ${tx.transaction_id.substring(0, 10)}...`);
                            }
                          }
                        }
                      }
                    } catch (feeError) {
                      console.warn(`⚠️ Could not fetch fee details for ${tokenSymbol} transaction ${tx.transaction_id}:`, feeError);
                    }
                  }
                }
              }
            } catch (contractError) {
              console.warn(`⚠️ Error fetching TRC-20 transactions for contract ${contractAddress}:`, contractError);
            }
          }
        } catch (trc20Error) {
          console.warn('⚠️ Could not fetch TRC-20 transactions for fee extraction:', trc20Error);
        }
      }
      
      // Combine native TRX transactions with TRC-20 fee transactions
      transactions = [...filteredNativeTransactions, ...trc20FeeTransactions];
      
      // Sort by timestamp (most recent first)
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      
      const feeCount = transactions.filter(tx => tx.type === 'fee').length;
      const transferCount = transactions.length - feeCount;
      
      console.log(`✅ Fetched ${transactions.length} TRX transactions total (${transferCount} transfers, ${feeCount} fees from TRC-20 transactions, includeFees: ${includeFees})`);
      
      // Debug: Show breakdown of transaction types and amounts
      if (process.env.NODE_ENV === 'development') {
        const incomingSum = transactions.filter(tx => tx.type === 'incoming').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const outgoingSum = transactions.filter(tx => tx.type === 'outgoing').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const feeSum = transactions.filter(tx => tx.type === 'fee').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
        console.log(`🔍 TRX Transaction Summary:`, {
          total: transactions.length,
          incoming: { count: transactions.filter(tx => tx.type === 'incoming').length, sum: incomingSum },
          outgoing: { count: transactions.filter(tx => tx.type === 'outgoing').length, sum: outgoingSum },
          fees: { count: transactions.filter(tx => tx.type === 'fee').length, sum: feeSum },
          netBalance: incomingSum - outgoingSum - feeSum
        });
        
        // Sample some fee transactions for debugging
        const sampleFees = transactions.filter(tx => tx.type === 'fee').slice(0, 3);
        if (sampleFees.length > 0) {
          console.log(`🧾 Sample fee transactions:`, sampleFees.map(tx => ({
            hash: tx.hash.substring(0, 10) + '...',
            amount: tx.amount,
            currency: tx.currency,
            description: tx.description
          })));
        }
      }
    } else if (currency) {
      // Fetch specific TRC-20 token transactions using direct API call
      const currencyUpper = currency.toUpperCase();
      console.log(`📝 Fetching TRC-20 transactions for token: ${currencyUpper}`);
      
      // Direct API call to TronGrid (bypassing the service class)
      const contractAddresses: Record<string, string> = {
        'USDT': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        'USDC': 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
      };
      
      const contractAddress = contractAddresses[currencyUpper];
      if (!contractAddress) {
        console.warn(`⚠️ Unknown token symbol: ${currencyUpper}`);
        transactions = [];
      } else {
        try {
          const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`;
          const params = new URLSearchParams({
            contract_address: contractAddress,
            limit: Math.min(parseInt(limit), 200).toString()
          });
          
          if (startDate) {
            params.append('min_timestamp', new Date(startDate).getTime().toString());
          }
          if (endDate) {
            params.append('max_timestamp', new Date(endDate).getTime().toString());
          }
          
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          if (apiKey) {
            headers['TRON-PRO-API-KEY'] = apiKey;
          }
          
          console.log(`🔍 Direct API call: ${url}?${params.toString()}`);
          
          const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`TronGrid API error: ${response.status} ${response.statusText}`);
          }
          
          const responseData = await response.json();
          const rawTransactions = responseData.data || [];
          
          console.log(`📊 Received ${rawTransactions.length} raw transactions from TronGrid`);
          
          // Parse TRC-20 transactions and get their fee information
          const parsedTransactions = [];
          
          for (const tx of rawTransactions) {
            const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
            const tokenInfo = tx.token_info || {};
            const decimals = tokenInfo.decimals || 6;
            const amount = parseFloat(tx.value || '0') / Math.pow(10, decimals);
            
            // Get full transaction details to extract fee information
            let feeAmount = 0;
            try {
              const txDetailUrl = `https://api.trongrid.io/v1/transactions/${tx.transaction_id}`;
              const txDetailHeaders: HeadersInit = {
                'Content-Type': 'application/json',
              };
              if (apiKey) {
                txDetailHeaders['TRON-PRO-API-KEY'] = apiKey;
              }
              
              const txDetailResponse = await fetch(txDetailUrl, {
                method: 'GET',
                headers: txDetailHeaders
              });
              
              if (txDetailResponse.ok) {
                const txDetailData = await txDetailResponse.json();
                const txDetail = txDetailData.data?.[0];
                
                if (txDetail) {
                  // Calculate total fees (energy + network fees)
                  const energyFee = (txDetail.energy_fee || 0) / 1_000_000;
                  const netFee = (txDetail.net_fee || 0) / 1_000_000;
                  feeAmount = energyFee + netFee;
                  
                  console.log(`💰 TRC-20 transaction ${tx.transaction_id.substring(0, 10)}... fee: ${feeAmount} TRX`);
                }
              }
            } catch (feeError) {
              console.warn(`⚠️ Could not fetch fee details for transaction ${tx.transaction_id}:`, feeError);
            }
            
            const tokenTransaction = {
              hash: tx.transaction_id,
              from: tx.from,
              to: tx.to,
              amount: isIncoming ? amount : -amount,
              currency: tokenInfo.symbol || currencyUpper,
              timestamp: tx.block_timestamp || Date.now(),
              status: 'success',
              type: isIncoming ? 'incoming' : 'outgoing',
              fee: feeAmount,
              blockchain: 'tron',
              tokenType: 'trc20',
              contractAddress: tokenInfo.address
            };
            
            parsedTransactions.push(tokenTransaction);
            
            // If this is an outgoing TRC-20 transaction with a fee, also create a fee transaction
            if (!isIncoming && feeAmount > 0) {
              const feeTransaction = {
                hash: `${tx.transaction_id}-fee`,
                from: tx.from,
                to: 'Network Fee',
                amount: feeAmount,
                currency: 'TRX',
                timestamp: tx.block_timestamp || Date.now(),
                status: 'success',
                type: 'fee' as const,
                fee: feeAmount,
                blockchain: 'tron',
                tokenType: 'native',
                contractAddress: undefined,
                // Link to original transaction
                relatedTransaction: tx.transaction_id,
                description: `Fee for ${tokenInfo.symbol || currencyUpper} transfer`
              };
              
              parsedTransactions.push(feeTransaction);
            }
          }
          
          transactions = parsedTransactions;
          
          console.log(`✅ Parsed ${transactions.length} ${currencyUpper} transactions`);
          
        } catch (directApiError) {
          console.error('❌ Direct API call failed:', directApiError);
          throw directApiError;
        }
      }
      
      // Log sample transaction if available for debugging
      if (transactions.length > 0) {
        console.log('📝 Sample transaction:', {
          hash: transactions[0].hash,
          currency: transactions[0].currency,
          amount: transactions[0].amount,
          type: transactions[0].type,
          timestamp: transactions[0].timestamp
        });
      } else {
        console.log('⚠️ No transactions found. Possible reasons:');
        console.log('   1. The wallet has no USDT transactions');
        console.log('   2. The date range is too restrictive');
        console.log('   3. The wallet address might be incorrect');
        console.log('   Debug info:', {
          walletAddress: address,
          dateRange: {
            start: options.startDate?.toISOString(),
            end: options.endDate?.toISOString()
          }
        });
      }
    } else {
      // No specific currency requested - return empty to avoid mixing
      console.log(`⚠️ No specific currency requested for Tron transactions - returning empty array`);
      transactions = [];
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('❌ Server-side Tron transaction fetch error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Tron transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}