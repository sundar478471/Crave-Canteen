import React from 'react';
import { 
  Home, UtensilsCrossed, ClipboardList, Wallet, Heart, 
  Bell, User, HelpCircle, LogOut, Utensils, X, ShoppingBag
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSelector } from '../common/ThemeSelector';
import { User as UserType } from '../../types';

export type NavTab = 
  | 'home' 
  | 'menu' 
  | 'cart'
  | 'orders' 
  | 'wallet' 
  | 'favorites' 
  | 'notifications' 
  | 'profile' 
  | 'support';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenCart?: () => void;
  cartItemCount?: number;
  unreadNotificationCount?: number;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  currentUser: UserType | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onOpenCart, 
  cartItemCount = 0,
  unreadNotificationCount = 0,
  onLogout,
  isOpen = false,
  onClose,
  currentUser
}) => {
  const { effectiveTheme } = useTheme();
  const isFaculty = currentUser?.role === 'FACULTY';

  const navItems: { id: NavTab; icon: React.ElementType; label: string; badge?: number }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'menu', icon: UtensilsCrossed, label: 'Menu' },
    { id: 'cart', icon: ShoppingBag, label: 'My Cart', badge: cartItemCount },
    { id: 'orders', icon: ClipboardList, label: 'My Orders' },
    { id: 'wallet', icon: Wallet, label: 'Wallet & Payments' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadNotificationCount },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'support', icon: HelpCircle, label: 'Help & Support' },
  ];

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-[#0f172a] border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 w-72'}
      `}>
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center">
                <span>Crave</span>
                <span className="text-orange-600 dark:text-orange-500">Canteen</span>
              </h2>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {isFaculty ? 'GOOD FOOD • BRIGHTER MINDS' : 'GOOD FOOD • BRIGHTER DAYS'}
              </p>
            </div>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Logged in Profile Badge Card */}
        {currentUser && (
          <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-sm flex items-center justify-center shrink-0 border border-orange-500/30">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentUser.name}
              </h4>
              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${
                isFaculty 
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-500/30'
              }`}>
                {isFaculty ? 'Faculty' : 'Student'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Cart Action Button */}
        <div className="px-4 mt-3">
          <button
            onClick={() => {
              onTabChange('cart');
              if (onClose) onClose();
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'cart'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20 ring-2 ring-orange-500/30'
                : 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>View Cart Page</span>
            </div>
            {cartItemCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                activeTab === 'cart' ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'
              }`}>
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-xs tracking-tight">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Theme Selector & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0 space-y-3">
          <ThemeSelector variant="full" />

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all font-bold text-xs group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;

