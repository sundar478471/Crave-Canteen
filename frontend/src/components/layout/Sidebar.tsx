import React from 'react';
import { Home, ClipboardList, User, LogOut, Coffee, History, ShoppingCart, X } from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'orders' | 'transactions' | 'profile';
  onTabChange: (tab: 'home' | 'orders' | 'transactions' | 'profile') => void;
  onOpenCart: () => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: any;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onOpenCart, 
  onLogout,
  isOpen = false,
  onClose,
  currentUser
}) => {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'orders', icon: ClipboardList, label: 'Slips' },
    { id: 'transactions', icon: History, label: 'Transactions' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart', action: onOpenCart },
    { id: 'profile', icon: User, label: 'Account' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen bg-white border-r flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 w-16 md:w-72'}
      `}>
        <div className="p-4 md:p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <div className="bg-[#9333ea] p-2 md:p-2.5 rounded-xl md:rounded-2xl text-white shadow-lg shadow-purple-200">
              <Coffee className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className={`text-2xl font-black italic tracking-tighter text-slate-900 ${isOpen ? 'block' : 'hidden md:block'}`}>
              CraveCanteen
            </span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-2 md:px-4 py-4 md:py-8 space-y-1 md:space-y-2 flex flex-col items-center md:items-stretch overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) item.action();
                  else onTabChange(item.id as any);
                  if (onClose) onClose();
                }}
                className={`flex items-center justify-center md:justify-start space-x-0 md:space-x-4 px-2 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 group w-full ${
                  isActive 
                    ? 'bg-[#f8f5ff] text-[#9333ea]' 
                    : 'text-[#94a3b8] hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110 ${isActive ? 'text-[#9333ea]' : 'text-[#cbd5e1]'}`} />
                <span className={`text-lg tracking-tight font-medium ${isActive ? 'font-black italic' : ''} ${isOpen ? 'block' : 'hidden md:block'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {currentUser && (
          <div className={`p-4 md:p-6 border-t border-gray-50 bg-slate-50/50 ${isOpen ? 'block' : 'hidden md:block'}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black italic text-sm border-2 border-white shadow-sm overflow-hidden">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate italic">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-medium">{currentUser.email}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-[#f43f5e] hover:bg-rose-50 rounded-xl transition-all font-black text-xs uppercase tracking-widest group"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {!isOpen && (
          <div className="p-4 border-t border-gray-50 mt-auto flex justify-center md:hidden">
            <button 
              onClick={onLogout}
              className="p-2 text-[#f43f5e] hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
