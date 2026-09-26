export const OrderStatus = {
  CART: 'Cart',
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  PEND_BOOKED: 'Booked',
  BOOKED: 'Booked',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Collected',
  COLLECTED: 'Collected',
  PAYMENT_FAILED: 'Payment Failed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  REFUND_PENDING: 'Refund Pending',
  REFUNDED: 'Refunded'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus] | string;

export type PaymentMethod = 'GPAY' | 'PAYTM' | 'PHONEPE' | 'AMAZONPAY' | 'CARD' | 'NB' | 'CASH' | 'WALLET';

export interface OrderItem {
  foodId: string;
  quantity: number;
  name: string;
  price: number;
  status?: 'PENDING' | 'PREPARING' | 'READY';
  customization?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  vendorId?: string;
  items: OrderItem[];
  totalAmount: number;
  discountApplied?: number;
  pointsRedeemed?: number;
  couponCode?: string;
  status: OrderStatus;
  createdAt: number;
  checkInTime?: number; 
  estimatedFinishTime: number;
  pickupTimeSlot?: string;
  pickupLocation?: string;
  paymentMethod?: PaymentMethod;
  cancellationReason?: string;
  refundStatus?: 'NONE' | 'PENDING' | 'PROCESSED';
  qrCodeUrl?: string;
  qrToken?: string;
  receiptUrl?: string;
}
