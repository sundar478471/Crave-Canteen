export type WalletTransactionType = 'TOPUP' | 'PAYMENT' | 'REFUND' | 'REWARD_REDEMPTION';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: WalletTransactionType;
  description: string;
  timestamp: number;
  orderId?: string;
  balanceAfter: number;
}

export interface UserWallet {
  userId: string;
  balance: number;
  rewardPoints: number;
  transactions: WalletTransaction[];
}
