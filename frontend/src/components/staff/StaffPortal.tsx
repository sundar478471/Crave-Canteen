import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, FoodItem } from '@shared/types';
import { STATUS_COLORS } from '@shared/constants';

import { api, authenticatedFetch } from '../../services/api/apiClient';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Check, Play, Search, Plus, 
  Monitor, LayoutGrid, X, 
  UserCheck, Scan, TrendingUp, Zap, Users,
  Clock, Edit3, Calendar, LogOut, CheckCircle2, ChevronRight, Utensils, Coffee, History, Package, LogOut as LogOutIcon, ShoppingCart, Minus, Camera, Loader2, AlertCircle, Flame, BarChart3, Globe, PowerOff
} from 'lucide-react';

interface StaffPortalProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => void;
  menuItems: FoodItem[];
  onUpdateMenu: (menu: FoodItem[]) => void;
  onLogout: () => void;
}

const StaffPortal: React.FC<StaffPortalProps> = ({ orders, onUpdateStatus, menuItems, onUpdateMenu, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'manual' | 'scanner' | 'menu' | 'history' | 'preparing' | 'ready' | 'pos' | 'dashboard'>('live');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [scannerMode, setScannerMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerSuccess, setScannerSuccess] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualOrderId, setManualOrderId] = useState('');
  
  const [posCart, setPosCart] = useState<{ food: FoodItem; quantity: number }[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<Order['paymentMethod']>('CASH');
  const [isPosProcessing, setIsPosProcessing] = useState(false);
  
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, image: '', description: '', stock: 0, category: 'ALL' });
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (scannerMode && !isScanning) {
      const html5QrCode = new Html5Qrcode("reader-container");
      html5QrCodeRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const detectedId = decodedText.trim().toUpperCase();
          
          if (detectedId.startsWith('ITM-')) {
            const parts = detectedId.split('-');
            if (parts.length >= 4) {
              const orderId = `${parts[1]}-${parts[2]}`;
              const itemIdx = parseInt(parts[3], 10);
              const matchedOrder = orders.find(o => o.id.toUpperCase() === orderId);
              
              if (matchedOrder && !isScanning) {
                setIsScanning(true);
                handleItemStatusChange(matchedOrder, itemIdx);
              }
            }
          } else {
            const matchedOrder = orders.find(o => o.id.toUpperCase() === detectedId || o.id.split('-')[1]?.toUpperCase() === detectedId);
            if (matchedOrder && !isScanning) {
              setIsScanning(true);
              handleProcessStatusChange(matchedOrder);
            }
          }
        },
        () => {}
      ).catch(err => {
        console.error("Camera Access Error:", err);
        setCameraError("Unable to access camera. Check browser permissions.");
      });
    } else {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
        }).catch(err => console.error(err));
      }
    }
    
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
        }).catch(err => console.error(err));
      }
    };
  }, [scannerMode, isScanning, orders]);

  const handleItemStatusChange = async (order: Order, itemIdx: number) => {
    const item = order.items[itemIdx];
    if (!item) {
      setStaffError("Item not found in order");
      setTimeout(() => setStaffError(null), 3000);
      setIsScanning(false);
      return;
    }

    let nextItemStatus: 'PENDING' | 'PREPARING' | 'READY' = 'PREPARING';
    if (!item.status || item.status === 'PENDING') {
      nextItemStatus = 'PREPARING';
    } else if (item.status === 'PREPARING') {
      nextItemStatus = 'READY';
    } else if (item.status === 'READY') {
      setStaffError(`${item.name} is already READY`);
      setTimeout(() => setStaffError(null), 3000);
      setIsScanning(false);
      return;
    }

    const newItems = [...order.items];
    newItems[itemIdx] = { ...item, status: nextItemStatus };

    const allReady = newItems.every(it => it.status === 'READY');
    const anyPreparing = newItems.some(it => it.status === 'PREPARING' || it.status === 'READY');

    let nextOrderStatus = order.status;
    if (allReady) {
      nextOrderStatus = OrderStatus.READY;
    } else if (anyPreparing && order.status === OrderStatus.PEND_BOOKED) {
      nextOrderStatus = OrderStatus.PREPARING;
    }

    const extra: Partial<Order> = { items: newItems };
    if (nextOrderStatus === OrderStatus.PREPARING && order.status === OrderStatus.PEND_BOOKED) {
      extra.estimatedFinishTime = Date.now() + 15 * 60000;
    }

    try {
      await onUpdateStatus(order.id, nextOrderStatus, extra);
      setScannerSuccess(`${order.id} - ${item.name}`);
    } catch (err) {
      console.error("Failed to update item status:", err);
      setStaffError("Failed to update item status. Please try again.");
      setTimeout(() => setStaffError(null), 3000);
      setIsScanning(false);
      return;
    }

    if (nextOrderStatus !== order.status) {
      try {
        const user = await api.getUser(order.userId);
        if (user && user.email) {
          await authenticatedFetch('/api/order-status-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              order, 
              newStatus: nextOrderStatus,
              user: { name: user.name, email: user.email, phoneNumber: user.phoneNumber }
            })
          });
        }
      } catch (err) {
        console.error("Failed to send status update notification:", err);
      }
    }

    setTimeout(() => {
      setScannerSuccess(null);
      setScannerMode(false);
      setIsScanning(false);
    }, 1500);
  };

  const handleProcessStatusChange = async (order: Order) => {
    let nextStatus = order.status;
    if (order.status === OrderStatus.PEND_BOOKED) {
      nextStatus = OrderStatus.PREPARING;
    } else if (order.status === OrderStatus.PREPARING) {
      nextStatus = OrderStatus.READY;
    } else if (order.status === OrderStatus.READY) {
      nextStatus = OrderStatus.COMPLETED;
    } else {
      setStaffError(`Order is already ${order.status}`);
      setTimeout(() => setStaffError(null), 3000);
      setIsScanning(false);
      return; 
    }

    const extra = nextStatus === OrderStatus.PREPARING ? { estimatedFinishTime: Date.now() + 15 * 60000 } : {};
    try {
      await onUpdateStatus(order.id, nextStatus, extra);
      setScannerSuccess(order.id);
    } catch (err) {
      console.error("Failed to update status:", err);
      setStaffError("Failed to update order status. Please try again.");
      setTimeout(() => setStaffError(null), 3000);
      return;
    }
    
    try {
      const user = await api.getUser(order.userId);
      if (user && user.email) {
        await authenticatedFetch('/api/order-status-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            order, 
            newStatus: nextStatus,
            user: { name: user.name, email: user.email, phoneNumber: user.phoneNumber }
          })
        });
      }
    } catch (err) {
      console.error("Failed to send status update notification:", err);
    }

    setTimeout(() => {
      setScannerSuccess(null);
      setScannerMode(false);
      setIsScanning(false);
    }, 1500);
  };

  const toggleItemAvailability = async (itemId: string) => {
    const updatedMenu = menuItems.map(item => 
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    );
    try {
      await onUpdateMenu(updatedMenu);
    } catch (err) {
      console.error("Failed to update menu:", err);
      setStaffError("Failed to update menu availability. Please try again.");
      setTimeout(() => setStaffError(null), 3000);
    }
  };

  const handleSaveItemEdit = async () => {
    if (!editingItem) return;
    
    let updatedMenu;
    if (editingItem.id === 'new') {
      const newItem: FoodItem = {
        id: `food-${Date.now()}`,
        name: editForm.name,
        price: editForm.price,
        image: editForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        description: editForm.description,
        isAvailable: true,
        category: editForm.category,
        estimatedTime: 15,
        startHour: 0,
        endHour: 24,
        stock: editForm.stock,
        timeSlot: 'All Day',
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      };
      updatedMenu = [...menuItems, newItem];
    } else {
      updatedMenu = menuItems.map(item => 
        item.id === editingItem.id ? { ...item, ...editForm } : item
      );
    }

    try {
      await onUpdateMenu(updatedMenu);
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to update menu item:", err);
      setStaffError("Failed to save changes.");
      setTimeout(() => setStaffError(null), 3000);
    }
  };

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
      item.category.toLowerCase().includes(menuSearch.toLowerCase())
    );
  }, [menuItems, menuSearch]);

  const renderOrderList = (title: string, icon: React.ReactNode, filterStatus: OrderStatus, emptyMessage: string) => {
    const filteredOrders = orders.filter(o => o.status === filterStatus);
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl font-black italic tracking-tighter text-white">{title}.</h2>
          <div className="bg-[#131823] px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center shadow-sm">
             {icon} {filteredOrders.length} Active Tickets
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {filteredOrders.length === 0 ? (
            <div className="py-16 md:py-32 text-center bg-[#131823] rounded-2xl md:rounded-[3rem] border-2 border-dashed border-white/5">
              <Zap className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4 md:mb-6" />
              <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px] md:text-xs">{emptyMessage}</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="bg-[#131823] p-5 md:p-8 rounded-2xl md:rounded-[3rem] border border-white/5 shadow-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all group cursor-pointer flex flex-col"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-8 border-b border-white/5 pb-4 md:pb-6">
                  <div className="flex items-center space-x-4 md:space-x-6 text-left">
                     <div className="bg-black border border-white/10 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center text-white font-black italic shrink-0 text-sm md:text-base">
                       #{order.id.split('-')[1]}
                     </div>
                     <div>
                        <h4 className="text-base md:text-xl font-black text-white italic tracking-tight">{order.userName}</h4>
                        <div className="flex items-center space-x-2 md:space-x-3 mt-0.5 md:mt-1">
                           <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                             {order.status === OrderStatus.PEND_BOOKED ? 'Waiting' : order.status}
                           </span>
                           <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-3">
                     {order.status === OrderStatus.PEND_BOOKED && (
                       <button onClick={(e) => { e.stopPropagation(); handleProcessStatusChange(order); }} className="flex-1 md:flex-initial px-4 md:px-8 py-3 md:py-4 bg-amber-500 text-white rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                         <Play className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2" /> Start Preparing
                       </button>
                     )}
                     {order.status === OrderStatus.PREPARING && (
                       <button onClick={(e) => { e.stopPropagation(); handleProcessStatusChange(order); }} className="flex-1 md:flex-initial px-4 md:px-8 py-3 md:py-4 bg-orange-600 text-white rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                         <Check className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Mark as Ready
                       </button>
                     )}
                     {order.status === OrderStatus.READY && (
                       <button onClick={(e) => { e.stopPropagation(); handleProcessStatusChange(order); }} className="flex-1 md:flex-initial px-4 md:px-8 py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                         <UserCheck className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Complete Handover
                       </button>
                     )}
                     <div className="p-2 md:p-3 bg-black border border-white/5 rounded-xl md:rounded-2xl text-slate-400 group-hover:text-white transition-all">
                       <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3 flex items-center">
                    <Utensils className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 md:mr-2 text-slate-400" /> Items to Prepare
                  </p>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                     {order.items.map((item: any, idx: number) => (
                       <div key={idx} className="bg-black border border-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl flex items-center space-x-1.5 md:space-x-2">
                         <span className="text-[10px] md:text-[11px] font-black text-white italic">{item.quantity}x</span>
                         <span className="text-[10px] md:text-[11px] font-bold text-slate-400 italic">{item.name}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col font-sans text-white">
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#0B0E14] p-4 md:p-6 border-b border-white/5 shadow-sm shrink-0 gap-4 sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center space-x-2 md:space-x-3 text-left">
            <div className="bg-purple-600 p-2 md:p-2.5 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Coffee className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black italic tracking-tighter text-white">KitchenConsole</h1>
              <p className="text-[8px] md:text-[9px] font-black text-purple-500 uppercase tracking-widest">Operational Control & Free POS</p>
            </div>
          </div>
          
          <button onClick={onLogout} className="md:hidden p-2 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/5">
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-6 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <BarChart3 className="w-4 h-4 mr-2" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('live')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'live' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <LayoutGrid className="w-4 h-4 mr-2" /> Live Orders
          </button>
          <button onClick={() => setActiveTab('pos')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'pos' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <Monitor className="w-4 h-4 mr-2" /> Free POS
          </button>
          <button onClick={() => setActiveTab('manual')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'manual' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <Edit3 className="w-4 h-4 mr-2" /> Bill No Type
          </button>
          <button onClick={() => setActiveTab('scanner')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'scanner' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-slate-400 hover:text-white'}`}>
            <Scan className="w-4 h-4 mr-2" /> Scanner
          </button>
          <button onClick={() => setActiveTab('menu')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'menu' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <Utensils className="w-4 h-4 mr-2" /> Menu Vault
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <History className="w-4 h-4 mr-2" /> History
          </button>
          <button onClick={() => setActiveTab('preparing')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'preparing' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <Flame className="w-4 h-4 mr-2" /> Preparing Bills
          </button>
          <button onClick={() => setActiveTab('ready')} className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ready' ? 'bg-purple-600/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Ready Bills
          </button>
        </div>

        <div className="flex items-center space-x-4 hidden md:flex">
          <div className="text-right">
            <p className="text-sm font-black italic text-white">Head Chef</p>
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">System Online</p>
          </div>
          <button onClick={onLogout} className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/5">
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 relative">
        {staffError && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-rose-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">{staffError}</span>
          </div>
        )}

        {staffSuccess && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">{staffSuccess}</span>
          </div>
        )}
        <div className="max-w-7xl mx-auto space-y-8 pb-20 relative z-10">
          
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-3xl font-black italic tracking-tighter text-white">Dashboard.</h2>
                <div className="bg-[#131823] px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center shadow-sm">
                   <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 md:mr-2" /> Today's Overview
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                <div className="bg-[#131823] p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3">Counter Sales (Cash)</p>
                  <p className="text-3xl md:text-5xl font-black italic text-emerald-400 tracking-tighter">
                    ₹{orders.filter(o => o.status === OrderStatus.COMPLETED && o.paymentMethod === 'CASH' && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((acc, o) => acc + o.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#131823] p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3">Online Sales (Card/UPI)</p>
                  <p className="text-3xl md:text-5xl font-black italic text-purple-400 tracking-tighter">
                    ₹{orders.filter(o => o.status === OrderStatus.COMPLETED && o.paymentMethod !== 'CASH' && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((acc, o) => acc + o.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-black italic tracking-tighter text-white mb-4">Current Stock Levels</h3>
              <div className="bg-[#131823] rounded-2xl md:rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/50">
                        <th className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                        <th className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                        <th className="p-4 md:p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 md:p-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-sm font-bold text-white">{item.name}</span>
                            </div>
                          </td>
                          <td className="p-4 md:p-6 text-xs font-bold text-slate-400">{item.category}</td>
                          <td className="p-4 md:p-6 text-right">
                            <span className={`text-sm font-black ${item.stock && item.stock > 10 ? 'text-emerald-400' : item.stock && item.stock > 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                              {item.stock || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'live' && renderOrderList('Live Queue', <Users className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 md:mr-2" />, OrderStatus.PEND_BOOKED, 'No active tickets')}
          {activeTab === 'preparing' && renderOrderList('Preparing Bills', <Flame className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 md:mr-2" />, OrderStatus.PREPARING, 'No orders currently preparing')}
          {activeTab === 'ready' && renderOrderList('Ready Bills', <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 md:mr-2" />, OrderStatus.READY, 'No orders ready for pickup')}

          {activeTab === 'pos' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
              <div className="flex-1 flex flex-col bg-[#131823] rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 shrink-0">
                  <div className="relative w-full">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                     <input 
                       type="text" 
                       placeholder="Search items for POS..." 
                       className="w-full pl-12 pr-6 py-4 bg-black border border-white/5 rounded-2xl text-xs font-bold shadow-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 transition-all"
                       value={posSearch}
                       onChange={(e) => setPosSearch(e.target.value)}
                     />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 xl:grid-cols-3 gap-4 no-scrollbar">
                  {menuItems.filter(item => item.isAvailable && item.name.toLowerCase().includes(posSearch.toLowerCase())).map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setPosCart(prev => {
                          const existing = prev.find(i => i.food.id === item.id);
                          const currentQty = existing ? existing.quantity : 0;
                          const currentMenuItem = menuItems.find(m => m.id === item.id);
                          const currentStock = currentMenuItem ? (currentMenuItem.stock || 0) : 0;
                          
                          if (currentStock <= currentQty) {
                            setStaffError(`Only ${currentStock} left in stock for ${item.name}`);
                            setTimeout(() => setStaffError(null), 3000);
                            return prev;
                          }

                          if (existing) return prev.map(i => i.food.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                          return [...prev, { food: item, quantity: 1 }];
                        });
                      }}
                      className="bg-black p-4 rounded-2xl border border-white/5 cursor-pointer hover:border-purple-500/50 transition-all flex flex-col items-center text-center group"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-white/10 group-hover:border-purple-500/50 transition-all relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] font-black text-white py-0.5">
                          {item.stock || 0} left
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-white italic mb-1 line-clamp-1">{item.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-96 flex flex-col bg-[#131823] rounded-[2rem] border border-white/5 overflow-hidden shrink-0">
                <div className="p-6 border-b border-white/5 shrink-0 bg-black/50">
                  <h3 className="text-xl font-black italic text-white flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-purple-500" /> Current Order
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {posCart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                      <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest">Cart is empty</p>
                    </div>
                  ) : (
                    posCart.map(item => (
                      <div key={item.food.id} className="flex items-center justify-between bg-black p-3 rounded-xl border border-white/5">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="text-xs font-black text-white italic truncate">{item.food.name}</h4>
                          <span className="text-[10px] font-bold text-slate-400">₹{item.food.price}</span>
                        </div>
                        <div className="flex items-center space-x-3 bg-[#131823] rounded-lg p-1 border border-white/5">
                          <button 
                            onClick={() => setPosCart(prev => prev.map(i => i.food.id === item.food.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0))}
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => setPosCart(prev => prev.map(i => {
                              if (i.food.id === item.food.id) {
                                const currentMenuItem = menuItems.find(m => m.id === i.food.id);
                                const currentStock = currentMenuItem ? (currentMenuItem.stock || 0) : 0;
                                if (currentStock <= i.quantity) {
                                  setStaffError(`Only ${currentStock} left in stock for ${i.food.name}`);
                                  setTimeout(() => setStaffError(null), 3000);
                                  return i;
                                }
                                return { ...i, quantity: i.quantity + 1 };
                              }
                              return i;
                            }))}
                            disabled={(() => {
                              const currentMenuItem = menuItems.find(m => m.id === item.food.id);
                              return (currentMenuItem ? (currentMenuItem.stock || 0) : 0) <= item.quantity;
                            })()}
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-white/5 shrink-0 bg-black/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                    <span className="text-2xl font-black text-white italic">₹{posCart.reduce((acc, item) => acc + (item.food.price * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setPosPaymentMethod('CASH')}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${posPaymentMethod === 'CASH' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-[#131823] border-white/5 text-slate-400 hover:text-white'}`}
                    >
                      Cash
                    </button>
                    <button 
                      onClick={() => setPosPaymentMethod('CARD')}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${posPaymentMethod === 'CARD' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-[#131823] border-white/5 text-slate-400 hover:text-white'}`}
                    >
                      Card/UPI
                    </button>
                  </div>

                  <button 
                    disabled={posCart.length === 0 || isPosProcessing}
                    onClick={async () => {
                      setIsPosProcessing(true);
                      try {
                        const outOfStockItems = posCart.filter(item => {
                          const currentMenuItem = menuItems.find(m => m.id === item.food.id);
                          return !currentMenuItem || (currentMenuItem.stock || 0) < item.quantity;
                        });
                        if (outOfStockItems.length > 0) {
                          setStaffError(`Insufficient stock for: ${outOfStockItems.map(i => i.food.name).join(', ')}`);
                          setTimeout(() => setStaffError(null), 3000);
                          setIsPosProcessing(false);
                          return;
                        }

                        const newOrder: Omit<Order, 'id'> = {
                          userId: 'WALK-IN',
                          userName: 'Walk-in Customer',
                          items: posCart.map(item => ({ foodId: item.food.id, quantity: item.quantity, name: item.food.name, price: item.food.price })),
                          totalAmount: posCart.reduce((acc, item) => acc + (item.food.price * item.quantity), 0),
                          status: OrderStatus.PEND_BOOKED,
                          createdAt: Date.now(),
                          estimatedFinishTime: Date.now() + (Math.max(...posCart.map(i => i.food.estimatedTime || 15)) * 60000),
                          paymentMethod: posPaymentMethod,
                          refundStatus: 'NONE'
                        };
                        
                        const updatedMenu = menuItems.map(menuItem => {
                          const cartItem = posCart.find(c => c.food.id === menuItem.id);
                          if (cartItem) {
                            return { ...menuItem, stock: Math.max(0, (menuItem.stock || 0) - cartItem.quantity) };
                          }
                          return menuItem;
                        });
                        
                        await onUpdateMenu(updatedMenu);
                        await api.createOrder(newOrder as Order);
                        setPosCart([]);
                        setStaffSuccess("Order placed successfully!");
                        setTimeout(() => setStaffSuccess(null), 3000);
                      } catch (err) {
                        console.error(err);
                        setStaffError("Failed to place order");
                        setTimeout(() => setStaffError(null), 3000);
                      } finally {
                        setIsPosProcessing(false);
                      }
                    }}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center"
                  >
                    {isPosProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Order'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto mt-10">
              <div className="bg-purple-900/20 border border-purple-500/30 p-4 md:p-6 rounded-3xl md:rounded-[2rem] mb-6 md:mb-8 shadow-[0_0_30px_rgba(168,85,247,0.15)] mx-auto w-fit">
                <Edit3 className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic text-white tracking-tighter mb-2 md:mb-4 text-center">Manual Entry.</h2>
              <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 md:mb-16 text-center">Type bill number to fetch and update</p>

              <div className="w-full bg-[#0B0E14] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center bg-[#131823] border border-purple-500/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 mb-6 md:mb-8 shadow-inner">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-500 mr-3 md:mr-4 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="ENTER ORDER ID (E.G. #A1B2)" 
                      className="bg-transparent border-none outline-none text-white font-black italic tracking-widest text-xs md:text-sm w-full placeholder:text-slate-600"
                      value={manualOrderId}
                      onChange={(e) => setManualOrderId(e.target.value)}
                      autoFocus
                    />
                  </div>
                  
                  {manualOrderId && orders.find(o => o.id.toUpperCase() === manualOrderId.toUpperCase() || o.id.split('-')[1]?.toUpperCase() === manualOrderId.toUpperCase()) ? (
                    (() => {
                      const order = orders.find(o => o.id.toUpperCase() === manualOrderId.toUpperCase() || o.id.split('-')[1]?.toUpperCase() === manualOrderId.toUpperCase())!;
                      return (
                        <div className="bg-[#131823] p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 shadow-sm mt-6">
                          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <div>
                              <h4 className="text-lg md:text-xl font-black text-white italic tracking-tight">{order.userName}</h4>
                              <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mt-2 inline-block ${STATUS_COLORS[order.status]}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="bg-black border border-white/10 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center text-white font-black italic shrink-0 text-sm md:text-base">
                              #{order.id.split('-')[1]}
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                              <Utensils className="w-2.5 h-2.5 mr-1.5 text-slate-400" /> Items
                            </p>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                               {order.items.map((item: any, idx: number) => (
                                 <div key={idx} className="bg-black border border-white/5 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                                   <span className="text-[10px] font-black text-white italic">{item.quantity}x</span>
                                   <span className="text-[10px] font-bold text-slate-400 italic">{item.name}</span>
                                 </div>
                               ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            {order.status === OrderStatus.PEND_BOOKED && (
                              <button onClick={() => { handleProcessStatusChange(order); setManualOrderId(''); }} className="w-full py-4 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 mr-2" /> Start Preparing
                              </button>
                            )}
                            {order.status === OrderStatus.PREPARING && (
                              <button onClick={() => { handleProcessStatusChange(order); setManualOrderId(''); }} className="w-full py-4 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 mr-2" /> Mark as Ready
                              </button>
                            )}
                            {order.status === OrderStatus.READY && (
                              <button onClick={() => { handleProcessStatusChange(order); setManualOrderId(''); }} className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                                <UserCheck className="w-3.5 h-3.5 mr-2" /> Complete Handover
                              </button>
                            )}
                            {order.status === OrderStatus.COMPLETED && (
                              <div className="w-full py-4 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center cursor-not-allowed">
                                Order Completed
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : manualOrderId ? (
                    <div className="text-center py-8 text-slate-500 font-bold italic text-sm">
                      No matching order found.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scanner' && (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-purple-900/20 border border-purple-500/30 p-4 md:p-6 rounded-3xl md:rounded-[2rem] mb-6 md:mb-8 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <Scan className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic text-white tracking-tighter mb-2 md:mb-4">Order Scanner.</h2>
              <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 md:mb-16">Scan Bar code to update status</p>

              <div className="w-full max-w-2xl bg-[#0B0E14] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
                
                {scannerSuccess ? (
                  <div className="absolute inset-0 z-50 bg-emerald-500/10 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-emerald-500 text-white p-4 rounded-full mb-4 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                      <Check className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter text-white">Order Updated!</h3>
                    <p className="text-emerald-400 font-bold text-sm">#{scannerSuccess.split('-')[1]}</p>
                  </div>
                ) : null}
                
                <button 
                  onClick={() => setScannerMode(true)}
                  className="w-full aspect-[3/1] bg-black border-2 border-dashed border-white/10 rounded-3xl md:rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group-hover:scale-[1.02] duration-300"
                >
                  <Camera className="w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-3 text-purple-500" />
                  <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">Tap to Scan Bar code</span>
                </button>
              </div>

              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mt-10 md:mt-16 w-full max-w-2xl">
                <div className="flex-1 bg-[#131823] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-8 text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3">Total Scanned Today</p>
                  <p className="text-3xl md:text-5xl font-black italic text-white tracking-tighter">
                    {orders.filter(o => o.status === OrderStatus.COMPLETED && new Date(o.createdAt).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <div className="flex-1 bg-[#131823] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-8 text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3">Avg. Processing Time</p>
                  <p className="text-3xl md:text-5xl font-black italic text-white tracking-tighter">
                    {orders.filter(o => o.status === OrderStatus.COMPLETED && new Date(o.createdAt).toDateString() === new Date().toDateString()).length > 0 
                      ? Math.round(orders.filter(o => o.status === OrderStatus.COMPLETED && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((acc, o) => acc + (o.estimatedFinishTime - o.createdAt), 0) / orders.filter(o => o.status === OrderStatus.COMPLETED && new Date(o.createdAt).toDateString() === new Date().toDateString()).length / 60000) 
                      : 0}m
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-3xl font-black italic tracking-tighter text-white">Order History.</h2>
                <div className="bg-[#131823] px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center shadow-sm">
                   <History className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 md:mr-2" /> Past 24 Hours
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED).length === 0 ? (
                  <div className="py-16 md:py-32 text-center bg-[#131823] rounded-2xl md:rounded-[3rem] border-2 border-dashed border-white/5">
                    <History className="w-12 h-12 md:w-16 md:h-16 text-slate-600 mx-auto mb-4 md:mb-6" />
                    <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px] md:text-xs">No past orders</p>
                  </div>
                ) : (
                  orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="bg-[#131823] p-5 md:p-8 rounded-2xl md:rounded-[3rem] border border-white/5 shadow-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all group cursor-pointer flex flex-col opacity-70 hover:opacity-100"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-8 border-b border-white/5 pb-4 md:pb-6">
                        <div className="flex items-center space-x-4 md:space-x-6 text-left">
                           <div className="bg-black border border-white/10 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center text-white font-black italic shrink-0 text-sm md:text-base">
                             #{order.id.split('-')[1]}
                           </div>
                           <div>
                              <h4 className="text-base md:text-xl font-black text-white italic tracking-tight">{order.userName}</h4>
                              <div className="flex items-center space-x-2 md:space-x-3 mt-0.5 md:mt-1">
                                 <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                                   {order.status}
                                 </span>
                                 <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-3">
                           <div className="p-2 md:p-3 bg-black border border-white/5 rounded-xl md:rounded-2xl text-slate-400 group-hover:text-white transition-all">
                             <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-col text-left">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3 flex items-center">
                          <Utensils className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 md:mr-2 text-slate-400" /> Items Prepared
                        </p>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                           {order.items.map((item: any, idx: number) => (
                             <div key={idx} className="bg-black border border-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl flex items-center space-x-1.5 md:space-x-2">
                               <span className="text-[10px] md:text-[11px] font-black text-white italic">{item.quantity}x</span>
                               <span className="text-[10px] md:text-[11px] font-bold text-slate-400 italic">{item.name}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-4 md:gap-6">
                <h2 className="text-xl md:text-3xl font-black italic tracking-tighter text-white">Menu Vault.</h2>
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <div className="relative w-full md:w-96">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5 md:w-4 md:h-4" />
                     <input 
                       type="text" 
                       placeholder="Search vault..." 
                       className="w-full pl-10 md:pl-12 pr-5 md:pr-6 py-3 md:py-4 bg-[#131823] border border-white/5 rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-bold shadow-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 transition-all"
                       value={menuSearch}
                       onChange={(e) => setMenuSearch(e.target.value)}
                     />
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem({ id: 'new' } as FoodItem);
                      setEditForm({ name: '', price: 0, image: '', description: '', stock: 0, category: 'ALL' });
                    }}
                    className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                  >
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Add Item</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredMenu.map(item => (
                  <div key={item.id} className="bg-[#131823] rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all flex flex-col">
                    <div className="relative h-32 md:h-40 shrink-0">
                       <img src={item.image} className={`w-full h-full object-cover transition-all duration-500 ${!item.isAvailable && 'grayscale opacity-60'}`} alt={item.name} />
                       <button 
                         onClick={() => toggleItemAvailability(item.id)}
                         className={`absolute top-2 md:top-4 right-2 md:right-4 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 ${item.isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                       >
                         {item.isAvailable ? <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <PowerOff className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                       </button>
                       <button 
                         onClick={() => {
                           setEditingItem(item);
                           setEditForm({ name: item.name, price: item.price, image: item.image, description: item.description, stock: item.stock || 0, category: item.category || 'ALL' });
                         }}
                         className="absolute top-2 md:top-4 left-2 md:left-4 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 bg-blue-500 text-white hover:bg-blue-400"
                       >
                         <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                       </button>
                    </div>
                    <div className="p-4 md:p-6 space-y-3 md:space-y-4 flex-1 flex flex-col text-left">
                       <div className="flex justify-between items-start">
                          <h4 className="font-black text-white italic text-sm md:text-lg leading-tight">{item.name}</h4>
                          <span className="text-xs md:text-sm font-black text-white">₹{item.price}</span>
                       </div>
                       <p className="text-[8px] md:text-[10px] text-slate-400 font-bold italic line-clamp-2">{item.description}</p>
                       <div className="flex items-center justify-between pt-3 md:pt-4 mt-auto border-t border-white/5">
                          <div className="flex items-center text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                             <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 md:mr-1.5" /> {item.estimatedTime}m Prep
                          </div>
                          <div className="flex items-center text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                             <Package className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 md:mr-1.5" /> Stock: {item.stock || 0}
                          </div>
                          <div className={`flex items-center text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] ${item.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {item.isAvailable ? 'Online' : 'Offline'}
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-[600] flex items-end md:items-center justify-center p-0 md:p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setSelectedOrder(null)}></div>
           <div className="relative w-full max-w-lg bg-[#0B0E14] rounded-t-3xl md:rounded-[4rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500 border border-white/10 flex flex-col h-[85vh] md:h-auto md:max-h-[85vh]">
              <div className="bg-[#131823] p-6 md:p-10 text-white shrink-0 relative text-left border-b border-white/5">
                 <button onClick={() => setSelectedOrder(null)} className="absolute top-6 md:top-8 right-6 md:right-8 text-slate-400 hover:text-white transition-all bg-white/5 p-2 rounded-full">
                   <X className="w-5 h-5 md:w-6 md:h-6" />
                 </button>
                 <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-1 md:mb-2">Ticket Summary</p>
                 <h3 className="text-2xl md:text-4xl font-black italic tracking-tighter">ORD-#{selectedOrder.id.split('-')[1]}</h3>
              </div>
              <div className="p-6 md:p-10 flex-1 overflow-y-auto no-scrollbar space-y-6 md:space-y-10 text-left">
                 <div>
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Customer & Items</p>
                    <div className="space-y-4 md:space-y-6">
                       {selectedOrder.items.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center group">
                            <div className="flex items-center space-x-4">
                               <div className="bg-black w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xs italic border border-white/10 group-hover:bg-purple-600/20 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all">
                                 {item.quantity}x
                               </div>
                               <span className="font-black text-white italic text-lg">{item.name}</span>
                            </div>
                            <span className="text-sm font-black text-slate-400">₹{item.price * item.quantity}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-black p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-white/5 flex items-center justify-between">
                    <div className="text-left">
                       <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Status History</p>
                       <p className="text-lg md:text-xl font-black text-white italic tracking-tighter capitalize">{selectedOrder.status}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Total Bill</p>
                       <p className="text-lg md:text-xl font-black text-white">₹{selectedOrder.totalAmount}.00</p>
                    </div>
                 </div>
              </div>
              <div className="p-6 md:p-8 bg-[#131823] border-t border-white/5 shrink-0 flex flex-col gap-3">
                 {selectedOrder.status === OrderStatus.PEND_BOOKED && (
                   <button onClick={() => { handleProcessStatusChange(selectedOrder); setSelectedOrder(null); }} className="w-full py-4 bg-amber-500 text-white rounded-xl md:rounded-[2.5rem] text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                     <Play className="w-3.5 h-3.5 mr-2" /> Start Preparing
                   </button>
                 )}
                 {selectedOrder.status === OrderStatus.PREPARING && (
                   <button onClick={() => { handleProcessStatusChange(selectedOrder); setSelectedOrder(null); }} className="w-full py-4 bg-orange-600 text-white rounded-xl md:rounded-[2.5rem] text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                     <Check className="w-3.5 h-3.5 mr-2" /> Mark as Ready
                   </button>
                 )}
                 {selectedOrder.status === OrderStatus.READY && (
                   <button onClick={() => { handleProcessStatusChange(selectedOrder); setSelectedOrder(null); }} className="w-full py-4 bg-emerald-600 text-white rounded-xl md:rounded-[2.5rem] text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center">
                     <UserCheck className="w-3.5 h-3.5 mr-2" /> Complete Handover
                   </button>
                 )}
                 <button onClick={() => setSelectedOrder(null)} className="w-full py-5 md:py-7 bg-black text-white font-black rounded-xl md:rounded-[2.5rem] uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs border border-white/10 hover:bg-gray-900 transition-all shadow-[0_10px_30px_rgba(168,85,247,0.1)]">Close Details</button>
              </div>
           </div>
        </div>
      )}

      {scannerMode && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => !isScanning && setScannerMode(false)}></div>
           <div className="relative w-full max-w-2xl bg-black rounded-[4rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col aspect-video">
              <button 
                onClick={() => !isScanning && setScannerMode(false)}
                className="absolute top-6 right-6 z-50 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <div id="reader-container" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="relative z-10 w-64 h-64 border-2 border-emerald-500/50 rounded-[3rem] flex items-center justify-center pointer-events-none">
                  <div className="w-full h-1 bg-emerald-500/80 absolute animate-[bounce_2s_infinite]"></div>
                  {isScanning && <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />}
                </div>
                <div className="absolute bottom-10 z-20 pointer-events-none">
                   <div className="bg-emerald-600/80 backdrop-blur-md text-white px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center shadow-2xl">
                     <Loader2 className="w-5 h-5 animate-spin mr-3" />
                     Scanning Automatically...
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setEditingItem(null)}></div>
          <div className="relative w-full max-w-md bg-[#131823] rounded-3xl p-6 border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-black italic text-white mb-4">{editingItem.id === 'new' ? 'Add Item' : 'Edit Item'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (₹)</label>
                <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</label>
                <input type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image URL</label>
                <input type="text" value={editForm.image} onChange={e => setEditForm({...editForm, image: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500">
                  {["ALL", "MORNING TIFFIN", "MAIN COURSE", "SNACKS", "BEVERAGES", "DESSERTS", "HEALTHY", "CONTINENTAL", "GLOBAL FUSION", "ARTISAN BREADS"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm h-20 outline-none focus:border-purple-500" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setEditingItem(null)} className="flex-1 py-3 bg-white/5 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleSaveItemEdit} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-500 transition-all">{editingItem.id === 'new' ? 'Add Item' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default StaffPortal;
