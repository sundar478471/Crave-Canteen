import React from 'react';
import { Menu, Search, ShoppingBag, Bell, Wallet, Utensils } from 'lucide-react';
import { User } from '../../types';
import { ThemeSelector } from '../common/ThemeSelector';
import { UserProfileDropdown } from './UserProfileDropdown';

interface HeaderProps {
  currentUser: User | null;
  onOpenSidebar: () => void;
  onOpenCart: () => void;
  cartCount: number;
  unreadNotifications: number;
  activeTab: string;
  onNavigateTab: (tab: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenSidebar,
  onOpenCart,
  cartCount,
  unreadNotifications,
  activeTab,
  onNavigateTab,
  searchQuery,
  onSearchChange,
  onLogout
}) => {
  const isFaculty = currentUser?.role === 'FACULTY';
  const formattedBalance = (currentUser?.walletBalance ?? 0).toFixed(2);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Mobile Sidebar Trigger + Logo / Page Title */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex lg:hidden items-center justify-center text-white shadow-xs">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                <span>{activeTab === 'home' ? 'Dashboard' : activeTab.replace('-', ' ')}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isFaculty 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                }`}>
                  {isFaculty ? 'Faculty' : 'Student'}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for food, cuisine or category..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-orange-500/40 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Action Icons & Wallet */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Wallet Balance Badge */}
          <button
            onClick={() => onNavigateTab('wallet')}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30 text-xs font-extrabold hover:bg-orange-500/20 transition-all cursor-pointer"
            title="Wallet Balance"
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span>₹{formattedBalance}</span>
          </button>

          {/* Notifications Icon Button */}
          <button
            onClick={() => onNavigateTab('notifications')}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Shopping Cart Icon Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cart"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Theme Selector */}
          <ThemeSelector variant="compact" />

          {/* User Profile Dropdown */}
          <UserProfileDropdown
            currentUser={currentUser}
            onLogout={onLogout || (() => {})}
            onNavigateProfile={() => onNavigateTab('profile')}
            activeTab={activeTab}
          />

        </div>

      </div>
    </header>
  );
};
