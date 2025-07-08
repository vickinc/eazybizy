import { BankAccount, DigitalWallet, PaymentMethod } from '@/types';

export class PaymentMethodService {
  static generatePaymentMethods(
    bankAccounts: BankAccount[],
    digitalWallets: DigitalWallet[]
  ): PaymentMethod[] {
    const methods: PaymentMethod[] = [];

    bankAccounts
      .filter(bank => bank.isActive)
      .forEach(bank => {
        methods.push({
          id: `bank-${bank.id}`,
          type: 'bank',
          name: `${bank.bankName} (${bank.currency})`,
          companyId: bank.companyId,
          accountName: bank.accountName,
          bankName: bank.bankName,
          bankAddress: bank.bankAddress,
          iban: bank.iban,
          swiftCode: bank.swiftCode,
          accountNumber: bank.accountNumber,
          currency: bank.currency,
          details: `${bank.bankName} - ${bank.accountName} (${bank.currency})`
        });
      });

    digitalWallets
      .filter(wallet => wallet.isActive)
      .forEach(wallet => {
        if (wallet.walletType === 'crypto' && wallet.currencies && wallet.currencies.length > 0) {
          wallet.currencies.forEach(currency => {
            methods.push({
              id: `wallet-${wallet.id}-${currency}`,
              type: 'wallet',
              name: `${wallet.walletName} (${currency})`,
              companyId: wallet.companyId,
              walletAddress: wallet.walletAddress,
              currency: currency,
              details: `${wallet.walletType.toUpperCase()} - ${wallet.walletName} (${currency}${wallet.blockchain ? ` - ${wallet.blockchain}` : ''})`
            });
          });
        } else {
          methods.push({
            id: `wallet-${wallet.id}`,
            type: 'wallet',
            name: `${wallet.walletName} (${wallet.currency})`,
            companyId: wallet.companyId,
            walletAddress: wallet.walletAddress,
            currency: wallet.currency,
            details: `${wallet.walletType.toUpperCase()} - ${wallet.walletName} (${wallet.currency})`
          });
        }
      });

    return methods;
  }

  static getFilteredPaymentMethods(
    allPaymentMethods: PaymentMethod[],
    selectedCompanyId: number | ''
  ): PaymentMethod[] {
    if (selectedCompanyId === '') {
      return [];
    }
    return allPaymentMethods.filter(method => method.companyId === selectedCompanyId);
  }
}
