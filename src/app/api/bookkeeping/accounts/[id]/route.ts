import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/api-auth';

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await authenticateRequest();
  if (!auth.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const data = await request.json();
    const updatedAccount = await prisma.chartOfAccount.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updatedAccount);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await authenticateRequest();
  if (!auth.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    await prisma.chartOfAccount.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
} 