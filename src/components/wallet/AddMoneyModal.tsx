import React, { useState } from 'react';
import { User, WalletTransaction } from '../../types';
import { X, Wallet, CheckCircle2, AlertCircle, Loader2, Smartphone, Building2, CreditCard } from 'lucide-react';
import { api } from '../../services/api/apiClient';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: (newBalance: number) => void;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number>(200);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentSource, setPaymentSource] = useState<'UPI' | 'NETBANKING' | 'CARD'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickAmounts = [100, 200, 500, 1000];

  const handleSelectQuick = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError("User session expired.");
      return;
    }

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (isNaN(finalAmount) || finalAmount < 10) {
      setError("Please enter a valid amount (minimum ₹10).");
      return;
    }

    setIsProcessing(true);

    try {
      const currentBal = currentUser.walletBalance ?? 0;
      const newBal = currentBal + finalAmount;

      const newTx: WalletTransaction = {
        id: `TXN-${Date.now()}`,
        type: 'TOP_UP',
        amount: finalAmount,
        date: Date.now(),
        reference: `UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        status: 'SUCCESS',
        description: `Bank UPI Top-Up (${paymentSource})`
      };

      const existingTxns = currentUser.transactions || [];
      const updatedTxns = [newTx, ...existingTxns];

      await api.updateUser(currentUser.id, {
        walletBalance: newBal,
        transactions: updatedTxns
      });

      onSuccess(newBal);
      onClose();

    } catch (err: any) {
      setError(err?.message || "Failed to add money from Bank via UPI.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-5">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Add Money to Wallet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Current Balance: <span className="font-extrabold text-orange-600 dark:text-orange-400">₹{(currentUser?.walletBalance ?? 0).toFixed(2)}</span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAddMoney} className="space-y-4">
          
          {/* Quick Amount Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Top-Up Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectQuick(val)}
                  className={`py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                    amount === val && !customAmount
                      ? 'border-orange-500 bg-orange-600 text-white shadow-md shadow-orange-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/40'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Or Enter Amount (₹)
            </label>
            <input
              type="number"
              min="10"
              max="10000"
              value={customAmount}
              onChange={handleCustomChange}
              placeholder="e.g. 250"
              className="w-full px-4 py-3 text-sm font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Bank / Payment Source Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Payment Method (Bank Direct)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentSource('UPI')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition-all cursor-pointer ${
                  paymentSource === 'UPI'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Smartphone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>UPI (GPay / PhonePe)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentSource('NETBANKING')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition-all cursor-pointer ${
                  paymentSource === 'NETBANKING'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentSource('CARD')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition-all cursor-pointer ${
                  paymentSource === 'CARD'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Debit Card</span>
              </button>
            </div>
          </div>

          {/* Proceed Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Add ₹{customAmount ? customAmount : amount} from Bank via {paymentSource}</span>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
