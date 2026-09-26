import React, { useState } from 'react';
import { FoodItem, Order, OrderStatus, User } from '../../types';
import { 
  ShoppingBag, Trash2, Plus, Minus, CreditCard, Wallet, 
  CheckCircle2, AlertCircle, Loader2, ArrowRight, Tag, Utensils, ShieldCheck, ArrowLeft, Clock
} from 'lucide-react';
import { api } from '../../services/api/apiClient';
import { UpiPaymentModal } from '../payment/UpiPaymentModal';

interface CartViewProps {
  cart: { food: FoodItem; quantity: number }[];
  onUpdateQuantity: (foodId: string, delta: number) => void;
  onRemoveItem: (foodId: string) => void;
  onClearCart: () => void;
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
  onWalletUpdated: () => void;
  onNavigateToMenu: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onOrderSuccess,
  onWalletUpdated,
  onNavigateToMenu
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'UPI' | 'CASH'>('WALLET');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  const itemTotal = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  const convenienceFee = 0;
  const totalAmount = Math.max(0, itemTotal - appliedDiscount + convenienceFee);

  const walletBalance = currentUser?.walletBalance ?? 0;
  const isWalletInsufficient = paymentMethod === 'WALLET' && walletBalance < totalAmount;
  const isFaculty = currentUser?.role === 'FACULTY';

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

    // Check stock for all items
    for (const item of cart) {
      const availStock = item.food.availableQuantity !== undefined
        ? item.food.availableQuantity
        : Math.max(0, (item.food.stockQuantity ?? item.food.stock ?? 0) - (item.food.reservedQuantity || 0));

      if (!item.food.isAvailable || availStock <= 0) {
        setErrorMessage(`Cannot place order: "${item.food.name}" is currently out of stock. Please remove it from your cart.`);
        return false;
      }
      if (item.quantity > availStock) {
        setErrorMessage(`Cannot place order: "${item.food.name}" has only ${availStock} available in stock, but ${item.quantity} requested. Please reduce quantity.`);
        return false;
      }
    }

    if (paymentMethod === 'WALLET' && walletBalance < totalAmount) {
      setErrorMessage(`Insufficient Wallet Balance. Available: ₹${walletBalance.toFixed(2)}, Required: ₹${totalAmount}. Please top up wallet or choose another payment method.`);
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
        pickupLocation: isFaculty ? 'Faculty Lounge Express Counter' : 'Main Campus Kitchen Counter 1',
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
    setErrorMessage(`Payment Failed: ${reason}. No order has been sent to the kitchen. Your cart items remain intact.`);
  };

  const totalItemCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                My Shopping Cart
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/30">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review your food items, select payment method & submit order directly to the kitchen counter.
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all border border-rose-500/20 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {cart.length === 0 ? (
        /* Empty Cart State */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30 shadow-inner">
            <Utensils className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Your Cart is Currently Empty
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Looks like you haven't added any items to your cart yet. Explore today's fresh canteen menu!
            </p>
          </div>
          <button
            onClick={onNavigateToMenu}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Explore Menu & Add Items</span>
          </button>
        </div>
      ) : (
        /* Active Cart Main Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Cart Items List (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Selected Food Items</span>
                  <span className="text-slate-400 text-xs font-normal">({cart.length} unique)</span>
                </h3>
                <button
                  onClick={onNavigateToMenu}
                  className="text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More Items</span>
                </button>
              </div>

              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.food.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={item.food.image}
                        alt={item.food.name}
                        className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200/50 dark:border-slate-700/50 shadow-xs"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 dark:text-orange-400 block">
                          {item.food.category}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {item.food.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            ₹{item.food.price}
                          </span>
                          <span className="text-[11px] text-slate-400">each</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-700/50 pt-3 sm:pt-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-white dark:bg-slate-700 rounded-xl p-1 border border-slate-200 dark:border-slate-600 shadow-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.food.id, -1)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 active:scale-95 transition-all"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs text-slate-900 dark:text-white px-3 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.food.id, 1)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 active:scale-95 transition-all"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-black text-orange-600 dark:text-orange-400 block">
                          ₹{item.food.price * item.quantity}
                        </span>
                      </div>

                      {/* Remove item */}
                      <button
                        onClick={() => onRemoveItem(item.food.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                        title="Remove item from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kitchen Pickup Notice */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <span className="font-extrabold block">Real-time Kitchen Dispatch</span>
                <span>Orders are sent live to Kitchen KDS. Pickup location: <strong className="text-slate-900 dark:text-white">{isFaculty ? 'Faculty Lounge Express Counter' : 'Main Campus Kitchen Counter 1'}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout & Payment Summary (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            
            {/* Promo Code Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                Apply Promo / Discount Code
              </label>
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. CAMPUS20"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-[11px] font-bold ${appliedDiscount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {promoMessage}
                  </p>
                )}
              </form>
            </div>

            {/* Payment Method Selector */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                Choose Payment Method
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Wallet Button */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'WALLET'
                      ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wallet className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-extrabold">Wallet</span>
                  </div>
                  <span className="text-[10px] font-bold block text-slate-500 dark:text-slate-400">
                    ₹{walletBalance.toFixed(2)}
                  </span>
                </button>

                {/* UPI Button */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-extrabold">UPI App</span>
                  </div>
                  <span className="text-[10px] font-bold block text-slate-500 dark:text-slate-400">
                    GPay / PhonePe
                  </span>
                </button>

                {/* Cash at Counter */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-extrabold">Pay Cash</span>
                  </div>
                  <span className="text-[10px] font-bold block text-slate-500 dark:text-slate-400">
                    At Counter
                  </span>
                </button>
              </div>

              {isWalletInsufficient && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                  ⚠️ Your wallet balance (₹{walletBalance.toFixed(2)}) is lower than order total (₹{totalAmount}). Top up or choose another payment method.
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-medium">
                  ℹ️ Order status will be <strong>Awaiting Counter Cash Payment</strong>. Food enters the kitchen list only after you pay cash at the POS counter!
                </div>
              )}
            </div>

            {/* Price Summary Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Order Bill Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Items Total ({totalItemCount} items)</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{itemTotal}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount Coupon</span>
                    <span className="font-bold">-₹{appliedDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Kitchen Packaging & Convenience</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0 (FREE)</span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      Total Payable Amount
                    </span>
                    <span className="text-[10px] text-slate-400">Inclusive of all taxes</span>
                  </div>
                  <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>

              {/* Submit Order Button */}
              <button
                onClick={handleCheckout}
                disabled={isSubmitting || isWalletInsufficient}
                className="w-full mt-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-between transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2 mx-auto">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'CASH' ? 'Place Order & Pay at Counter' : 'Pay & Submit Order'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>₹{totalAmount}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* UPI Interactive Payment Modal */}
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
