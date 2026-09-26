import React, { useState } from 'react';
import { 
  HelpCircle, AlertTriangle, Phone, MessageSquare, 
  ChevronDown, ChevronUp, CheckCircle2, Loader2, Star, Mail, MapPin, Clock
} from 'lucide-react';

export const SupportForms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'report' | 'contact' | 'feedback'>('faqs');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Issue Report State
  const [reportCategory, setReportCategory] = useState('Order Delay');
  const [reportOrderId, setReportOrderId] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // User Tickets State
  const [userTickets, setUserTickets] = useState<Array<{
    id: string;
    category: string;
    orderId?: string;
    message: string;
    createdAt: number;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  }>>([
    {
      id: 'TKT-3912',
      category: 'Payment / Wallet Deduction Error',
      orderId: '#CC202509250012',
      message: 'Wallet balance deducted twice for single order.',
      createdAt: Date.now() - 3600000 * 12,
      status: 'IN_PROGRESS'
    }
  ]);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const faqs = [
    {
      q: "How do I check the live status of my food order?",
      a: "Navigate to the 'My Orders' section in the sidebar. You can view real-time status updates (Preparing, Ready for Pickup, Completed) along with estimated finish time."
    },
    {
      q: "How do I add money to my CraveCanteen Wallet?",
      a: "Go to 'Wallet & Payments' tab and click on 'Add Money'. Choose quick amounts (₹100, ₹200, ₹500, ₹1000) or enter a custom amount to top up using UPI/Cards."
    },
    {
      q: "What should I do if an item in my cart becomes sold out?",
      a: "The system automatically revalidates menu availability before checkout. If an item becomes unavailable, remove it from your cart to proceed with remaining items."
    },
    {
      q: "How do pickup barcode slips work at the counter?",
      a: "Once your order is ready, open your order details slip in 'My Orders' and show the digital barcode to the canteen counter staff for quick verification and pickup."
    }
  ];

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(null);
    setReportLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const ticketId = "TKT-" + Math.floor(1000 + Math.random() * 9000);
    const newTicket = {
      id: ticketId,
      category: reportCategory,
      orderId: reportOrderId ? reportOrderId.trim() : undefined,
      message: reportMessage.trim(),
      createdAt: Date.now(),
      status: 'OPEN' as const
    };
    setUserTickets(prev => [newTicket, ...prev]);
    setReportSuccess(`Issue report submitted successfully! Ticket #${ticketId} opened.`);
    setReportMessage('');
    setReportOrderId('');
    setReportLoading(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSuccess(null);
    setFeedbackLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setFeedbackSuccess("Thank you for your valuable feedback! We strive to make your dining experience brighter.");
    setFeedbackMessage('');
    setFeedbackLoading(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-Tab Selector Header */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'faqs'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 inline mr-1.5" />
          FAQs
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'report'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Report an Issue
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'contact'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Phone className="w-3.5 h-3.5 inline mr-1.5" />
          Contact Canteen
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'feedback'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
          Feedback
        </button>
      </div>

      {/* 1. FAQs SECTION */}
      {activeTab === 'faqs' && (
        <div className="space-y-3 max-w-3xl">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Frequently Asked Questions
          </h3>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex justify-between items-center font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-orange-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. REPORT AN ISSUE SECTION */}
      {activeTab === 'report' && (
        <div className="max-w-xl space-y-6">
          <div className="bg-white dark:bg-[#131b2e] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Report an Issue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Let us know if you faced any trouble with an order or payment.
            </p>
          </div>

          {reportSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{reportSuccess}</span>
            </div>
          )}

          <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Issue Category
              </label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="Order Delay">Order Delay</option>
                <option value="Incorrect Item Received">Incorrect Item Received</option>
                <option value="Payment / Wallet Deduction Error">Payment / Wallet Deduction Error</option>
                <option value="Food Quality / Temperature Issue">Food Quality / Temperature Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Order ID (Optional)
              </label>
              <input
                type="text"
                value={reportOrderId}
                onChange={(e) => setReportOrderId(e.target.value)}
                placeholder="e.g. #CC202509250001"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Detailed Description
              </label>
              <textarea
                required
                rows={4}
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Describe what happened so our team can resolve it quickly..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={reportLoading}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
            >
              {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Support Ticket"}
            </button>
          </form>
        </div>

        {/* MY SUPPORT TICKETS LIST */}
        <div className="bg-white dark:bg-[#131b2e] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                My Support Tickets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track the progress of your submitted support tickets.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold">
              {userTickets.length} {userTickets.length === 1 ? 'Ticket' : 'Tickets'}
            </span>
          </div>

          <div className="space-y-3">
            {userTickets.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-900 dark:text-white">{t.id}</span>
                    {t.orderId && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                        {t.orderId}
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    t.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {t.status === 'IN_PROGRESS' ? 'IN PROGRESS' : t.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.category}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.message}
                </p>
                <div className="text-[10px] font-medium text-slate-400 pt-1">
                  Submitted: {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* 3. CONTACT CANTEEN SECTION */}
      {activeTab === 'contact' && (
        <div className="max-w-xl space-y-4">
          <div className="bg-white dark:bg-[#131b2e] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Official Campus Canteen Contacts
            </h3>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Helpline Phone</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">+91 98765 43210</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Support Email</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">canteen-support@campus.edu</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Operating Hours</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">Monday – Saturday: 7:30 AM – 9:30 PM</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <MapPin className="w-5 h-5 text-purple-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">Main Dining Block, Ground Floor, Central Campus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FEEDBACK SECTION */}
      {activeTab === 'feedback' && (
        <div className="max-w-xl bg-white dark:bg-[#131b2e] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Give Feedback
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Help us improve food quality, hygiene and pickup efficiency.
            </p>
          </div>

          {feedbackSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                Overall Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1.5 transition-transform hover:scale-110"
                  >
                    <Star className={`w-6 h-6 ${star <= feedbackRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Your Comments & Suggestions
              </label>
              <textarea
                required
                rows={4}
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Tell us what you loved or how we can serve you better..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={feedbackLoading}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
            >
              {feedbackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Feedback"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
