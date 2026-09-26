import React, { useState, useMemo } from 'react';
import { User, FoodItem, Order, OrderStatus, AppNotification } from '../../types';
import Sidebar, { NavTab } from '../layout/Sidebar';
import { Header } from '../layout/Header';
import { BottomNav } from '../layout/BottomNav';
import FoodCard from '../menu/FoodCard';
import { FoodDetailsModal } from '../food/FoodDetailsModal';
import { CartView } from '../cart/CartView';
import { CartDrawer } from '../cart/CartDrawer';
import { OrderSuccessModal } from '../orders/OrderSuccessModal';
import { OrderDetailsModal } from '../orders/OrderDetailsModal';
import { AddMoneyModal } from '../wallet/AddMoneyModal';
import { EditProfileModal } from '../profile/EditProfileModal';
import { ChangePasswordModal } from '../profile/ChangePasswordModal';
import { SupportForms } from '../support/SupportForms';
import { api } from '../../services/api/apiClient';
import { 
  Search, ShieldCheck, Sparkles, Leaf, Utensils, Heart, 
  Wallet, Plus, ClipboardList, CheckCircle2, ArrowRight, RotateCcw, Clock, Bell, User as UserIcon
} from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  menuItems: FoodItem[];
  orders: Order[];
  cart: { food: FoodItem; quantity: number }[];
  onAddToCart: (food: FoodItem, quantity?: number) => void;
  onUpdateCartQuantity: (foodId: string, delta: number) => void;
  onRemoveFromCart: (foodId: string) => void;
  onClearCart: () => void;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
  activePathTab?: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  menuItems,
  orders,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onLogout,
  onUserUpdated,
  activePathTab = 'home',
  onNavigateTab
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealTime, setSelectedMealTime] = useState<string>('All');
  const [selectedFoodType, setSelectedFoodType] = useState<string>('All');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Filter options
  const mealTimeFilters = ['All', 'Breakfast', 'Lunch', 'Evening', 'All Day'];
  const foodTypeFilters = ['All', 'Veg', 'Non-Veg', 'Egg', 'Snacks', 'Juice', 'Beverages', 'Desserts', 'Fast Food', 'Combos'];

  // Modals & Slips State
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Orders Tab Filter State
  const [orderFilter, setOrderFilter] = useState<'All' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled'>('All');

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<'All' | 'Orders' | 'Menu' | 'Offers' | 'System'>('All');

  // Favorites heart toggle
  const userFavorites = currentUser.favorites || [];
  const handleToggleFavorite = async (foodId: string) => {
    const updatedFavs = await api.toggleFavorite(currentUser.id, foodId);
    onUserUpdated({ ...currentUser, favorites: updatedFavs });
  };

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        (item.itemCode && item.itemCode.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.mealTime && item.mealTime.toLowerCase().includes(q)) ||
        (item.foodType && item.foodType.toLowerCase().includes(q));
      
      if (!matchesSearch) return false;

      // Meal time filter
      if (selectedMealTime !== 'All') {
        if (selectedMealTime === 'Breakfast' && item.mealTime !== 'Breakfast' && item.mealTime !== 'All Day') return false;
        if (selectedMealTime === 'Lunch' && item.mealTime !== 'Lunch' && item.mealTime !== 'All Day') return false;
        if (selectedMealTime === 'Evening' && item.mealTime !== 'Evening' && item.mealTime !== 'All Day') return false;
        if (selectedMealTime === 'All Day' && item.mealTime !== 'All Day') return false;
      }

      // Food type filter
      if (selectedFoodType !== 'All') {
        if (selectedFoodType === 'Veg' && !(item.foodType === 'Veg' || item.isVegetarian)) return false;
        if (selectedFoodType === 'Non-Veg' && !(item.foodType === 'Non-Veg' || item.isNonVegetarian)) return false;
        if (selectedFoodType === 'Egg' && !(item.foodType === 'Egg' || item.containsEgg)) return false;
        if (selectedFoodType !== 'Veg' && selectedFoodType !== 'Non-Veg' && selectedFoodType !== 'Egg') {
          if (item.foodType !== selectedFoodType && !item.category.toLowerCase().includes(selectedFoodType.toLowerCase())) {
            return false;
          }
        }
      }

      // Hide disabled and out of stock items for Students until restocked or enabled by kitchen
      const stockQty = item.stockQuantity ?? item.stock ?? 0;
      const reservedQty = item.reservedQuantity || 0;
      const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
      if (availQty <= 0 || item.isAvailable === false || item.isActive === false) {
        return false;
      }

      return true;
    });
  }, [menuItems, searchQuery, selectedMealTime, selectedFoodType]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderFilter === 'All') return true;
      if (orderFilter === 'Preparing') return o.status === OrderStatus.PREPARING || o.status === OrderStatus.ACCEPTED;
      if (orderFilter === 'Ready') return o.status === OrderStatus.READY;
      if (orderFilter === 'Completed') return o.status === OrderStatus.COLLECTED || (o.status as string) === 'Completed';
      if (orderFilter === 'Cancelled') return o.status === OrderStatus.CANCELLED;
      return true;
    });
  }, [orders, orderFilter]);

  // Filtered Favorites (strictly hide disabled or out-of-stock items)
  const favoriteItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!userFavorites.includes(item.id)) return false;
      const stockQty = item.stockQuantity ?? item.stock ?? 0;
      const reservedQty = item.reservedQuantity || 0;
      const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
      if (availQty <= 0 || item.isAvailable === false || item.isActive === false) return false;
      return true;
    });
  }, [menuItems, userFavorites]);

  // Unread Notifications Count
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      
      {/* Sidebar */}
      <Sidebar
        activeTab={activePathTab}
        onTabChange={onNavigateTab}
        onOpenCart={() => onNavigateTab('cart')}
        cartItemCount={cartTotalCount}
        unreadNotificationCount={unreadCount}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        
        {/* Header */}
        <Header
          currentUser={currentUser}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenCart={() => onNavigateTab('cart')}
          cartCount={cartTotalCount}
          unreadNotifications={unreadCount}
          activeTab={activePathTab}
          onNavigateTab={onNavigateTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={onLogout}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* ================================================================= */}
          {/* 1. HOME DASHBOARD PAGE (/student) */}
          {/* ================================================================= */}
          {activePathTab === 'home' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header Greeting */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Good Morning, <br className="sm:hidden" />
                  <span className="text-orange-600 dark:text-orange-500">{currentUser.name}</span>
                </h1>
                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                  GOOD FOOD • BRIGHTER DAYS
                </p>
              </div>

              {/* Campus Visual Hero Banner */}
              <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-orange-600 via-amber-600 to-amber-700 text-white shadow-xl shadow-orange-600/20">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
                  style={{ backgroundImage: "url('/canteen_bg.jpg')" }}
                />
                <div className="relative z-10 max-w-xl space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Campus Fresh Meals Station</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    Delicious Campus Dining, <br />
                    Delivered Fresh & Fast
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-orange-100 leading-relaxed">
                    Skip the long queue! Order your favorite breakfast, lunch, or beverages online and collect directly from the canteen counter.
                  </p>

                  {/* Search Bar in Hero */}
                  <div className="pt-2">
                    <div className="relative max-w-lg">
                      <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for food, cuisine or category..."
                        className="w-full pl-10 pr-24 py-3 text-xs sm:text-sm font-medium rounded-2xl bg-white text-slate-900 shadow-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => onNavigateTab('menu')}
                        className="absolute right-2 top-2 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        Explore
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Pills Section */}
              <div className="space-y-3 bg-white dark:bg-[#131b2e] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                
                {/* Meal Time Filters */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Meal Time
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {mealTimeFilters.map((mt) => (
                      <button
                        key={mt}
                        onClick={() => setSelectedMealTime(mt)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedMealTime === mt
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-orange-500/40'
                        }`}
                      >
                        {mt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food Type Filters & Availability Switch */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Food Category
                    </label>
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Stock Available</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {foodTypeFilters.map((ft) => (
                      <button
                        key={ft}
                        onClick={() => setSelectedFoodType(ft)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedFoodType === ft
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-500/40'
                        }`}
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Today's Menu Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Today's Menu
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {filteredMenu.length} items available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {filteredMenu.slice(0, 8).map((item) => {
                    const cartItem = cart.find(c => c.food.id === item.id);
                    return (
                      <FoodCard
                        key={item.id}
                        item={item}
                        onAdd={() => onAddToCart(item)}
                        onUpdateQuantity={(delta) => onUpdateCartQuantity(item.id, delta)}
                        quantity={cartItem ? cartItem.quantity : 0}
                        isFavorite={userFavorites.includes(item.id)}
                        onToggleFavorite={() => handleToggleFavorite(item.id)}
                        onItemClick={() => setSelectedFoodItem(item)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Promotional Banner Section */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl border border-slate-800">
                <div className="relative z-10 max-w-lg space-y-3">
                  <span className="text-xs font-black uppercase tracking-widest text-orange-400">
                    Campus Special
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Healthy Meals for a Brighter You
                  </h3>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">
                    Prepared daily using 100% farm-fresh vegetables and cooked under strict hygiene protocols.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-emerald-300 border border-white/10">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      Fresh Ingredients
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-blue-300 border border-white/10">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      Hygienic Preparation
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-orange-300 border border-white/10">
                      <Utensils className="w-3.5 h-3.5 text-orange-400" />
                      Affordable Prices
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* 2. MENU PAGE (/student/menu) */}
          {/* ================================================================= */}
          {activePathTab === 'menu' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Full Menu
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Browse, filter and order fresh canteen food
                </p>
              </div>

              {/* Filter Pills Section */}
              <div className="space-y-3 bg-white dark:bg-[#131b2e] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                {/* Meal Time Filters */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Meal Time
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {mealTimeFilters.map((mt) => (
                      <button
                        key={mt}
                        onClick={() => setSelectedMealTime(mt)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedMealTime === mt
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-orange-500/40'
                        }`}
                      >
                        {mt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food Type Filters & Availability Switch */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Food Category
                    </label>
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Stock Available</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {foodTypeFilters.map((ft) => (
                      <button
                        key={ft}
                        onClick={() => setSelectedFoodType(ft)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedFoodType === ft
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-500/40'
                        }`}
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Food Grid */}
              {filteredMenu.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
                  <Utensils className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No food items found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Try changing your category filter or search query.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {filteredMenu.map((item) => {
                    const cartItem = cart.find(c => c.food.id === item.id);
                    return (
                      <FoodCard
                        key={item.id}
                        item={item}
                        onAdd={() => onAddToCart(item)}
                        onUpdateQuantity={(delta) => onUpdateCartQuantity(item.id, delta)}
                        quantity={cartItem ? cartItem.quantity : 0}
                        isFavorite={userFavorites.includes(item.id)}
                        onToggleFavorite={() => handleToggleFavorite(item.id)}
                        onItemClick={() => setSelectedFoodItem(item)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* CART PAGE (/student/cart) */}
          {/* ================================================================= */}
          {activePathTab === 'cart' && (
            <CartView
              cart={cart}
              onUpdateQuantity={onUpdateCartQuantity}
              onRemoveItem={onRemoveFromCart}
              onClearCart={onClearCart}
              currentUser={currentUser}
              onOrderSuccess={(ord) => setSuccessOrder(ord)}
              onWalletUpdated={() => onUserUpdated(currentUser)}
              onNavigateToMenu={() => onNavigateTab('menu')}
            />
          )}

          {/* ================================================================= */}
          {/* 3. MY ORDERS PAGE (/student/orders) */}
          {/* ================================================================= */}
          {activePathTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  My Orders
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Track your ongoing food preparation & pickup slips
                </p>
              </div>

              {/* Order Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {(['All', 'Preparing', 'Ready', 'Completed', 'Cancelled'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOrderFilter(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === tab
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
                  <ClipboardList className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No orders found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    You haven't placed any orders matching this status filter yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-3xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                            #{ord.id}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            ord.status === OrderStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            ord.status === OrderStatus.READY ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse' :
                            ord.status === OrderStatus.PREPARING ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ord.status}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>

                        <div className="text-[11px] font-medium text-slate-400">
                          {new Date(ord.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Amount</span>
                          <span className="text-base font-black text-slate-900 dark:text-white">₹{ord.totalAmount}</span>
                        </div>

                        <button
                          onClick={() => setInspectOrder(ord)}
                          className="px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold text-xs border border-orange-500/30 hover:bg-orange-600 hover:text-white transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. WALLET & PAYMENTS PAGE (/student/wallet) */}
          {/* ================================================================= */}
          {activePathTab === 'wallet' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Wallet & Payments
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage your Canteen balance and transaction history
                </p>
              </div>

              {/* Balance Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-amber-700 text-white shadow-xl shadow-orange-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-orange-200">
                    Canteen Wallet Balance
                  </span>
                  <div className="text-3xl sm:text-5xl font-black tracking-tight">
                    ₹{(currentUser.walletBalance ?? 0).toFixed(2)}
                  </div>
                  <p className="text-xs font-medium text-orange-100 pt-1">
                    Instant cash-free ordering across all campus counters
                  </p>
                </div>

                <button
                  onClick={() => setIsAddMoneyOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-white text-orange-700 hover:bg-orange-50 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Money</span>
                </button>
              </div>

              {/* Transaction History */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Transaction History
                </h3>

                <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                  {(currentUser.transactions || []).map((tx) => (
                    <div 
                      key={tx.id}
                      className="p-4 border-b last:border-b-0 border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                          tx.type === 'TOP_UP' 
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' 
                            : 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                        }`}>
                          {tx.type === 'TOP_UP' ? '+' : '-'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {tx.type === 'TOP_UP' ? 'Wallet Top-up' : 'Order Payment'}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-400">
                            {tx.reference} • {new Date(tx.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-black ${tx.type === 'TOP_UP' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {tx.type === 'TOP_UP' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                        </span>
                        <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. FAVORITES PAGE (/student/favorites) */}
          {/* ================================================================= */}
          {activePathTab === 'favorites' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Favorite Food Items
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Saved meals for quick ordering
                </p>
              </div>

              {favoriteItems.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
                  <Heart className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No favorites yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Save your favorite meals by tapping the heart icon on any food card for quick ordering.
                  </p>
                  <button
                    onClick={() => onNavigateTab('menu')}
                    className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {favoriteItems.map((item) => {
                    const cartItem = cart.find(c => c.food.id === item.id);
                    return (
                      <FoodCard
                        key={item.id}
                        item={item}
                        onAdd={() => onAddToCart(item)}
                        onUpdateQuantity={(delta) => onUpdateCartQuantity(item.id, delta)}
                        quantity={cartItem ? cartItem.quantity : 0}
                        isFavorite={true}
                        onToggleFavorite={() => handleToggleFavorite(item.id)}
                        onItemClick={() => setSelectedFoodItem(item)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 6. NOTIFICATIONS PAGE (/student/notifications) */}
          {/* ================================================================= */}
          {activePathTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    Notifications
                  </h1>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Order updates, menu offers & campus announcements
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {(['All', 'Orders', 'Menu', 'Offers', 'System'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNotificationFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      notificationFilter === cat
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                {notifications
                  .filter(n => notificationFilter === 'All' || n.category === notificationFilter)
                  .map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-4 border-b last:border-b-0 border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 ${
                        !notif.read ? 'bg-orange-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{notif.title}</span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-orange-600" />
                            )}
                          </h4>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {new Date(notif.timestamp).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. PROFILE PAGE (/student/profile) */}
          {/* ================================================================= */}
          {activePathTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Student Profile
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage your personal details and account settings
                </p>
              </div>

              {/* Profile Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                
                <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-3xl object-cover" />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {currentUser.name}
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {currentUser.email}
                    </p>
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase mt-2 border border-blue-500/30">
                      Student Account
                    </span>
                  </div>
                </div>

                {/* Info Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Full Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{currentUser.name}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">User Role</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">Student</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Phone Number</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{currentUser.phoneNumber || '+91 98765 43210'}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Email ID</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{currentUser.email}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Department</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{currentUser.department || 'Electronics & Communication Engineering'}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Roll Number / Register Number</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{currentUser.rollNumber || '24EC123'}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 sm:col-span-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Hostel / Block / Room</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{currentUser.hostelBlock || 'Hostel B - Block 3 - Room 204'}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. HELP & SUPPORT PAGE (/student/support) */}
          {/* ================================================================= */}
          {activePathTab === 'support' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Help & Support
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Get answers, report issues and contact canteen helpline
                </p>
              </div>

              <SupportForms />
            </div>
          )}

        </main>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <BottomNav activeTab={activePathTab} onTabChange={onNavigateTab} unreadNotifications={unreadCount} />

      {/* Food Details Modal */}
      <FoodDetailsModal
        item={selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
        onAddToCart={onAddToCart}
        isFavorite={selectedFoodItem ? userFavorites.includes(selectedFoodItem.id) : false}
        onToggleFavorite={selectedFoodItem ? () => handleToggleFavorite(selectedFoodItem.id) : undefined}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={onUpdateCartQuantity}
        onRemoveItem={onRemoveFromCart}
        onClearCart={onClearCart}
        currentUser={currentUser}
        onOrderSuccess={(ord) => setSuccessOrder(ord)}
        onWalletUpdated={() => onUserUpdated({ ...currentUser })}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        order={successOrder}
        onClose={() => setSuccessOrder(null)}
        onTrackOrder={() => onNavigateTab('orders')}
        onGoHome={() => onNavigateTab('home')}
      />

      {/* Order Details Timeline Modal */}
      <OrderDetailsModal
        order={inspectOrder}
        onClose={() => setInspectOrder(null)}
        onReorder={(ord) => {
          ord.items.forEach(i => {
            const item = menuItems.find(m => m.id === i.foodId || m.name === i.name);
            if (item) onAddToCart(item, i.quantity);
          });
          setIsCartOpen(true);
        }}
      />

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        currentUser={currentUser}
        onSuccess={(newBal) => onUserUpdated({ ...currentUser, walletBalance: newBal })}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onUpdated={onUserUpdated}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

    </div>
  );
};
