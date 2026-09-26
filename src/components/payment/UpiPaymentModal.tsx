import React, { useState } from 'react';
import { QrCode, Smartphone, CheckCircle2, XCircle, Loader2, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentFailure: (errorMessage: string) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentSuccess,
  onPaymentFailure
}) => {
  const [selectedApp, setSelectedApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'qr'>('gpay');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldSimulateFailure, setShouldSimulateFailure] = useState(false);
  const [failureReason, setFailureReason] = useState('Bank server timeout or transaction declined by user.');

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (shouldSimulateFailure) {
        onPaymentFailure(failureReason);
      } else {
        const txnId = `UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        onPaymentSuccess(txnId);
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={() => !isProcessing && onClose()}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 space-y-0">
        
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-lg">
              ₹
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-200 block">
                CraveCanteen UPI Checkout
              </span>
              <h2 className="text-2xl font-black tracking-tight">
                ₹{totalAmount.toFixed(2)}
              </h2>
            </div>
          </div>
          <p className="text-xs text-blue-100 font-medium">
            Complete payment using any UPI app or QR scanner.
          </p>
        </div>

        <div className="p-6 space-y-5">

          {isProcessing ? (
            <div className="py-10 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
                <Smartphone className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Awaiting UPI Payment Confirmation...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Please do not refresh or close this window while we verify transaction status with your bank.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Select App Options */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Select Payment App / Method
                </label>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedApp('gpay')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedApp === 'gpay'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                      G
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">Google Pay</span>
                      <span className="text-[10px] text-slate-400 font-normal">Instant UPI</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedApp('phonepe')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedApp === 'phonepe'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-xs shrink-0">
                      Pe
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">PhonePe</span>
                      <span className="text-[10px] text-slate-400 font-normal">Direct Pay</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedApp('paytm')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedApp === 'paytm'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-black text-xs shrink-0">
                      P
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">Paytm UPI</span>
                      <span className="text-[10px] text-slate-400 font-normal">Wallet/Bank</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedApp('qr')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedApp === 'qr'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">Scan QR Code</span>
                      <span className="text-[10px] text-slate-400 font-normal">Show QR</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* QR Code view */}
              {selectedApp === 'qr' ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto border border-slate-200 shadow-sm flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=cravecanteen@upi%26pn=CraveCanteen%26am=${totalAmount}%26cu=INR`}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Scan with GPay, PhonePe, Paytm or BHIM app to complete payment.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    VPA / UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or name@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Simulation Tester Box (Allows testing both success & failure) */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>UPI Sandbox Test Mode</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldSimulateFailure}
                      onChange={(e) => setShouldSimulateFailure(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
                {shouldSimulateFailure && (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    Simulating transaction failure mode (no order will be placed, cart stays intact).
                  </p>
                )}
              </div>

              {/* Confirm Payment Button */}
              <button
                type="button"
                onClick={handlePay}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Pay ₹{totalAmount.toFixed(2)} via UPI</span>
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
