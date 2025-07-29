import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// POST /api/transactions/import - Import transactions from CSV/Excel file
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!companyId || isNaN(parseInt(companyId))) {
      return NextResponse.json(
        { error: 'Valid company ID is required' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    // Define expected columns (flexible mapping)
    const columnMap = {
      date: ['date', 'transaction_date', 'Date'],
      paidBy: ['paid_by', 'paidBy', 'from', 'Paid By'],
      paidTo: ['paid_to', 'paidTo', 'to', 'Paid To'],
      netAmount: ['net_amount', 'netAmount', 'amount', 'Net Amount'],
      incomingAmount: ['incoming_amount', 'incomingAmount', 'credit', 'Incoming Amount'],
      outgoingAmount: ['outgoing_amount', 'outgoingAmount', 'debit', 'Outgoing Amount'],
      currency: ['currency', 'Currency'],
      baseCurrency: ['base_currency', 'baseCurrency', 'Base Currency'],
      baseCurrencyAmount: ['base_currency_amount', 'baseCurrencyAmount', 'Base Currency Amount'],
      exchangeRate: ['exchange_rate', 'exchangeRate', 'Exchange Rate'],
      accountId: ['account_id', 'accountId', 'Account ID'],
      accountType: ['account_type', 'accountType', 'Account Type'],
      reference: ['reference', 'Reference'],
      category: ['category', 'Category'],
      description: ['description', 'Description'],
      status: ['status', 'Status'],
      reconciliationStatus: ['reconciliation_status', 'reconciliationStatus', 'Reconciliation Status'],
      approvalStatus: ['approval_status', 'approvalStatus', 'Approval Status']
    };

    // Find column indices
    const columnIndices: { [key: string]: number } = {};
    Object.entries(columnMap).forEach(([field, possibleNames]) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
        if (index !== -1) {
          columnIndices[field] = index;
          break;
        }
      }
    });

    // Validate required columns
    const requiredFields = ['date', 'paidBy', 'paidTo', 'netAmount', 'currency', 'accountId', 'accountType', 'category'];
    const missingFields = requiredFields.filter(field => columnIndices[field] === undefined);

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required columns',
        missingFields,
        availableColumns: headers,
        requiredColumns: requiredFields
      }, { status: 400 });
    }

    // Parse transactions
    const transactions: any[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    dataRows.forEach((row, index) => {
      const rowIndex = index + 2; // +2 because we skip header and arrays are 0-indexed
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));

      try {
        // Extract values using column mapping
        const transaction = {
          date: new Date(values[columnIndices.date]),
          paidBy: values[columnIndices.paidBy],
          paidTo: values[columnIndices.paidTo],
          netAmount: parseFloat(values[columnIndices.netAmount]) || 0,
          incomingAmount: columnIndices.incomingAmount !== undefined ? 
            parseFloat(values[columnIndices.incomingAmount]) || 0 : 0,
          outgoingAmount: columnIndices.outgoingAmount !== undefined ? 
            parseFloat(values[columnIndices.outgoingAmount]) || 0 : 0,
          currency: values[columnIndices.currency],
          baseCurrency: columnIndices.baseCurrency !== undefined ? 
            values[columnIndices.baseCurrency] : values[columnIndices.currency],
          baseCurrencyAmount: columnIndices.baseCurrencyAmount !== undefined ? 
            parseFloat(values[columnIndices.baseCurrencyAmount]) || 0 : parseFloat(values[columnIndices.netAmount]) || 0,
          exchangeRate: columnIndices.exchangeRate !== undefined ? 
            parseFloat(values[columnIndices.exchangeRate]) || 1 : 1,
          accountId: values[columnIndices.accountId],
          accountType: values[columnIndices.accountType],
          reference: columnIndices.reference !== undefined ? values[columnIndices.reference] : null,
          category: values[columnIndices.category],
          description: columnIndices.description !== undefined ? values[columnIndices.description] : null,
          status: columnIndices.status !== undefined ? 
            values[columnIndices.status].toUpperCase() : 'PENDING',
          reconciliationStatus: columnIndices.reconciliationStatus !== undefined ? 
            values[columnIndices.reconciliationStatus].toUpperCase() : 'UNRECONCILED',
          approvalStatus: columnIndices.approvalStatus !== undefined ? 
            values[columnIndices.approvalStatus].toUpperCase() : 'PENDING',
          companyId: parseInt(companyId),
          isDeleted: false,
        };

        // Validate required fields
        if (!transaction.date || isNaN(transaction.date.getTime())) {
          errors.push({ row: rowIndex, error: 'Invalid date format' });
          return;
        }

        if (!transaction.paidBy || !transaction.paidTo) {
          errors.push({ row: rowIndex, error: 'Missing paidBy or paidTo' });
          return;
        }

        if (!transaction.currency || !transaction.accountId || !transaction.category) {
          errors.push({ row: rowIndex, error: 'Missing required fields' });
          return;
        }

        if (!['bank', 'wallet'].includes(transaction.accountType)) {
          errors.push({ row: rowIndex, error: 'Invalid accountType. Must be "bank" or "wallet"' });
          return;
        }

        transactions.push(transaction);

      } catch (error) {
        errors.push({ row: rowIndex, error: `Parse error: ${error.message}` });
      }
    });

    // If there are parsing errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Failed to parse some rows',
        errors: errors.slice(0, 10), // Limit to first 10 errors
        totalErrors: errors.length,
        successfulRows: transactions.length
      }, { status: 400 });
    }

    // Insert transactions into database
    let successCount = 0;
    const insertErrors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < transactions.length; i++) {
      try {
        await prisma.transaction.create({
          data: transactions[i]
        });
        successCount++;
      } catch (error) {
        insertErrors.push({ 
          row: i + 2, 
          error: error.message || 'Database insert failed' 
        });
      }
    }

    return NextResponse.json({
      success: successCount,
      errors: insertErrors,
      message: `Successfully imported ${successCount} transactions`
    });

  } catch (error) {
    console.error('POST /api/transactions/import error:', error);
    return NextResponse.json(
      { error: 'Failed to import transactions' },
      { status: 500 }
    );
  }
}