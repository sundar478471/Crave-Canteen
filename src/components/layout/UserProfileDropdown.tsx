import React, { useState, useRef, useEffect } from 'react';
import { User as UserType, UserRole } from '../../types';
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react';

export interface UserProfileDropdownProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onNavigateProfile?: () => void;
  currentPath?: string;
  activeTab?: string;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  currentUser,
  onLogout,
  onNavigateProfile,
  currentPath,
  activeTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Display Name Fallback
  const displayName = currentUser?.name?.trim() 
    || currentUser?.email?.split('@')[0] 
    || 'User';

  // Initials computation
  const getInitials = (nameStr: string): string => {
    if (!nameStr) return 'CC';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return parts[0].toUpperCase() || 'CC';
  };

  const initials = getInitials(displayName);

  // Role Formatting
  const getRoleLabel = (role?: UserRole | string): string => {
    if (!role) return 'User';
    switch (role) {
      case UserRole.STUDENT:
      case 'STUDENT':
        return 'Student';
      case UserRole.FACULTY:
      case 'FACULTY':
        return 'Faculty';
      case UserRole.STAFF:
      case UserRole.KITCHEN_STAFF:
      case 'STAFF':
      case 'KITCHEN_STAFF':
        return 'Kitchen Staff';
      case UserRole.COUNTER_STAFF:
      case 'COUNTER_STAFF':
        return 'Counter POS Staff';
      case UserRole.CANTEEN_MANAGER:
      case 'CANTEEN_MANAGER':
        return 'Canteen Manager';
      case UserRole.VENDOR_ADMIN:
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'VENDOR_ADMIN':
        return 'System Admin';
      default:
        return String(role);
    }
  };

  const roleLabel = getRoleLabel(currentUser?.role);

  // Close on click outside
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent | MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-close on path or tab change
  useEffect(() => {
    setIsOpen(false);
  }, [currentPath, activeTab]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onNavigateProfile) {
      onNavigateProfile();
    }
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open user menu"
        aria-expanded={isOpen}
        className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/30"
      >
        {/* Avatar / Initials Badge */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0 overflow-hidden">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Display Name */}
        <span className="hidden md:inline font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
          {displayName}
        </span>

        {/* Dropdown Chevron Arrow */}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-600' : ''}`} />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div 
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl z-50 overflow-hidden p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* User Info Header inside Dropdown */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl mb-1 border border-slate-100 dark:border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0 overflow-hidden">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{displayName}</h4>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || ''}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

          {/* Menu Item: My Profile */}
          <button
            type="button"
            role="menuitem"
            onClick={handleProfileClick}
            className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 focus:bg-orange-500/10 focus:text-orange-600 outline-none transition-colors cursor-pointer"
          >
            <UserIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>My Profile</span>
          </button>

          {/* Menu Item: Logout */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogoutClick}
            className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 outline-none transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};
