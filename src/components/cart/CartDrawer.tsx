import React, { useState } from 'react';
import { FoodItem, Order, OrderStatus, User } from '../../types';
import { 
  X, Trash2, Plus, Minus, CreditCard, Wallet, 
  CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Tag, Clock
} from 'lucide-react';
import { api } from '../../services/api/apiClient';
import { UpiPaymentModal } from '../payment/UpiPaymentModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { food: FoodItem; quantity: number }[];
  onUpdateQuantity: (foodId: string, delta: number) => void;
  onRemoveItem: (foodId: string) => void;
  onClearCart: () => void;
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
  onWalletUpdated: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onOrderSuccess,
  onWalletUpdated
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'UPI' | 'CASH'>('WALLET');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  if (!isOpen) return null;

  const itemTotal = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  const convenienceFee = 0;
  const totalAmount = Math.max(0, itemTotal - appliedDiscount + convenienceFee);

  const walletBalance = currentUser?.walletBalance ?? 0;
  const isWalletInsufficient = paymentMethod === 'WALLET' && walletBalance < totalAmount;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'WELCOME10' || code === 'CRAVE10') {
      const disc = Math.round(itemTotal * 0.1);
      setAppliedDiscount(disc);
      setPromoMessage(`Promo code ${code} applied! Saved ₹${disc}`);
    } else if (code === 'CAMPUS20') {
      const disc = Math.round(itemTotal * 0.2);
      setAppliedDiscount(disc);
      setPromoMessage(`Campus special applied! Saved ₹${disc}`);
    } else {
      setAppliedDiscount(0);
      setPromoMessage('Invalid promo code. Try CAMPUS20 or WELCOME10.');
    }
  };

  const validateCartBeforePayment = (): boolean => {
    setErrorMessage(null);

    if (!currentUser) {
      setErrorMessage("Authentication required to place order.");
      return false;
    }

    if (cart.length === 0) {
      setErrorMessage("Your cart is empty.");
      return false;
    }

    for (const item of cart) {
      const availStock = item.food.availableQuantity !== undefined 
        ? item.food.availableQuantity 
        : Math.max(0, (item.food.stockQuantity ?? item.food.stock ?? 0) - (item.food.reservedQuantity || 0));

      if (!item.food.isAvailable || availStock <= 0) {
        setErrorMessage(`Cannot place order: "${item.food.name}" is currently out of stock. Please remove it from your cart.`);
        return false;
      }
      if (item.quantity > availStock) {
        setErrorMessage(`Cannot place order: "${item.food.name}" has only ${availStock} in stock, but ${item.quantity} requested. Please reduce quantity.`);
        return false;
      }
    }

    if (paymentMethod === 'WALLET' && walletBalance < totalAmount) {
      setErrorMessage(`Insufficient Wallet Balance. Available: ₹${walletBalance.toFixed(2)}, Required: ₹${totalAmount}. Please top up or choose another payment method.`);
      return false;
    }

    return true;
  };

  const processFinalOrderPlacement = async (
    method: 'WALLET' | 'UPI' | 'CASH',
    transactionId?: string
  ) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const clientReqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const isCash = method === 'CASH';

      const newOrderData = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: currentUser.phoneNumber,
        items: cart.map(i => ({
          foodId: i.food.id,
          quantity: i.quantity,
          name: i.food.name,
          price: i.food.price
        })),
        totalAmount,
        discountApplied: appliedDiscount,
        couponCode: appliedDiscount > 0 ? promoCode.trim().toUpperCase() : undefined,
        status: isCash ? OrderStatus.PENDING_PAYMENT : OrderStatus.ACCEPTED,
        paymentStatus: isCash ? ('PENDING' as const) : ('PAID' as const),
        createdAt: Date.now(),
        estimatedFinishTime: Date.now() + (15 * 60 * 1000),
        pickupLocation: 'Main Campus Kitchen Counter 1',
        paymentMethod: method,
        clientRequestId: clientReqId
      };

      const createdOrder = await api.createOrder(newOrderData as any);

      if (method === 'WALLET') {
        const newBalance = Math.max(0, walletBalance - totalAmount);
        await api.updateUser(currentUser.id, { walletBalance: newBalance });
        onWalletUpdated();
      }

      onClearCart();
      onClose();
      onOrderSuccess(createdOrder);

    } catch (err: any) {
      console.error("Order creation error:", err);
      setErrorMessage(err?.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!validateCartBeforePayment()) return;

    if (paymentMethod === 'UPI') {
      setIsUpiModalOpen(true);
      return;
    }

    await processFinalOrderPlacement(paymentMethod);
  };

  const handleUpiSuccess = async (transactionId: string) => {
    setIsUpiModalOpen(false);
    await processFinalOrderPlacement('UPI', transactionId);
  };

  const handleUpiFailure = (reason: string) => {
    setIsUpiModalOpen(false);
    setErrorMessage(`Payment Failed: ${reason}. No order has been sent to the kitchen. Cart items retained.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0f172a] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                My Cart
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-xs font-black">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Your cart is empty
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Explore today's fresh canteen menu and add delicious food to your order!
                </p>
              </div>
            ) : (
              <>
                {/* Item List */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div 
                      key={item.food.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.food.image}
                          alt={item.food.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {item.food.name}
                          </h4>
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            ₹{item.food.price}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600">
                          <button
                            onClick={() => onUpdateQuantity(item.food.id, -1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs px-2 text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.food.id, 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-200"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.food.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Have a promo code?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code (e.g. CAMPUS20)"
                        className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-[11px] font-semibold ${appliedDiscount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {promoMessage}
                    </p>
                  )}
                </form>

                {/* Payment Method Selector */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    
                    {/* Canteen Wallet Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('WALLET')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === 'WALLET'
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Wallet className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        <span className="text-[11px] font-extrabold">Wallet</span>
                      </div>
                      <span className="text-[10px] font-bold block text-slate-500 dark:text-slate-400">
                        ₹{walletBalance.toFixed(2)}
                      </span>
                    </button>

                    {/* UPI Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === 'UPI'
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[11px] font-extrabold">UPI App</span>
                      </div>
                      <span className="text-[10px] font-bold block text-slate-500 dark:text-slate-400">
                        GPay / PhonePe
                      </span>
                    </button>

                    {/* Cash Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-extrabold">Pay Cash</span>
                      </div>
                      <span className="text-[10px] font-bold block text-slate-500 dark:text-slate-400">
                        At Counter
                      </span>
                    </button>

                  </div>
                </div>

                {/* Price Breakdown Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Item Total</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{itemTotal}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="font-bold">-₹{appliedDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delivery / Convenience Fee</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0 (FREE)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                    <span>Total Payable</span>
                    <span className="text-orange-600 dark:text-orange-400 text-base">₹{totalAmount}</span>
                  </div>
                </div>

              </>
            )}

          </div>

          {/* Footer Proceed to Payment Button */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shrink-0">
              <button
                onClick={handleCheckout}
                disabled={isSubmitting || isWalletInsufficient}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-between transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2 mx-auto">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'CASH' ? 'Place Order & Pay at Counter' : 'Proceed to Payment'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span>₹{totalAmount}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>

      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        totalAmount={totalAmount}
        onPaymentSuccess={handleUpiSuccess}
        onPaymentFailure={handleUpiFailure}
      />
    </div>
  );
};
