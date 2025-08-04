"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import { useRouter } from "next/navigation";

interface PaymentMethodsNoticeProps {
  className?: string;
}

export function PaymentMethodsNotice({ className = "" }: PaymentMethodsNoticeProps) {
  const router = useRouter();

  const handleNavigateToBanksWallets = () => {
    router.push('/accounting/banks-wallets');
  };

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="bg-amber-100 p-2 rounded-full">
          <Banknote className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-amber-800 font-semibold">Setup Payment Methods Required</h3>
          <p className="text-amber-700 text-sm">Before creating manual cash flow entries, add bank accounts or digital wallets to display payment options.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNavigateToBanksWallets}
          className="border-amber-300 text-amber-800 hover:bg-amber-100"
        >
          Go to Banks & Wallets
        </Button>
      </div>
    </div>
  );
}