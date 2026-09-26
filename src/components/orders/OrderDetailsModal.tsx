import React from 'react';
import { Order, OrderStatus } from '../../types';
import { X, CheckCircle2, Clock, ChefHat, PackageCheck, AlertCircle, Barcode as BarcodeIcon, RotateCcw } from 'lucide-react';
import BarcodeGenerator from 'react-barcode';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onReorder?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onReorder
}) => {
  if (!order) return null;

  const steps = [
    { title: 'Order Placed', desc: 'Received by system', icon: CheckCircle2 },
    { title: 'Accepted', desc: 'Kitchen acknowledged order', icon: ChefHat },
    { title: 'Preparing', desc: 'Chef is cooking your meal', icon: Clock },
    { title: 'Ready for Pickup', desc: 'Counter pickup slip generated', icon: PackageCheck },
    { title: 'Completed', desc: 'Collected at counter', icon: CheckCircle2 },
  ];

  const getActiveStepIndex = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CART:
      case OrderStatus.PENDING_PAYMENT:
        return 0;
      case OrderStatus.PAID:
      case OrderStatus.ACCEPTED:
        return 1;
      case OrderStatus.PREPARING:
        return 2;
      case OrderStatus.READY:
        return 3;
      case OrderStatus.COMPLETED:
      case OrderStatus.COLLECTED:
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex(order.status);
  const isCancelled = order.status === OrderStatus.CANCELLED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Timeline & Pickup Slip</span>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Order #{order.id}</span>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                order.status === OrderStatus.READY ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse' :
                order.status === OrderStatus.PREPARING ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                order.status === OrderStatus.CANCELLED ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                'bg-slate-100 text-slate-700'
              }`}>
                {order.status}
              </span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Pickup Barcode Slip */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Show this Slip Barcode at Counter 1
            </span>
            <div className="flex justify-center bg-white p-3 rounded-xl shadow-xs">
              <BarcodeGenerator value={order.id} width={1.8} height={45} fontSize={12} margin={0} />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
              Pickup Location: {order.pickupLocation || 'Main Canteen Counter 1'}
            </p>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Order Status Progression
            </h4>

            {isCancelled ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>This order was cancelled. {order.cancellationReason || ''}</span>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                {steps.map((step, idx) => {
                  const isDone = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;
                  return (
                    <div key={idx} className="relative group">
                      <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isDone
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30 ring-4 ring-orange-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className={`text-xs font-bold ${isCurrent ? 'text-orange-600 dark:text-orange-400' : isDone ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {step.title}
                        </h5>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Items Summary Table */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Ordered Items
            </h4>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                <span>{item.quantity}x {item.name}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
              <span>Total Paid ({order.paymentMethod || 'WALLET'})</span>
              <span className="text-orange-600 dark:text-orange-400">₹{order.totalAmount}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        {onReorder && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
            <button
              onClick={() => {
                onClose();
                onReorder(order);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reorder Items</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
