import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ChartOfAccountsBusinessService } from '@/services/business/chartOfAccountsBusinessService';
import { authenticateRequest } from '@/lib/api-auth';

export async function POST() {
  const auth = await authenticateRequest();
  if (!auth.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // 1. Check if accounts already exist to prevent duplicates
    const existingCount = await prisma.chartOfAccount.count();
    if (existingCount > 0) {
      return NextResponse.json(
        { message: 'Chart of Accounts has already been initialized.' },
        { status: 409 } // 409 Conflict
      );
    }

    // 2. Get the default accounts from your existing business service
    const defaultAccounts = ChartOfAccountsBusinessService.initializeDefaultAccounts();

    // 3. Use `createMany` for an efficient bulk insert
    await prisma.chartOfAccount.createMany({
      data: defaultAccounts.map(acc => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        vat: acc.vat,
        relatedVendor: acc.relatedVendor,
        accountType: acc.accountType,
        isActive: acc.isActive,
        isSystem: true, // Mark them as system accounts
      })),
    });

    return NextResponse.json({
      message: 'Default Chart of Accounts initialized successfully.',
      count: defaultAccounts.length,
    });
  } catch (error) {
    console.error('Failed to initialize Chart of Accounts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 