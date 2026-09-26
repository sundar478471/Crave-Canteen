export interface CouponOffer {
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  perUserLimit?: number;
  expiryTimestamp: number;
  isActive: boolean;
}
