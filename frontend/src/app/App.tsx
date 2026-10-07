import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, FoodItem, Order, OrderStatus } from '@shared/types';
import { CATEGORIES, CATEGORY_SLOTS } from '@shared/constants';

import { api, authenticatedFetch } from '../services/api/apiClient';
import AuthScreen from '../components/auth/AuthScreen';
import Sidebar from '../components/layout/Sidebar';
import FoodCard from '../components/menu/FoodCard';
import StaffPortal from '../components/staff/StaffPortal';
import ChatWidget from '../components/ai/ChatWidget';
import BarcodeGenerator from 'react-barcode';
import { generateSpendingStatementEmail } from '../services/ai/gemini';
import { 
  ShoppingCart, Search, ChevronRight, Zap, ShieldCheck, 
  X, Activity, Sparkles, Loader2, Banknote, Mail, MessageSquare,
  Timer, Smartphone, Ticket as TicketIcon, ShieldAlert, LogOut, Trash2, Minus, Plus, CreditCard as CardIcon, AlertTriangle, Gift, Info, Check, Wallet, Building2, Lock, RefreshCcw, Barcode, Clock, RotateCcw, CheckCircle2, TrendingUp, Calendar, ArrowUpRight, MailCheck, History, Landmark, Coins, User as UserIcon, Phone, FileText, Home, ClipboardList, Menu, UtensilsCrossed, ChevronLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { auth, signOut } from '../services/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<{ food: FoodItem; quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'transactions' | 'profile'>('home');
  const [hubStep, setHubStep] = useState<'time-entry' | 'menu'>('time-entry');
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [orderFilter, setOrderFilter] = useState<'active' | 'past' | 'all' | 'success' | 'pending' | 'cancelled'>('active');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'success' | 'pending' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod'] | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<Order | null>(null);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
  const [viewingToken, setViewingToken] = useState<Order | null>(null);
  const [whatsappToast, setWhatsappToast] = useState<{message: string, target: string, isMock?: boolean} | null>(null);
  const [emailProcessing, setEmailProcessing] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);

  const [voidingOrder, setVoidingOrder] = useState<Order | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');
  const [isVoidProcessing, setIsVoidProcessing] = useState(false);

  const [redeemPoints, setRedeemPoints] = useState(false);
  const pointsDiscountValue = 9; 

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<{name: string, email: string, phoneNumber: string}>({name: '', email: '', phoneNumber: ''});
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('cravecanteen_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.warn("Local user restoration notice:", e);
    }

    const unsubscribe = onAuthStateChanged(
      auth, 
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const user = await api.getUser(firebaseUser.uid);
            if (user) {
              setCurrentUser(user);
              localStorage.setItem('cravecanteen_user', JSON.stringify(user));
            }
          } catch (error) {
            console.warn("Firebase getUser notice:", error);
          }
        }
        setIsAuthReady(true);
      },
      (error) => {
        console.warn("Firebase onAuthStateChanged notice:", error?.message || error);
        setIsAuthReady(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const getRemainingTime = (order: Order) => {
    if (order.status === OrderStatus.PEND_BOOKED) return "15:00";
    if (order.status === OrderStatus.READY || order.status === OrderStatus.COMPLETED) return "00:00";
    if (order.status === OrderStatus.PREPARING) {
      const diff = Math.max(0, order.estimatedFinishTime - currentTime);
      const m = Math.floor(diff / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
    return "00:00";
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setSelectedTime(`${hours}:${minutes}`);
      
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!currentUser || !isAuthReady) return;

    const unsubscribeMenu = api.subscribeToMenu((menu) => {
      setMenuItems(menu);
    });

    const unsubscribeOrders = api.subscribeToOrders(currentUser?.id, currentUser?.role, (history) => {
      setOrders(history);
    });

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, [currentUser, isAuthReady]);

  const handleLogout = async () => {
    setCurrentUser(null);
    setCart([]);
    setHubStep('time-entry');
    setActiveTab('home');
    try {
      localStorage.removeItem('cravecanteen_user');
      await signOut(auth);
    } catch (e) {
      console.warn("Signout error:", e);
    }
  };

  useEffect(() => {
    if (!currentUser || !isAuthReady) return;
    if (currentUser.id === 'STAFF-001') return;
    
    const unsubscribeUser = api.subscribeToUser(currentUser.id, (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem('cravecanteen_user', JSON.stringify(user));
        } catch (e) {
          // ignore
        }
      }
    });

    return () => unsubscribeUser();
  }, [currentUser?.id, isAuthReady]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('cravecanteen_user', JSON.stringify(user));
    } catch (e) {
      console.warn("Local user save error:", e);
    }
  };

  const userStats = useMemo(() => {
    if (!currentUser) return { monthly: 0, yearly: 0, topItems: [] as string[] };
    const userOrders = orders.filter(o => o.userId === currentUser.id && o.status !== OrderStatus.CANCELLED);
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const monthly = userOrders.filter(o => o.createdAt > thirtyDaysAgo).reduce((acc, curr) => acc + curr.totalAmount, 0);
    const yearly = userOrders.filter(o => o.createdAt > oneYearAgo).reduce((acc, curr) => acc + curr.totalAmount, 0);
    const itemCounts: Record<string, number> = {};
    userOrders.forEach(o => o.items.forEach((i: any) => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity; }));

    const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
    return { monthly, yearly, topItems };
  }, [orders, currentUser]);

  const handleEditProfileClick = () => {
    if (currentUser) {
      setEditProfileData({
        name: currentUser.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || ''
      });
      setIsEditingProfile(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsProfileUpdating(true);
    try {
      const updatedUser = await api.updateUser(currentUser.id, editProfileData);
      setCurrentUser(updatedUser);
      setIsEditingProfile(false);
      setWhatsappToast({ message: "Profile updated successfully.", target: "Success" });
      setTimeout(() => setWhatsappToast(null), 3000);
    } catch (err) {
      console.error("Update Profile Error:", err);
      setWhatsappToast({ message: "Failed to update profile.", target: "Error" });
      setTimeout(() => setWhatsappToast(null), 3000);
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handleSendStatement = async () => {
    if (!currentUser || !currentUser.email) {
      setWhatsappToast({ message: "Email required to send statement.", target: "Error" });
      setTimeout(() => setWhatsappToast(null), 3000);
      return;
    }
    setEmailProcessing(true);
    try {
      const response = await authenticatedFetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          name: currentUser.name,
          stats: {
            monthly: userStats.monthly,
            yearly: userStats.yearly,
            topItems: userStats.topItems.map(name => ({ name, count: 1 }))
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setWhatsappToast({ message: "Statement sent to " + currentUser.email, target: currentUser.email });
        if (data.previewUrl) setEmailPreviewUrl(data.previewUrl);
      } else {
        setWhatsappToast({ message: data.error || "Failed to send email", target: "Error" });
      }
    } catch (e) {
      console.error(e);
      setWhatsappToast({ message: "Server connection failed.", target: "Error" });
    } finally {
      setEmailProcessing(false);
      setTimeout(() => setWhatsappToast(null), 4000);
    }
  };

  const handleAddToCart = (food: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.food.id === food.id);
      const currentQty = existing ? existing.quantity : 0;
      const currentStock = food.stock !== undefined ? food.stock : 999;

      if (currentQty + 1 > currentStock) {
        setCartToast(`Sorry! Only ${currentStock} units of ${food.name} left in stock.`);
        setTimeout(() => setCartToast(null), 3000);
        return prev;
      }

      setCartToast(`Added ${food.name} to your cart!`);
      setTimeout(() => setCartToast(null), 2500);

      if (existing) {
        return prev.map(item =>
          item.food.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { food, quantity: 1 }];
    });
  };

  const updateCartQuantity = (foodId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.food.id === foodId) {
          const newQty = item.quantity + delta;
          const currentStock = item.food.stock !== undefined ? item.food.stock : 999;

          if (delta > 0 && newQty > currentStock) {
            setCartToast(`Cannot add more. Only ${currentStock} units in stock.`);
            setTimeout(() => setCartToast(null), 3000);
            return item;
          }

          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as { food: FoodItem; quantity: number }[];
    });
  };

  const rawCartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  }, [cart]);

  const hasPointsDiscount = redeemPoints && (currentUser?.rewardPoints ?? 0) >= 100;
  const cartTotal = useMemo(() => {
    let total = rawCartTotal;
    if (hasPointsDiscount) {
      total = Math.max(0, total - pointsDiscountValue);
    }
    return total;
  }, [rawCartTotal, hasPointsDiscount]);

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setShowPaymentGateway(true);
  };

  const handleFinalCheckout = async () => {
    if (!paymentMethod || !acceptTerms || !currentUser) return;
    setIsCheckoutProcessing(true);
    setAppError(null);

    const outOfStockItems = cart.filter(item => {
      const currentMenuItem = menuItems.find(m => m.id === item.food.id);
      return !currentMenuItem || (currentMenuItem.stock !== undefined && currentMenuItem.stock < item.quantity);
    });

    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map(i => i.food.name).join(', ');
      setAppError(`Stock update: ${names} is no longer available in the requested quantity. Please update your cart.`);
      setIsCheckoutProcessing(false);
      return;
    }

    try {
      const nextIdNum = await api.getNextOrderId();
      const customOrderId = `ORD-${nextIdNum}`;

      const newOrderPayload: any = {
        id: customOrderId,
        userId: currentUser.id,
        userName: currentUser.name,
        items: cart.map(i => ({ foodId: i.food.id, quantity: i.quantity, name: i.food.name, price: i.food.price })),
        totalAmount: cartTotal,
        discountApplied: hasPointsDiscount ? pointsDiscountValue : 0,
        status: OrderStatus.PEND_BOOKED,
        createdAt: Date.now(),
        estimatedFinishTime: Date.now() + (Math.max(...cart.map(i => i.food.estimatedTime ?? i.food.preparationTime ?? 10)) * 60000),
        paymentMethod: paymentMethod,
        refundStatus: 'NONE'
      };

      const createdOrder = await api.createOrder(newOrderPayload);

      if (hasPointsDiscount) {
        const remainingPoints = Math.max(0, (currentUser.rewardPoints ?? 0) - 100);
        const updatedUser = await api.updateUser(currentUser.id, { rewardPoints: remainingPoints });
        setCurrentUser(updatedUser);
      }

      setCart([]);
      setShowPaymentGateway(false);
      setShowSuccessPopup(createdOrder);
      setRedeemPoints(false);

      try {
        const res = await authenticatedFetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: {
              id: createdOrder.id,
              total: createdOrder.totalAmount,
              paymentMethod: createdOrder.paymentMethod,
              timestamp: createdOrder.createdAt,
              items: createdOrder.items
            },
            user: {
              name: currentUser.name,
              email: currentUser.email,
              phoneNumber: currentUser.phoneNumber || '+919876543210'
            }
          })
        });
        const data = await res.json();
        if (data.emailPreviewUrl) setEmailPreviewUrl(data.emailPreviewUrl);
        if (data.message) {
          setWhatsappToast({
            message: data.message,
            target: currentUser.phoneNumber || currentUser.email,
            isMock: data.isMockWhatsApp
          });
        }
      } catch (backendErr) {
        console.warn("Backend Notification Service Warning:", backendErr);
      }

    } catch (err: any) {
      console.error("Checkout Error:", err);
      setAppError(err.message || "Failed to process order. Please try again.");
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, extra?: Partial<Order>) => {
    try {
      await api.updateOrderStatus(orderId, status, extra);
    } catch (err: any) {
      console.error("Status Update Error:", err);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!voidingOrder || !voidReason) return;
    setIsVoidProcessing(true);
    try {
      await api.updateOrderStatus(voidingOrder.id, OrderStatus.CANCELLED, {
        cancellationReason: voidReason,
        refundStatus: 'PENDING'
      });
      setVoidingOrder(null);
      setVoidReason('');
      setWhatsappToast({ message: "Order cancelled. Refund initiated if applicable.", target: "Cancelled" });
      setTimeout(() => setWhatsappToast(null), 3500);
    } catch (e) {
      console.error("Cancel Error:", e);
    } finally {
      setIsVoidProcessing(false);
    }
  };

  const handleToggleFavorite = async (foodId: string) => {
    if (!currentUser) return;
    try {
      const updated = await api.toggleFavorite(currentUser.id, foodId);
      setCurrentUser((prev: User | null) => prev ? { ...prev, favorites: updated } : null);
    } catch (e) {
      console.error("Favorite error:", e);
    }
  };


  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const stockQty = item.stockQuantity ?? item.stock ?? 0;
      const reservedQty = item.reservedQuantity || 0;
      const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
      if (availQty <= 0 || item.isAvailable === false || item.isActive === false) {
        return false;
      }

      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const activeOrdersList = useMemo(() => {
    return orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
  }, [orders]);

  const filteredOrdersList = useMemo(() => {
    if (orderFilter === 'active') return orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    if (orderFilter === 'past') return orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED);
    if (orderFilter === 'success') return orders.filter(o => o.status === OrderStatus.COMPLETED);
    if (orderFilter === 'pending') return orders.filter(o => o.status === OrderStatus.PEND_BOOKED || o.status === OrderStatus.PREPARING || o.status === OrderStatus.READY);
    if (orderFilter === 'cancelled') return orders.filter(o => o.status === OrderStatus.CANCELLED);
    return orders;
  }, [orders, orderFilter]);

  const filteredTransactionsList = useMemo(() => {
    if (transactionFilter === 'success') return orders.filter(o => o.status === OrderStatus.COMPLETED);
    if (transactionFilter === 'pending') return orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
    if (transactionFilter === 'cancelled') return orders.filter(o => o.status === OrderStatus.CANCELLED);
    return orders;
  }, [orders, transactionFilter]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-white font-black italic text-lg tracking-wider">Loading CraveCanteen...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === UserRole.STAFF) {
    return (
      <StaffPortal 
        orders={orders} 
        onUpdateStatus={handleUpdateOrderStatus} 
        menuItems={menuItems}
        onUpdateMenu={(menu) => api.updateMenu(menu)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9fc] flex text-slate-900 font-sans antialiased overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        onOpenCart={() => setIsCartOpen(true)}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 p-4 md:p-6 sticky top-0 z-30 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg md:text-2xl font-black italic tracking-tighter text-slate-900">
                {activeTab === 'home' && 'Student Hub'}
                {activeTab === 'orders' && 'Order Slips'}
                {activeTab === 'transactions' && 'Payment Log'}
                {activeTab === 'profile' && 'Student Account'}
              </h2>
              <p className="text-[9px] md:text-[10px] font-black text-purple-600 uppercase tracking-widest hidden md:block">
                Smart Campus Canteen
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {activeTab === 'home' && (
              <div className="relative w-40 md:w-72">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search food items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 md:pl-11 pr-4 py-2 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 md:p-3 bg-purple-50 text-purple-600 rounded-xl md:rounded-2xl hover:bg-purple-100 transition-all shadow-sm"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
          {activeTab === 'home' && (
            <>
              {hubStep === 'time-entry' && (
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl md:rounded-[3rem] p-6 md:p-12 shadow-2xl relative overflow-hidden text-left">
                  <div className="relative z-10 max-w-xl">
                    <span className="bg-purple-500/30 border border-purple-400/30 text-purple-200 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-4">
                      Skip The Counter Line
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter mb-4 leading-tight">
                      Order Food Ahead.<br/>Collect Freshly Made.
                    </h1>
                    <p className="text-purple-200 text-xs md:text-sm font-medium mb-8 leading-relaxed">
                      Select your arrival time to filter available items. Food preparation starts only after you scan your barcode at the counter!
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <input 
                        type="time" 
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-black italic outline-none focus:border-purple-400 text-center text-lg"
                      />
                      <button 
                        onClick={() => {
                          setHubStep('menu');
                          setTimeout(() => menuRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                        }}
                        className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-purple-50 transition-all flex items-center justify-center uppercase tracking-widest text-xs shadow-xl group"
                      >
                        <span>Browse Menu</span>
                        <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                  <Sparkles className="absolute -bottom-10 -right-10 w-72 h-72 text-white/5 rotate-12" />
                </div>
              )}

              {activeOrdersList.length > 0 && (
                <div className="space-y-4 text-left">
                  <h3 className="text-lg md:text-xl font-black italic tracking-tighter text-slate-900 flex items-center">
                    <Activity className="w-5 h-5 text-purple-600 mr-2 animate-pulse" /> Active Order Tracker
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeOrdersList.map(order => (
                      <div key={order.id} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-lg flex flex-col justify-between relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                              Order #{order.id.split('-')[1]}
                            </span>
                            <h4 className="font-black text-slate-900 italic text-base mt-2">
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </h4>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                            order.status === OrderStatus.READY ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                            order.status === OrderStatus.PREPARING ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-black text-slate-700">{getRemainingTime(order)}</span>
                          </div>
                          <button 
                            onClick={() => setViewingToken(order)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-colors flex items-center"
                          >
                            <Barcode className="w-3.5 h-3.5 mr-1.5" /> Show Barcode
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={menuRef} className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl md:text-3xl font-black italic tracking-tighter text-slate-900">Explore Canteen Menu</h3>
                    <p className="text-xs font-bold text-slate-400">Freshly prepared meals ready for campus pickup</p>
                  </div>
                  {hubStep === 'menu' && (
                    <button 
                      onClick={() => setHubStep('time-entry')}
                      className="text-xs font-black text-purple-600 hover:underline flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Change Arrival Time ({selectedTime})
                    </button>
                  )}
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        selectedCategory === category 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {filteredMenuItems.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-slate-100">
                    <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-black italic text-sm">No food items found matching your filter</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredMenuItems.map(item => {
                      const cartItem = cart.find(c => c.food.id === item.id);
                      return (
                        <FoodCard 
                          key={item.id}
                          item={item}
                          quantity={cartItem?.quantity || 0}
                          onAdd={() => handleAddToCart(item)}
                          onUpdateQuantity={(delta) => updateCartQuantity(item.id, delta)}
                          isFavorite={currentUser?.favorites?.includes(item.id)}
                          onToggleFavorite={() => handleToggleFavorite(item.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl md:text-3xl font-black italic tracking-tighter text-slate-900">Your Order Slips</h3>
                <div className="flex space-x-2">
                  {(['active', 'past', 'all'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setOrderFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        orderFilter === filter ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrdersList.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-100">
                  <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-black italic text-sm">No orders found in this view</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {filteredOrdersList.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs font-black text-purple-600 italic">Order #{order.id.split('-')[1]}</span>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                            order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                            order.status === OrderStatus.CANCELLED ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-6 border-t border-b border-slate-50 py-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-slate-500">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                          <p className="text-lg font-black text-slate-900">₹{order.totalAmount}</p>
                        </div>
                        <div className="flex space-x-2">
                          {order.status === OrderStatus.PEND_BOOKED && (
                            <button
                              onClick={() => setVoidingOrder(order)}
                              className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => setViewingToken(order)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-colors flex items-center"
                          >
                            <Barcode className="w-3.5 h-3.5 mr-1" /> Barcode
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl md:text-3xl font-black italic tracking-tighter text-slate-900">Payment Log</h3>
                <button
                  onClick={handleSendStatement}
                  disabled={emailProcessing}
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-colors flex items-center self-start sm:self-auto"
                >
                  {emailProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Email Monthly Report
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactionsList.map(order => (
                      <tr key={order.id} className="border-b border-slate-50 text-xs font-bold hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-black text-purple-600">#{order.id.split('-')[1]}</td>
                        <td className="py-4 px-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">{order.paymentMethod || 'CARD/UPI'}</td>
                        <td className="py-4 px-4">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            order.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                            order.status === OrderStatus.CANCELLED ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900">₹{order.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6 text-left">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg text-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center text-purple-600 font-black italic text-3xl shadow-inner border-4 border-white">
                  {currentUser.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black italic text-slate-900">{currentUser.name}</h3>
                <p className="text-xs font-bold text-slate-400 mb-6">{currentUser.email}</p>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Reward Points</p>
                    <p className="text-2xl font-black text-purple-900">{currentUser.rewardPoints || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Orders</p>
                    <p className="text-2xl font-black text-slate-900">{orders.length}</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleEditProfileClick}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[500] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-left animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black italic tracking-tighter text-slate-900 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-purple-600" /> Your Order Cart
              </h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-black italic text-sm">Your cart is currently empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.food.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex-1 pr-4">
                      <h4 className="font-black text-slate-900 italic text-sm">{item.food.name}</h4>
                      <p className="text-xs font-bold text-slate-400">₹{item.food.price} each</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-white p-1 rounded-xl border border-slate-200">
                      <button onClick={() => updateCartQuantity(item.food.id, -1)} className="p-1 hover:bg-slate-100 rounded-lg">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-xs min-w-[1.2rem] text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.food.id, 1)} className="p-1 hover:bg-slate-100 rounded-lg">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="flex justify-between items-center text-sm font-black">
                  <span className="text-slate-500 uppercase tracking-widest text-[10px]">Total Amount</span>
                  <span className="text-2xl text-slate-900 italic">₹{cartTotal}</span>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowPaymentGateway(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl text-left border border-slate-100">
            <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 mb-6">Select Payment Method</h3>
            
            <div className="space-y-3 mb-6">
              {(['GPAY', 'PAYTM', 'PHONEPE', 'CARD', 'CASH'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between font-black text-xs uppercase tracking-widest transition-all ${
                    paymentMethod === method ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{method}</span>
                  {paymentMethod === method && <Check className="w-4 h-4 text-purple-600" />}
                </button>
              ))}
            </div>

            <label className="flex items-center space-x-3 mb-6 cursor-pointer">
              <input 
                type="checkbox" 
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300" 
              />
              <span className="text-[10px] font-bold text-slate-500">I confirm my food order details and pickup arrival time</span>
            </label>

            {appError && (
              <p className="text-rose-600 text-xs font-bold mb-4">{appError}</p>
            )}

            <button
              disabled={!paymentMethod || !acceptTerms || isCheckoutProcessing}
              onClick={handleFinalCheckout}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {isCheckoutProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${cartTotal} & Place Order`}
            </button>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {viewingToken && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setViewingToken(null)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center border border-slate-100">
            <button onClick={() => setViewingToken(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black italic text-slate-900 mb-1">Preparation Barcode</h3>
            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-6">Scan at counter to begin cooking</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 flex justify-center">
              <BarcodeGenerator value={viewingToken.id} width={1.8} height={80} fontSize={12} />
            </div>

            <p className="text-xs font-bold text-slate-500">Order #{viewingToken.id.split('-')[1]}</p>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {whatsappToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black tracking-wide">{whatsappToast.message}</span>
        </div>
      )}

      {/* Cart Toast */}
      {cartToast && (
        <div className="fixed top-20 right-6 z-[1000] bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-black animate-in fade-in slide-in-from-top-2">
          <span>{cartToast}</span>
        </div>
      )}

      <ChatWidget menu={menuItems} userName={currentUser.name} orders={orders} />
    </div>
  );
};

export default App;
