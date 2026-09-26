import React from 'react';
import { Order, OrderStatus } from '../../types';
import { CheckCircle2, Clock, MapPin, Receipt, ArrowRight, Home, AlertTriangle, Wallet } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
  onGoHome: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onTrackOrder,
  onGoHome
}) => {
  if (!order) return null;

  const isCashPending = order.paymentStatus === 'PENDING' || order.status === OrderStatus.PENDING_PAYMENT;

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative text-center space-y-5">
        
        {isCashPending ? (
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xl ring-8 ring-amber-50 dark:ring-amber-950/30">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        )}

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isCashPending ? 'Order Placed — Pay at Counter' : 'Order Confirmed 🎉'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            {isCashPending 
              ? `Please pay ₹${order.totalAmount} cash at the canteen POS counter. Your order will be sent to the kitchen ONLY AFTER payment confirmation.`
              : 'Your payment was successful and your order has been sent to the kitchen preparing list!'
            }
          </p>
        </div>

        {/* Order Details Receipt Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-left space-y-3">
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-200/80 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order ID</span>
              <span className="text-sm font-black text-orange-600 dark:text-orange-400">#{order.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date & Time</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formattedDate}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-1.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ordered Items</span>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-bold">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Payment Method</span>
              <span className="font-extrabold text-slate-900 dark:text-white uppercase">
                {order.paymentMethod === 'CASH' ? 'Cash at Counter' : order.paymentMethod || 'WALLET'}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Payment Status</span>
              {isCashPending ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-500/30">
                  ⏳ AWAITING COUNTER CASH PAYMENT
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black border border-emerald-500/30">
                  ✓ PAID & CONFIRMED
                </span>
              )}
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="font-black text-slate-900 dark:text-white">Total Amount</span>
              <span className="text-base font-black text-orange-600 dark:text-orange-400">₹{order.totalAmount}</span>
            </div>
          </div>

        </div>

        {isCashPending && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold text-left flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Important Kitchen Rule:</strong> The kitchen will NOT start preparing your order until you present order <strong>#{order.id}</strong> at the POS counter and pay ₹{order.totalAmount}.
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              onGoHome();
            }}
            className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onTrackOrder(order.id);
            }}
            className="py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Track Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

