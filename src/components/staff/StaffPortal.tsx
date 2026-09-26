import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, OrderStatus, FoodItem, User, RawIngredient, StockMovement, AppNotification, MovementType } from '../../types';
import { STATUS_COLORS } from '../../constants';
import { api } from '../../services/api/apiClient';
import { Html5Qrcode } from 'html5-qrcode';
import { ThemeSelector } from '../common/ThemeSelector';
import { UserProfileDropdown } from '../layout/UserProfileDropdown';
import { UserManagementView } from './UserManagementView';
import { FoodItemManagementView } from './FoodItemManagementView';
import {
  Check, Play, Search, Plus,
  Monitor, LayoutGrid, X,
  UserCheck, Scan, TrendingUp, Zap, Users,
  Clock, Edit3, Calendar, CheckCircle2, ChevronRight, ChevronLeft, Utensils, Coffee, History, Package, 
  LogOut as LogOutIcon, ShoppingCart, Minus, Camera, Loader2, AlertCircle, Flame, BarChart3, 
  Globe, PowerOff, Bell, Shield, Filter, FileText, Download, Printer, RefreshCw, Layers, 
  ArrowUpRight, ArrowDownRight, Tag, Lock, AlertTriangle, User as UserIcon, HelpCircle, 
  PhoneCall, ChevronDown, CheckSquare, Square, Eye, Menu as MenuIcon
} from 'lucide-react';

interface StaffPortalProps {
  currentUser?: User | null;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, extra?: Partial<Order>) => void;
  menuItems: FoodItem[];
  onUpdateMenu: (menu: FoodItem[]) => void;
  onLogout: () => void;
  onUserUpdated?: (user: User) => void;
  onSwitchToOrdering?: () => void;
  userRole?: string;
}

export type KitchenTabType = 
  | 'dashboard' 
  | 'orders' 
  | 'preparation' 
  | 'ready' 
  | 'completed' 
  | 'menu' 
  | 'inventory' 
  | 'stock-movements' 
  | 'reports' 
  | 'notifications' 
  | 'users'
  | 'profile' 
  | 'support' 
  | 'pos';

interface RestockControlProps {
  item: FoodItem;
  currentUser?: User | null;
  onUpdateMenu: (menu: FoodItem[]) => void;
  triggerToastSuccess: (msg: string) => void;
  triggerToastError: (msg: string) => void;
}

const RestockControl: React.FC<RestockControlProps> = ({
  item,
  currentUser,
  onUpdateMenu,
  triggerToastSuccess,
  triggerToastError
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateQuantity = (valStr: string): { isValid: boolean; numValue?: number; error?: string } => {
    const trimmed = valStr.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a restock quantity.' };
    }
    const num = Number(trimmed);
    if (isNaN(num)) {
      return { isValid: false, error: 'Restock quantity must be a positive whole number.' };
    }
    if (num <= 0) {
      return { isValid: false, error: 'Restock quantity must be greater than 0.' };
    }
    if (!Number.isInteger(num)) {
      return { isValid: false, error: 'Please enter a whole number.' };
    }
    if (num > 100000) {
      return { isValid: false, error: 'Quantity exceeds maximum allowable limit.' };
    }
    return { isValid: true, numValue: num };
  };

  const handleRestock = async () => {
    setErrorMessage(null);
    const validation = validateQuantity(quantity);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid quantity.');
      triggerToastError(validation.error || 'Invalid quantity.');
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const numToAdd = validation.numValue!;
      const updatedMenu = await api.restockFoodItem(
        item.id,
        numToAdd,
        currentUser?.name || 'Kitchen Staff',
        currentUser?.role
      );
      onUpdateMenu(updatedMenu);
      triggerToastSuccess(`Restocked +${numToAdd} ${item.name}!`);
      setQuantity('');
    } catch (err: any) {
      const msg = err?.message || 'Failed to restock food item.';
      setErrorMessage(msg);
      triggerToastError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAdd = (amount: number) => {
    setErrorMessage(null);
    const currentVal = parseInt(quantity, 10);
    const newQty = (isNaN(currentVal) || currentVal <= 0 ? 0 : currentVal) + amount;
    setQuantity(String(newQty));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRestock();
    }
  };

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`restock-input-${item.id}`}
          className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
        >
          RESTOCK
        </label>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          id={`restock-input-${item.id}`}
          type="number"
          min="1"
          step="1"
          placeholder="Quantity"
          value={quantity}
          disabled={isProcessing}
          onChange={(e) => {
            setQuantity(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          onKeyDown={handleKeyDown}
          aria-label={`Restock quantity for ${item.name}`}
          className={`w-full min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border ${
            errorMessage
              ? 'border-rose-500 focus:ring-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-orange-500 text-slate-900 dark:text-white'
          } placeholder-slate-400 shadow-xs outline-none focus:ring-1 transition-all disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={handleRestock}
          disabled={isProcessing}
          aria-label={`Add ${quantity || ''} units of ${item.name} to stock`}
          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-orange-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
        >
          {isProcessing ? 'Adding...' : 'Add Stock'}
        </button>
      </div>

      {errorMessage && (
        <p className="text-[10px] font-medium text-rose-500 dark:text-rose-400 animate-fadeIn">
          {errorMessage}
        </p>
      )}

      {/* Quick Add Shortcuts */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[9px] font-bold text-slate-400 uppercase">Quick:</span>
        <div className="flex items-center gap-1">
          {[10, 25, 50].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={isProcessing}
              onClick={() => handleQuickAdd(amt)}
              className="px-2 py-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400 text-slate-600 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer disabled:opacity-50"
            >
              +{amt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentUser,
  currentPath = '/kitchen',
  onNavigate,
  orders,
  onUpdateStatus,
  menuItems,
  onUpdateMenu,
  onLogout,
  onUserUpdated,
  userRole
}) => {
  // Determine active tab from URL route or internal state
  const getTabFromPath = (path: string): KitchenTabType => {
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/preparation')) return 'preparation';
    if (path.includes('/ready')) return 'ready';
    if (path.includes('/completed')) return 'completed';
    if (path.includes('/menu')) return 'menu';
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/stock-movements')) return 'stock-movements';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/users') || path.includes('/user-management')) return 'users';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/support')) return 'support';
    if (path.includes('/pos')) return 'pos';
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<KitchenTabType>(getTabFromPath(currentPath));

  useEffect(() => {
    setActiveTabState(getTabFromPath(currentPath));
  }, [currentPath]);

  const changeTab = (tab: KitchenTabType) => {
    setActiveTabState(tab);
    if (onNavigate) {
      const targetPath = tab === 'dashboard' ? '/kitchen' : tab === 'pos' ? '/pos' : `/kitchen/${tab}`;
      onNavigate(targetPath);
    }
  };

  // State Management
  const [kitchenStatus, setKitchenStatus] = useState<'Online' | 'Busy' | 'Offline'>('Online');
  const [ingredients, setIngredients] = useState<RawIngredient[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected Order Modal / Slip State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printSlipOrder, setPrintSlipOrder] = useState<Order | null>(null);

  // Filter & Search States for Orders
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderCustomerTypeFilter, setOrderCustomerTypeFilter] = useState<string>('ALL');
  const [orderSortBy, setOrderSortBy] = useState<'NEWEST' | 'OLDEST' | 'PREP_TIME'>('NEWEST');

  // Menu Search & Category State
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: 0,
    category: 'Breakfast',
    image: '',
    description: '',
    estimatedTime: 15,
    stock: 20
  });

  // Inventory & Stock Modals
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: 'kg' as RawIngredient['unit'],
    currentStock: 10,
    minThreshold: 5,
    unitCost: 50,
    category: 'Vegetables'
  });

  const [adjustingIngredient, setAdjustingIngredient] = useState<RawIngredient | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustType, setAdjustType] = useState<MovementType>('Adjustment');

  // Raw Ingredient View & Edit Modals State
  const [viewingIngredient, setViewingIngredient] = useState<RawIngredient | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<RawIngredient | null>(null);
  const [editIngredientForm, setEditIngredientForm] = useState({
    name: '',
    category: 'Vegetables',
    unit: 'kg',
    minThreshold: 10,
    unitCost: 50,
    supplier: '',
    storageLocation: '',
    description: ''
  });

  const handleOpenEditIngredient = (ing: RawIngredient) => {
    setEditingIngredient(ing);
    setEditIngredientForm({
      name: ing.name,
      category: ing.category || 'Vegetables',
      unit: ing.unit,
      minThreshold: ing.minThreshold,
      unitCost: ing.unitCost,
      supplier: ing.supplier || '',
      storageLocation: ing.storageLocation || '',
      description: ing.description || ''
    });
  };

  const handleSaveEditIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;

    if (!editIngredientForm.name.trim()) {
      triggerToastError("Please enter an ingredient name.");
      return;
    }
    if (editIngredientForm.minThreshold < 0) {
      triggerToastError("Minimum threshold cannot be negative.");
      return;
    }
    if (editIngredientForm.unitCost < 0) {
      triggerToastError("Unit cost cannot be negative.");
      return;
    }

    const exists = ingredients.some(
      i => i.id !== editingIngredient.id && i.name.trim().toLowerCase() === editIngredientForm.name.trim().toLowerCase()
    );
    if (exists) {
      triggerToastError(`An ingredient named "${editIngredientForm.name}" already exists.`);
      return;
    }

    try {
      const updatedIng: RawIngredient = {
        ...editingIngredient,
        name: editIngredientForm.name.trim(),
        category: editIngredientForm.category,
        unit: editIngredientForm.unit,
        minThreshold: editIngredientForm.minThreshold,
        unitCost: editIngredientForm.unitCost,
        supplier: editIngredientForm.supplier.trim() || undefined,
        storageLocation: editIngredientForm.storageLocation.trim() || undefined,
        description: editIngredientForm.description.trim() || undefined,
        updatedAt: Date.now(),
        updatedBy: currentUser?.name || 'Kitchen Staff'
      };

      const updatedList = await api.updateIngredient(updatedIng);
      setIngredients(updatedList);
      triggerToastSuccess(`Ingredient "${updatedIng.name}" updated successfully!`);

      api.addStockMovement({
        ingredientId: updatedIng.id,
        ingredientName: updatedIng.name,
        type: 'ADJUSTMENT',
        quantity: 0,
        previousStock: updatedIng.currentStock,
        newStock: updatedIng.currentStock,
        reference: `EDIT-${Date.now()}`,
        user: currentUser?.name || 'Kitchen Staff',
        notes: `Updated ingredient metadata (Threshold: ${updatedIng.minThreshold}, Cost: ₹${updatedIng.unitCost}/${updatedIng.unit})`
      });

      setEditingIngredient(null);
      if (viewingIngredient && viewingIngredient.id === updatedIng.id) {
        setViewingIngredient(updatedIng);
      }
    } catch (err: any) {
      triggerToastError(err?.message || "Failed to update ingredient.");
    }
  };

  // Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || 'Kitchen Staff',
    email: currentUser?.email || 'staff@cravecanteen.com',
    phoneNumber: currentUser?.phoneNumber || '+919876543210',
    department: currentUser?.department || 'Kitchen Operations'
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ currentPass: '', newPass: '', confirmPass: '' });

  // Support Tickets State & View Filters (Kitchen Support Tickets Portal)
  const [viewingSupportTicket, setViewingSupportTicket] = useState<null | {
    id: string;
    issueType: string;
    orderRef?: string;
    priority: 'Urgent' | 'High' | 'Medium' | 'Low';
    description: string;
    createdAt: number;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    submittedBy: string;
    userRole: string;
  }>(null);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [supportPriorityFilter, setSupportPriorityFilter] = useState<'ALL' | 'Urgent' | 'High' | 'Medium' | 'Low'>('ALL');
  const [supportTickets, setSupportTickets] = useState<Array<{
    id: string;
    issueType: string;
    orderRef?: string;
    priority: 'Urgent' | 'High' | 'Medium' | 'Low';
    description: string;
    createdAt: number;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    submittedBy: string;
    userRole: string;
  }>>([
    {
      id: 'TK-9042',
      issueType: 'Payment / Wallet Deduction Error',
      orderRef: '#CC202509250012',
      priority: 'High',
      description: 'Wallet deducted ₹180 but order status shows unpaid at counter checkout.',
      createdAt: Date.now() - 3600000 * 2,
      status: 'OPEN',
      submittedBy: 'Rahul Sharma',
      userRole: 'Student'
    },
    {
      id: 'TK-8421',
      issueType: 'Kitchen Equipment / Hardware',
      orderRef: '-',
      priority: 'High',
      description: 'Thermal receipt printer paper jam and Bluetooth connectivity error at Counter #2.',
      createdAt: Date.now() - 3600000 * 5,
      status: 'IN_PROGRESS',
      submittedBy: currentUser?.name || 'Kitchen Staff',
      userRole: 'Staff'
    },
    {
      id: 'TK-7815',
      issueType: 'Order Delay / Missing Items',
      orderRef: '#CC202509250045',
      priority: 'Medium',
      description: 'Ordered 2 Chole Bhature; only 1 packet received at pickup counter.',
      createdAt: Date.now() - 3600000 * 8,
      status: 'OPEN',
      submittedBy: 'Prof. Ananya Sen',
      userRole: 'Faculty'
    },
    {
      id: 'TK-7193',
      issueType: 'KDS Software Bug',
      orderRef: '-',
      priority: 'Low',
      description: 'Order queue delay refresh taking 2 seconds longer during peak lunch hours.',
      createdAt: Date.now() - 3600000 * 24,
      status: 'RESOLVED',
      submittedBy: 'Kitchen Operations',
      userRole: 'Staff'
    },
    {
      id: 'TK-6520',
      issueType: 'Food Quality / Temperature Issue',
      orderRef: '#CC202509250008',
      priority: 'Medium',
      description: 'Cold soup delivered at counter, requested replacement or refund.',
      createdAt: Date.now() - 3600000 * 36,
      status: 'RESOLVED',
      submittedBy: 'Amit Kumar',
      userRole: 'Student'
    }
  ]);

  const handleUpdateTicketStatus = (ticketId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    triggerToastSuccess(`Ticket #${ticketId} status updated to ${newStatus.replace('_', ' ')}!`);
  };

  const filteredSupportTickets = useMemo(() => {
    return supportTickets.filter(ticket => {
      if (supportStatusFilter !== 'ALL' && ticket.status !== supportStatusFilter) return false;
      if (supportPriorityFilter !== 'ALL' && ticket.priority !== supportPriorityFilter) return false;
      if (supportSearchQuery.trim()) {
        const q = supportSearchQuery.trim().toLowerCase();
        const idMatch = ticket.id.toLowerCase().includes(q);
        const catMatch = ticket.issueType.toLowerCase().includes(q);
        const userMatch = ticket.submittedBy.toLowerCase().includes(q);
        const descMatch = ticket.description.toLowerCase().includes(q);
        const orderMatch = (ticket.orderRef || '').toLowerCase().includes(q);
        if (!idMatch && !catMatch && !userMatch && !descMatch && !orderMatch) return false;
      }
      return true;
    });
  }, [supportTickets, supportSearchQuery, supportStatusFilter, supportPriorityFilter]);

  // POS State
  const [posCart, setPosCart] = useState<{ food: FoodItem; quantity: number }[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCustomerType, setPosCustomerType] = useState<'Student' | 'Faculty' | 'Walk-in'>('Student');
  const [posCustomerName, setPosCustomerName] = useState('Walk-in Customer');
  const [posPaymentMethod, setPosPaymentMethod] = useState<Order['paymentMethod']>('CASH');
  const [isPosProcessing, setIsPosProcessing] = useState(false);
  const [posSuccessMsg, setPosSuccessMsg] = useState<string | null>(null);

  // Kitchen Reports Module State & Handlers
  const [reportSubTab, setReportSubTab] = useState<'sales' | 'food' | 'inventory' | 'stock-movements' | 'performance'>('sales');
  const [reportSearchInput, setReportSearchInput] = useState('');
  const [appliedReportSearch, setAppliedReportSearch] = useState('');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [quickDateFilter, setQuickDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('ALL');
  const [reportSortField, setReportSortField] = useState<string>('date');
  const [reportSortOrder, setReportSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reportCurrentPage, setReportCurrentPage] = useState<number>(1);
  const reportItemsPerPage = 10;

  const handleQuickDateSelect = (rangeType: 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH') => {
    setQuickDateFilter(rangeType);
    setReportCurrentPage(1);

    const now = new Date();
    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (rangeType === 'ALL') {
      setReportFromDate('');
      setReportToDate('');
    } else if (rangeType === 'TODAY') {
      const todayStr = formatDate(now);
      setReportFromDate(todayStr);
      setReportToDate(todayStr);
    } else if (rangeType === 'YESTERDAY') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatDate(yest);
      setReportFromDate(yestStr);
      setReportToDate(yestStr);
    } else if (rangeType === 'LAST_7_DAYS') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      setReportFromDate(formatDate(past7));
      setReportToDate(formatDate(now));
    } else if (rangeType === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setReportFromDate(formatDate(firstDay));
      setReportToDate(formatDate(now));
    } else if (rangeType === 'LAST_MONTH') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setReportFromDate(formatDate(firstDayLastMonth));
      setReportToDate(formatDate(lastDayLastMonth));
    }
  };

  const handleApplyReportFilters = () => {
    setAppliedReportSearch(reportSearchInput);
    setReportCurrentPage(1);
  };

  const handleResetReportFilters = () => {
    setReportSearchInput('');
    setAppliedReportSearch('');
    setReportFromDate('');
    setReportToDate('');
    setQuickDateFilter('ALL');
    setReportSortField('date');
    setReportSortOrder('desc');
    setReportCurrentPage(1);
  };

  const isInDateRange = (timestamp: number) => {
    if (reportFromDate) {
      const fromMs = new Date(`${reportFromDate}T00:00:00.000`).getTime();
      if (isNaN(fromMs) || timestamp < fromMs) return false;
    }
    if (reportToDate) {
      const toMs = new Date(`${reportToDate}T23:59:59.999`).getTime();
      if (isNaN(toMs) || timestamp > toMs) return false;
    }
    return true;
  };

  const queryTerm = appliedReportSearch.trim().toLowerCase();

  // 1. Sales & Orders Report Data
  const filteredSalesOrders = useMemo(() => {
    return orders.filter(order => {
      if (!isInDateRange(order.createdAt)) return false;
      if (queryTerm) {
        const orderIdMatch = order.id.toLowerCase().includes(queryTerm);
        const customerMatch = (order.userName || '').toLowerCase().includes(queryTerm) || (order.userId || '').toLowerCase().includes(queryTerm);
        const statusMatch = order.status.toLowerCase().includes(queryTerm);
        const payStatusMatch = (order.paymentStatus || '').toLowerCase().includes(queryTerm);
        const payMethodMatch = (order.paymentMethod || '').toLowerCase().includes(queryTerm);
        const itemsMatch = order.items.some(item => item.name.toLowerCase().includes(queryTerm));
        if (!orderIdMatch && !customerMatch && !statusMatch && !payStatusMatch && !payMethodMatch && !itemsMatch) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (reportSortField === 'amount') {
        return reportSortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
      }
      if (reportSortField === 'id') {
        return reportSortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
      }
      return reportSortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
    });
  }, [orders, reportFromDate, reportToDate, appliedReportSearch, reportSortField, reportSortOrder]);

  // 2. Food Performance Data
  const filteredFoodPerformance = useMemo(() => {
    const ordersInRange = orders.filter(o => isInDateRange(o.createdAt));
    return menuItems.map(item => {
      const unitsSold = ordersInRange.reduce((acc, o) => {
        const matchedItem = o.items.find(i => i.foodId === item.id || i.name === item.name);
        return acc + (matchedItem ? matchedItem.quantity : 0);
      }, 0);
      const totalRevenue = unitsSold * item.price;
      const stockQty = item.stockQuantity ?? item.stock ?? 0;
      const reservedQty = item.reservedQuantity || 0;
      const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);

      return {
        ...item,
        unitsSold,
        totalRevenue,
        availQty
      };
    }).filter(item => {
      if (queryTerm) {
        const nameMatch = item.name.toLowerCase().includes(queryTerm);
        const codeMatch = (item.itemCode || '').toLowerCase().includes(queryTerm);
        const catMatch = item.category.toLowerCase().includes(queryTerm);
        const mealMatch = (item.mealTime || '').toLowerCase().includes(queryTerm);
        const typeMatch = (item.foodType || '').toLowerCase().includes(queryTerm);
        if (!nameMatch && !codeMatch && !catMatch && !mealMatch && !typeMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      if (reportSortField === 'units') {
        return reportSortOrder === 'asc' ? a.unitsSold - b.unitsSold : b.unitsSold - a.unitsSold;
      }
      if (reportSortField === 'revenue') {
        return reportSortOrder === 'asc' ? a.totalRevenue - b.totalRevenue : b.totalRevenue - a.totalRevenue;
      }
      if (reportSortField === 'name') {
        return reportSortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return reportSortOrder === 'asc' ? a.unitsSold - b.unitsSold : b.unitsSold - a.unitsSold;
    });
  }, [menuItems, orders, reportFromDate, reportToDate, appliedReportSearch, reportSortField, reportSortOrder]);

  // 3. Stock & Inventory Status Data
  const filteredInventoryStatus = useMemo(() => {
    const foodList = menuItems.map(m => {
      const stockQty = m.stockQuantity ?? m.stock ?? 0;
      const reservedQty = m.reservedQuantity || 0;
      const availQty = m.availableQuantity !== undefined ? m.availableQuantity : Math.max(0, stockQty - reservedQty);
      const minLevel = m.minimumStockLevel ?? 10;
      let status = 'AVAILABLE';
      if (availQty <= 0 || !m.isAvailable) status = 'OUT OF STOCK';
      else if (availQty <= minLevel) status = 'LOW STOCK';

      return {
        id: m.id,
        name: m.name,
        type: 'Food Item',
        detail: `${m.category} • ${m.foodType || 'Veg'}`,
        stock: availQty,
        minThreshold: minLevel,
        unit: m.unit || 'units',
        status,
        timestamp: typeof m.updatedAt === 'number' ? m.updatedAt : (m.updatedAt ? new Date(m.updatedAt).getTime() : Date.now())
      };
    });

    const ingredientList = ingredients.map(ing => {
      let status = 'AVAILABLE';
      if (ing.currentStock <= 0) status = 'OUT OF STOCK';
      else if (ing.currentStock <= ing.minThreshold) status = 'LOW STOCK';

      return {
        id: ing.id,
        name: ing.name,
        type: 'Raw Ingredient',
        detail: ing.category || 'Kitchen Ingredient',
        stock: ing.currentStock,
        minThreshold: ing.minThreshold,
        unit: ing.unit,
        status,
        timestamp: Date.now()
      };
    });

    const combined = [...foodList, ...ingredientList];

    return combined.filter(item => {
      if (!isInDateRange(item.timestamp)) return false;
      if (queryTerm) {
        const nameMatch = item.name.toLowerCase().includes(queryTerm);
        const typeMatch = item.type.toLowerCase().includes(queryTerm);
        const detailMatch = item.detail.toLowerCase().includes(queryTerm);
        const statusMatch = item.status.toLowerCase().includes(queryTerm);
        if (!nameMatch && !typeMatch && !detailMatch && !statusMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      if (reportSortField === 'stock') {
        return reportSortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock;
      }
      return reportSortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
  }, [menuItems, ingredients, reportFromDate, reportToDate, appliedReportSearch, reportSortField, reportSortOrder]);

  // 4. Stock Movements Log Data
  const filteredStockMovements = useMemo(() => {
    return stockMovements.filter(mv => {
      if (!isInDateRange(mv.timestamp)) return false;
      if (queryTerm) {
        const itemMatch = (mv.itemName || '').toLowerCase().includes(queryTerm);
        const idMatch = (mv.itemId || '').toLowerCase().includes(queryTerm);
        const typeMatch = (mv.type || '').toLowerCase().includes(queryTerm);
        const refMatch = (mv.reference || '').toLowerCase().includes(queryTerm);
        const userMatch = (mv.user || '').toLowerCase().includes(queryTerm);
        const notesMatch = (mv.notes || '').toLowerCase().includes(queryTerm);
        if (!itemMatch && !idMatch && !typeMatch && !refMatch && !userMatch && !notesMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      return reportSortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });
  }, [stockMovements, reportFromDate, reportToDate, appliedReportSearch, reportSortOrder]);

  // 5. Kitchen Performance Data
  const filteredPerformanceOrders = useMemo(() => {
    return orders.filter(order => {
      if (!isInDateRange(order.createdAt)) return false;
      if (queryTerm) {
        const orderIdMatch = order.id.toLowerCase().includes(queryTerm);
        const customerMatch = (order.userName || '').toLowerCase().includes(queryTerm);
        const statusMatch = (order.status || '').toLowerCase().includes(queryTerm);
        const itemsMatch = order.items.some(item => item.name.toLowerCase().includes(queryTerm));
        if (!orderIdMatch && !customerMatch && !statusMatch && !itemsMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      return reportSortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
    });
  }, [orders, reportFromDate, reportToDate, appliedReportSearch, reportSortOrder]);

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const filename = `CraveCanteen_${reportSubTab}_report_${new Date().toISOString().split('T')[0]}`;

    if (reportSubTab === 'sales') {
      headers = ['Date & Time', 'Order ID', 'Customer Name', 'Items Summary', 'Item Count', 'Total Amount', 'Payment Method', 'Payment Status', 'Order Status'];
      rows = filteredSalesOrders.map(o => [
        new Date(o.createdAt).toLocaleString(),
        o.id,
        o.userName || 'Guest',
        o.items.map(i => `${i.name} (x${i.quantity})`).join('; '),
        o.items.reduce((sum, item) => sum + item.quantity, 0),
        `₹${o.totalAmount}`,
        o.paymentMethod || 'CASH',
        o.paymentStatus || 'PAID',
        o.status || ''
      ]);
    } else if (reportSubTab === 'food') {
      headers = ['Food Item', 'Category', 'Meal Time', 'Food Type', 'Units Sold', 'Total Revenue', 'Current Available Stock', 'Status'];
      rows = filteredFoodPerformance.map(f => [
        f.name,
        f.category,
        f.mealTime || 'All Day',
        f.foodType || 'Veg',
        f.unitsSold,
        `₹${f.totalRevenue}`,
        f.availQty,
        f.isAvailable && f.availQty > 0 ? 'AVAILABLE' : 'OUT OF STOCK'
      ]);
    } else if (reportSubTab === 'inventory') {
      headers = ['Item / Ingredient Name', 'Type', 'Category / Unit', 'Current Stock', 'Min Threshold', 'Stock Status'];
      rows = filteredInventoryStatus.map(i => [
        i.name,
        i.type,
        i.detail,
        `${i.stock} ${i.unit}`,
        `${i.minThreshold} ${i.unit}`,
        i.status
      ]);
    } else if (reportSubTab === 'stock-movements') {
      headers = ['Timestamp', 'Reference ID', 'Item Name', 'Movement Type', 'Qty Added/Removed', 'Previous Stock', 'New Stock', 'Performed By', 'Notes'];
      rows = filteredStockMovements.map(m => [
        new Date(m.timestamp).toLocaleString(),
        m.reference || '-',
        m.itemName || '',
        m.type || '',
        m.quantity > 0 ? `+${m.quantity}` : String(m.quantity),
        m.previousStock ?? 0,
        m.newStock ?? 0,
        m.user || 'Kitchen Staff',
        m.notes || ''
      ]);
    } else if (reportSubTab === 'performance') {
      headers = ['Order ID', 'Customer', 'Items', 'Order Placed', 'Prep Time (Est)', 'Order Status'];
      rows = filteredPerformanceOrders.map(o => [
        o.id,
        o.userName || 'Guest',
        o.items.map(i => `${i.name} (x${i.quantity})`).join('; '),
        new Date(o.createdAt).toLocaleTimeString(),
        `${o.items.length * 5 + 10} mins`,
        o.status || ''
      ]);
    }

    const csvContent = [
      `"CraveCanteen - Kitchen Operations Report (${reportSubTab.toUpperCase()})"`,
      `"From Date: ${reportFromDate || 'All Time'} | To Date: ${reportToDate || 'All Time'} | Search Query: ${appliedReportSearch || 'None'}"`,
      `"Generated At: ${new Date().toLocaleString()} | Total Filtered Records: ${rows.length}"`,
      "",
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // POS Sub-tab & Cash Counter Modal State
  const [posSubTab, setPosSubTab] = useState<'NEW_SALE' | 'PENDING_CASH'>('NEW_SALE');
  const [cashPaymentModalOrder, setCashPaymentModalOrder] = useState<Order | null>(null);
  const [cashReceivedAmount, setCashReceivedAmount] = useState<number>(0);

  // Scanner State
  const [scannerMode, setScannerMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Feedback Messages
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  const triggerToastSuccess = (msg: string) => {
    setToastSuccess(msg);
    setTimeout(() => setToastSuccess(null), 3500);
  };

  const triggerToastError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 4000);
  };

  // Real-time Subscriptions
  useEffect(() => {
    const unsubIngredients = api.subscribeToIngredients((ingList) => {
      setIngredients(ingList);
    });
    const unsubMovements = api.subscribeToStockMovements((mvList) => {
      setStockMovements(mvList);
    });
    const unsubNotifs = api.subscribeToKitchenNotifications((notifList) => {
      setNotifications(notifList);
    });
    const unsubStatus = api.subscribeToKitchenStatus((status) => {
      setKitchenStatus(status);
    });

    return () => {
      unsubIngredients();
      unsubMovements();
      unsubNotifs();
      unsubStatus();
    };
  }, []);

  // QR Code Scanner effect
  useEffect(() => {
    if (scannerMode && !isScanning) {
      const html5QrCode = new Html5Qrcode("reader-container");
      html5QrCodeRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const detectedId = decodedText.trim().toUpperCase();
          const matchedOrder = orders.find(o => o.id.toUpperCase() === detectedId || o.id.split('-')[1]?.toUpperCase() === detectedId);
          if (matchedOrder && !isScanning) {
            setIsScanning(true);
            handleAdvanceOrderStatus(matchedOrder);
          }
        },
        () => { }
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

  // Pending Cash Counter Orders
  const pendingCashOrders = useMemo(() => {
    return orders.filter(o => o.paymentStatus === 'PENDING' || (o.status as string) === 'Pending Payment');
  }, [orders]);

  // Strictly filter out unpaid cash orders from Kitchen KDS preparation views
  const kitchenPaidOrders = useMemo(() => {
    return orders.filter(o => o.paymentStatus === 'PAID' && (o.status as string) !== 'Pending Payment' && (o.status as string) !== 'Cart');
  }, [orders]);

  // Derived Metrics & Counters
  const newOrdersCount = useMemo(() => 
    kitchenPaidOrders.filter(o => ['Booked', 'Paid', 'Accepted'].includes(o.status as string)).length
  , [kitchenPaidOrders]);

  const inPrepOrdersCount = useMemo(() => 
    kitchenPaidOrders.filter(o => ['Accepted', 'Preparing'].includes(o.status as string)).length
  , [kitchenPaidOrders]);

  const readyOrdersCount = useMemo(() => 
    kitchenPaidOrders.filter(o => (o.status as string) === 'Ready').length
  , [kitchenPaidOrders]);

  const completedOrdersCount = useMemo(() => 
    kitchenPaidOrders.filter(o => ['Collected', 'Completed'].includes(o.status as string)).length
  , [kitchenPaidOrders]);

  const cancelledOrdersCount = useMemo(() => 
    orders.filter(o => (o.status as string) === 'Cancelled').length
  , [orders]);

  const totalSalesToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    return kitchenPaidOrders
      .filter(o => o.createdAt >= startOfDay.getTime() && (o.status as string) !== 'Cancelled' && (o.status as string) !== 'Refunded')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [kitchenPaidOrders]);

  const avgPrepTimeMins = useMemo(() => {
    const completedWithTime = orders.filter(o => ['Collected', 'Completed'].includes(o.status as string) && o.checkInTime);
    if (completedWithTime.length === 0) return 12;
    const totalMinutes = completedWithTime.reduce((acc, o) => {
      const durationMs = Math.max(0, o.estimatedFinishTime - (o.checkInTime || o.createdAt));
      return acc + (durationMs / 60000);
    }, 0);
    return Math.round(totalMinutes / completedWithTime.length) || 12;
  }, [orders]);

  const lowStockIngredientsCount = useMemo(() => 
    ingredients.filter(i => i.currentStock <= i.minThreshold).length
  , [ingredients]);

  const unreadNotificationsCount = useMemo(() => 
    notifications.filter(n => !n.read).length
  , [notifications]);

  // Handle Order State Transitions safely
  const handleAdvanceOrderStatus = async (order: Order, targetStatus?: OrderStatus) => {
    let nextStatus: OrderStatus = OrderStatus.ACCEPTED;

    if (targetStatus) {
      nextStatus = targetStatus;
    } else {
      const currentSt = order.status as string;
      if (['Booked', 'Paid', 'Pending Payment', 'Cart'].includes(currentSt)) {
        nextStatus = OrderStatus.ACCEPTED;
      } else if (currentSt === 'Accepted') {
        nextStatus = OrderStatus.PREPARING;
      } else if (currentSt === 'Preparing') {
        nextStatus = OrderStatus.READY;
      } else if (currentSt === 'Ready') {
        nextStatus = OrderStatus.COMPLETED;
      }
    }

    try {
      const extra: Partial<Order> = {};
      if (nextStatus === OrderStatus.PREPARING && !order.checkInTime) {
        extra.checkInTime = Date.now();
        extra.estimatedFinishTime = Date.now() + 15 * 60000;
      }
      
      await onUpdateStatus(order.id, nextStatus, extra);

      await api.addAuditLog({
        userId: currentUser?.id || 'staff-kds',
        userName: currentUser?.name || 'Kitchen Staff',
        userRole: currentUser?.role || 'STAFF',
        action: `ORDER_STATUS_${String(nextStatus).toUpperCase()}`,
        entity: 'Order',
        entityId: order.id,
        details: `Updated status from ${order.status} to ${nextStatus}`
      });

      triggerToastSuccess(`Order ${order.id} updated to ${nextStatus}`);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus, ...extra });
      }
    } catch (err: any) {
      triggerToastError(err?.message || "Failed to update order status");
    } finally {
      setIsScanning(false);
    }
  };

  // Menu Availability Toggle Handler
  const handleToggleMenuAvailability = async (item: FoodItem) => {
    const updated = menuItems.map(m => m.id === item.id ? { ...m, isAvailable: !m.isAvailable } : m);
    try {
      await api.updateMenu(updated);
      onUpdateMenu(updated);
      await api.addAuditLog({
        userId: currentUser?.id || 'staff-kds',
        userName: currentUser?.name || 'Kitchen Staff',
        userRole: currentUser?.role || 'STAFF',
        action: 'TOGGLE_MENU_AVAILABILITY',
        entity: 'FoodItem',
        entityId: item.id,
        details: `Set ${item.name} availability to ${!item.isAvailable}`
      });
      triggerToastSuccess(`${item.name} is now ${!item.isAvailable ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      triggerToastError("Failed to update menu item availability");
    }
  };

  // Add / Edit Menu Item Handler
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name.trim() || menuForm.price <= 0) {
      triggerToastError("Please fill out valid item details.");
      return;
    }

    if (editingItem) {
      const updatedList = menuItems.map(m => m.id === editingItem.id ? {
        ...m,
        name: menuForm.name,
        price: Number(menuForm.price),
        category: menuForm.category,
        image: menuForm.image || m.image,
        description: menuForm.description,
        estimatedTime: Number(menuForm.estimatedTime),
        stock: Number(menuForm.stock)
      } : m);
      await api.updateMenu(updatedList);
      onUpdateMenu(updatedList);
      setEditingItem(null);
      triggerToastSuccess(`Updated ${menuForm.name}`);
    } else {
      const newItem: FoodItem = {
        id: `m-${Date.now()}`,
        name: menuForm.name,
        price: Number(menuForm.price),
        category: menuForm.category,
        mealTime: menuForm.category.includes('Breakfast') ? 'Breakfast' : menuForm.category.includes('Lunch') ? 'Lunch' : menuForm.category.includes('Snack') ? 'Evening' : 'All Day',
        foodType: 'Veg',
        image: menuForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
        description: menuForm.description || 'Freshly prepared canteen meal.',
        estimatedTime: Number(menuForm.estimatedTime) || 15,
        isAvailable: true,
        stockQuantity: Number(menuForm.stock) || 20,
        stock: Number(menuForm.stock) || 20,
        availableQuantity: Number(menuForm.stock) || 20,
        minimumStockLevel: 5,
        nutrition: { calories: 300, protein: 12, carbs: 40, fat: 10 }
      };
      const updatedList = [newItem, ...menuItems];
      await api.updateMenu(updatedList);
      onUpdateMenu(updatedList);
      setShowAddItemModal(false);
      triggerToastSuccess(`Added new item ${menuForm.name}`);
    }
  };

  // Add Ingredient Handler
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientForm.name.trim()) return;
    try {
      const newIng = await api.addIngredient({
        name: ingredientForm.name.trim(),
        unit: ingredientForm.unit,
        currentStock: Number(ingredientForm.currentStock),
        minThreshold: Number(ingredientForm.minThreshold),
        unitCost: Number(ingredientForm.unitCost),
        category: ingredientForm.category
      });
      setShowAddIngredientModal(false);
      setIngredientForm({ name: '', unit: 'kg', currentStock: 10, minThreshold: 5, unitCost: 50, category: 'Vegetables' });
      triggerToastSuccess(`Added raw ingredient ${newIng.name}`);
    } catch (err) {
      triggerToastError("Failed to add ingredient.");
    }
  };

  // Adjust Ingredient Stock Handler
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingIngredient || adjustAmount === 0) return;
    const prev = adjustingIngredient.currentStock;
    const newStock = Math.max(0, prev + adjustAmount);

    try {
      const updated = { ...adjustingIngredient, currentStock: newStock };
      await api.updateIngredient(updated);
      await api.addStockMovement({
        ingredientId: adjustingIngredient.id,
        ingredientName: adjustingIngredient.name,
        movementType: adjustType,
        quantity: adjustAmount,
        previousStock: prev,
        newStock: newStock,
        reason: adjustReason || `${adjustType} recorded by staff`,
        user: currentUser?.name || 'Kitchen Staff',
        userId: currentUser?.id
      });
      setAdjustingIngredient(null);
      setAdjustAmount(0);
      setAdjustReason('');
      triggerToastSuccess(`Updated stock for ${adjustingIngredient.name}`);
    } catch (err) {
      triggerToastError("Failed to record stock movement.");
    }
  };

  // Profile Update Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const updatedUser = await api.updateUser(currentUser.id, {
        name: profileForm.name,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        department: profileForm.department
      });
      if (onUserUpdated) onUserUpdated(updatedUser);
      setShowEditProfileModal(false);
      triggerToastSuccess("Profile updated successfully!");
    } catch (err) {
      triggerToastError("Failed to update profile.");
    }
  };



  // POS Cart & Checkout Handler
  const handleAddPosCart = (food: FoodItem) => {
    const stockQty = food.stockQuantity ?? food.stock ?? 0;
    const reservedQty = food.reservedQuantity || 0;
    const availQty = food.availableQuantity !== undefined ? food.availableQuantity : Math.max(0, stockQty - reservedQty);

    if (availQty <= 0 || !food.isAvailable) {
      triggerToastError(`"${food.name}" is OUT OF STOCK!`);
      return;
    }

    setPosCart(prev => {
      const found = prev.find(i => i.food.id === food.id);
      const currentQty = found ? found.quantity : 0;
      if (currentQty + 1 > availQty) {
        triggerToastError(`Only ${availQty} unit(s) of "${food.name}" available in stock!`);
        return prev;
      }
      if (found) {
        return prev.map(i => i.food.id === food.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { food, quantity: 1 }];
    });
  };

  const handleUpdatePosQty = (foodId: string, delta: number) => {
    setPosCart(prev => prev.map(item => {
      if (item.food.id === foodId) {
        const stockQty = item.food.stockQuantity ?? item.food.stock ?? 0;
        const reservedQty = item.food.reservedQuantity || 0;
        const availQty = item.food.availableQuantity !== undefined ? item.food.availableQuantity : Math.max(0, stockQty - reservedQty);
        const n = item.quantity + delta;
        if (n > availQty) {
          triggerToastError(`Only ${availQty} unit(s) of "${item.food.name}" available in stock!`);
          return item;
        }
        return n > 0 ? { ...item, quantity: n } : null;
      }
      return item;
    }).filter(Boolean) as any);
  };

  const handleCompletePosSale = async () => {
    if (posCart.length === 0) return;
    setIsPosProcessing(true);
    try {
      const orderItems = posCart.map(item => ({
        foodId: item.food.id,
        quantity: item.quantity,
        name: item.food.name,
        price: item.food.price,
        status: 'PENDING' as const
      }));
      const total = posCart.reduce((sum, item) => sum + (item.food.price * item.quantity), 0);

      const newOrder = await api.createOrder({
        userId: 'walkin-pos',
        userName: `${posCustomerName} (${posCustomerType})`,
        userEmail: 'pos@cravecanteen.com',
        items: orderItems,
        totalAmount: total,
        status: OrderStatus.ACCEPTED,
        createdAt: Date.now(),
        estimatedFinishTime: Date.now() + 15 * 60000,
        paymentMethod: posPaymentMethod,
        pickupLocation: 'Canteen POS Counter'
      });

      setPosCart([]);
      setPosSuccessMsg(`POS Sale Created: ${newOrder.id}`);
      setTimeout(() => setPosSuccessMsg(null), 4000);
      triggerToastSuccess(`Order ${newOrder.id} sent to Kitchen Queue!`);
    } catch (err) {
      triggerToastError("Failed to create POS sale.");
    } finally {
      setIsPosProcessing(false);
    }
  };

  // Filtered Orders Logic (Excludes unpaid orders)
  const filteredOrders = useMemo(() => {
    return kitchenPaidOrders.filter(o => {
      const search = orderSearch.toLowerCase();
      const matchSearch = !search || 
        o.id.toLowerCase().includes(search) || 
        o.userName.toLowerCase().includes(search) || 
        o.items.some(it => it.name.toLowerCase().includes(search));

      const currentSt = o.status as string;
      let matchStatus = true;
      if (orderStatusFilter === 'NEW') matchStatus = ['Booked', 'Paid', 'Accepted'].includes(currentSt);
      else if (orderStatusFilter === 'ACCEPTED') matchStatus = currentSt === 'Accepted';
      else if (orderStatusFilter === 'PREPARING') matchStatus = currentSt === 'Preparing';
      else if (orderStatusFilter === 'READY') matchStatus = currentSt === 'Ready';
      else if (orderStatusFilter === 'COMPLETED') matchStatus = ['Collected', 'Completed'].includes(currentSt);
      else if (orderStatusFilter === 'CANCELLED') matchStatus = currentSt === 'Cancelled';

      let matchType = true;
      if (orderCustomerTypeFilter === 'STUDENT') matchType = o.userName.toLowerCase().includes('student') || !o.userName.toLowerCase().includes('faculty');
      else if (orderCustomerTypeFilter === 'FACULTY') matchType = o.userName.toLowerCase().includes('faculty') || o.userName.toLowerCase().includes('prof');
      else if (orderCustomerTypeFilter === 'WALKIN') matchType = o.userName.toLowerCase().includes('walk-in');

      return matchSearch && matchStatus && matchType;
    }).sort((a, b) => {
      if (orderSortBy === 'NEWEST') return b.createdAt - a.createdAt;
      if (orderSortBy === 'OLDEST') return a.createdAt - b.createdAt;
      if (orderSortBy === 'PREP_TIME') return b.estimatedFinishTime - a.estimatedFinishTime;
      return 0;
    });
  }, [kitchenPaidOrders, orderSearch, orderStatusFilter, orderCustomerTypeFilter, orderSortBy]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchSearch = !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase()) || item.description.toLowerCase().includes(menuSearch.toLowerCase());
      const matchCategory = selectedCategory === 'ALL' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchSearch && matchCategory;
    });
  }, [menuItems, menuSearch, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-300 relative">

      {/* Floating Global Toast Alerts */}
      {toastSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold animate-fadeIn border border-emerald-400/40">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span>{toastSuccess}</span>
        </div>
      )}

      {toastError && (
        <div className="fixed top-5 right-5 z-50 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold animate-fadeIn border border-rose-400/40">
          <AlertCircle className="w-5 h-5 shrink-0 text-white" />
          <span>{toastError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SIDEBAR NAVIGATION (PERSISTENT DESKTOP / DRAWER MOBILE) */}
      {/* ========================================================================= */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 shrink-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 flex flex-col h-full overflow-y-auto">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Crave<span className="text-orange-600 dark:text-orange-500">Canteen</span>
                </h1>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600 dark:text-orange-400 mt-0.5">
                  Kitchen KDS
                </p>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Kitchen Staff Status Card */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.substring(0, 2).toUpperCase() || 'KS'}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Kitchen Staff'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {userRole || 'Canteen Staff'}
                </p>
              </div>
            </div>

            {/* Kitchen Online/Busy Status Indicator Toggle */}
            <button
              onClick={() => {
                const next = kitchenStatus === 'Online' ? 'Busy' : kitchenStatus === 'Busy' ? 'Offline' : 'Online';
                api.setKitchenStatus(next);
                setKitchenStatus(next);
              }}
              className={`px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 border transition-all ${
                kitchenStatus === 'Online'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : kitchenStatus === 'Busy'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
              }`}
              title="Click to change availability status"
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                kitchenStatus === 'Online' ? 'bg-emerald-500' : kitchenStatus === 'Busy' ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
              <span>{kitchenStatus}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1 flex-1">
            
            <button
              onClick={() => changeTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <LayoutGrid className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-4 h-4" />
                <span>Order Queue</span>
              </div>
              {newOrdersCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'orders' ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                }`}>
                  {newOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => changeTab('preparation')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'preparation'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Flame className="w-4 h-4" />
                <span>In Preparation</span>
              </div>
              {inPrepOrdersCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'preparation' ? 'bg-white text-orange-600' : 'bg-blue-500 text-white'
                }`}>
                  {inPrepOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => changeTab('ready')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ready'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready for Pickup</span>
              </div>
              {readyOrdersCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'ready' ? 'bg-white text-orange-600' : 'bg-emerald-500 text-white'
                }`}>
                  {readyOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => changeTab('completed')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <History className="w-4 h-4" />
                <span>Completed Orders</span>
              </div>
            </button>

            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Management
              </p>
            </div>

            <button
              onClick={() => changeTab('menu')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Coffee className="w-4 h-4" />
                <span>Menu Availability</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('inventory')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package className="w-4 h-4" />
                <span>Stock & Ingredients</span>
              </div>
              {lowStockIngredientsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                  {lowStockIngredientsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => changeTab('stock-movements')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'stock-movements'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-4 h-4" />
                <span>Stock Movements</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('reports')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-4 h-4" />
                <span>Kitchen Reports</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notifications'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                System & POS
              </p>
            </div>

            <button
              onClick={() => changeTab('pos')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pos'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Monitor className="w-4 h-4" />
                <span>POS Counter Terminal</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <UserIcon className="w-4 h-4" />
                <span>Profile & Shift</span>
              </div>
            </button>

            <button
              onClick={() => changeTab('support')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'support'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </div>
            </button>

          </nav>

          {/* Footer & Logout */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
                <span>{activeTab.replace('-', ' ')}</span>
                {activeTab === 'pos' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] uppercase font-extrabold tracking-wider">
                    POS
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:block">
                GOOD FOOD • BRIGHTER DAYS
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setScannerMode(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Scan className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            <button
              onClick={() => changeTab('notifications')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 relative transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <ThemeSelector variant="dropdown" />

            <UserProfileDropdown
              currentUser={currentUser || null}
              onLogout={onLogout}
              onNavigateProfile={() => changeTab('profile')}
              currentPath={currentPath}
              activeTab={activeTab}
            />
          </div>
        </header>

        {/* View Router Render */}
        <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ======================================================================= */}
          {/* TAB 1: KITCHEN DASHBOARD */}
          {/* ======================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-6 sm:p-8 text-white shadow-xl">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center opacity-15 pointer-events-none" style={{ backgroundImage: "url('/canteen_bg.jpg')" }} />
                <div className="relative z-10 max-w-2xl">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-xs">
                    Kitchen Display System
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
                    Good Morning, Kitchen Team! 👋
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-orange-100 mt-1 max-w-lg leading-relaxed">
                    Let's serve great food today! Real-time order synchronization is active across all campus ordering portals.
                  </p>
                </div>
              </div>

              {/* Dynamic KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Today</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{orders.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">In Preparation</p>
                    <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{inPrepOrdersCount}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Ready Pickup</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{readyOrdersCount}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Revenue</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">₹{totalSalesToday}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Low Stock Banner Alert */}
              {lowStockIngredientsCount > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Low Stock Warning</h4>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {lowStockIngredientsCount} ingredient(s) have dropped below their minimum safety thresholds.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => changeTab('inventory')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-sm hover:bg-rose-500 transition-all shrink-0"
                  >
                    View Stock Inventory
                  </button>
                </div>
              )}

              {/* Active Orders Queue Table on Dashboard */}
              <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Live Kitchen Queue</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Latest active customer orders needing preparation</p>
                  </div>
                  <button
                    onClick={() => changeTab('orders')}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <span>View All ({orders.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.slice(0, 6).map(order => {
                    const currentSt = order.status as string;
                    return (
                      <div 
                        key={order.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                          <div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">#{order.id}</span>
                            <span className="ml-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {order.userName}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${STATUS_COLORS[order.status] || 'bg-slate-500/10 text-slate-400'}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 flex-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{it.name}</span>
                              <span className="font-bold text-slate-500">×{it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-xs font-black text-orange-600 dark:text-orange-400">₹{order.totalAmount}</span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            
                            {['Booked', 'Paid', 'Pending Payment', 'Cart'].includes(currentSt) && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(order, OrderStatus.ACCEPTED)}
                                className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                              >
                                Accept
                              </button>
                            )}
                            {currentSt === 'Accepted' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(order, OrderStatus.PREPARING)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                              >
                                Start Prep
                              </button>
                            )}
                            {currentSt === 'Preparing' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(order, OrderStatus.READY)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                Mark Ready
                              </button>
                            )}
                            {currentSt === 'Ready' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(order, OrderStatus.COMPLETED)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: ORDER QUEUE PAGE */}
          {/* ======================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Controls & Search Bar */}
              <div className="bg-white dark:bg-[#0f172a] p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search order #, customer, item..."
                      className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <select
                      value={orderCustomerTypeFilter}
                      onChange={(e) => setOrderCustomerTypeFilter(e.target.value)}
                      className="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="ALL">All Customers</option>
                      <option value="STUDENT">Students Only</option>
                      <option value="FACULTY">Faculty Only</option>
                      <option value="WALKIN">Walk-in POS</option>
                    </select>

                    <select
                      value={orderSortBy}
                      onChange={(e) => setOrderSortBy(e.target.value as any)}
                      className="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="NEWEST">Newest First</option>
                      <option value="OLDEST">Oldest First</option>
                      <option value="PREP_TIME">Preparation Time</option>
                    </select>
                  </div>
                </div>

                {/* Status Tabs Bar */}
                <div className="flex space-x-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 no-scrollbar">
                  {['ALL', 'NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 ${
                        orderStatusFilter === st
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

              </div>

              {/* Order Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => {
                  const currentSt = order.status as string;
                  const waitingMinutes = Math.floor((Date.now() - order.createdAt) / 60000);
                  const isUrgent = waitingMinutes >= 15 && currentSt !== 'Completed' && currentSt !== 'Collected' && currentSt !== 'Cancelled';

                  return (
                    <div 
                      key={order.id}
                      className={`p-5 rounded-3xl bg-white dark:bg-[#0f172a] border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                        isUrgent ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white">#{order.id}</span>
                            {isUrgent && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black animate-pulse">
                                URGENT ({waitingMinutes}m)
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            {order.userName}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${STATUS_COLORS[order.status] || 'bg-slate-500/10 text-slate-400'}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="space-y-2 flex-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.name}</span>
                            <span className="font-extrabold text-orange-600 dark:text-orange-400">×{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Total</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">₹{order.totalAmount}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setPrintSlipOrder(order)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                            title="Print Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {['Booked', 'Paid', 'Pending Payment', 'Cart'].includes(currentSt) && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(order, OrderStatus.ACCEPTED)}
                              className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                            >
                              Accept
                            </button>
                          )}
                          {currentSt === 'Accepted' && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(order, OrderStatus.PREPARING)}
                              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                            >
                              Start Prep
                            </button>
                          )}
                          {currentSt === 'Preparing' && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(order, OrderStatus.READY)}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Mark Ready
                            </button>
                          )}
                          {currentSt === 'Ready' && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(order, OrderStatus.COMPLETED)}
                              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: IN PREPARATION PAGE */}
          {/* ======================================================================= */}
          {activeTab === 'preparation' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Active Kitchen Stations</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Orders currently being cooked & prepared</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                  {inPrepOrdersCount} Cooking
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.filter(o => ['Accepted', 'Preparing'].includes(o.status as string)).map(order => {
                  const startTime = order.checkInTime || order.createdAt;
                  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
                  const mins = Math.floor(elapsedSeconds / 60);
                  const secs = elapsedSeconds % 60;

                  return (
                    <div key={order.id} className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                      
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">#{order.id}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{order.userName}</p>
                        </div>
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>{mins}m {secs}s</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{it.name}</span>
                            <span className="font-black text-blue-600 dark:text-blue-400">×{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleAdvanceOrderStatus(order, OrderStatus.READY)}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Order as Ready</span>
                      </button>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 4: READY FOR PICKUP PAGE */}
          {/* ======================================================================= */}
          {activeTab === 'ready' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Ready for Counter Pickup</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Orders cooked and waiting for customer pickup</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                  {readyOrdersCount} Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.filter(o => (o.status as string) === 'Ready').map(order => (
                  <div key={order.id} className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-emerald-500/30 shadow-xs space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">#{order.id}</h4>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{order.userName}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-black">
                        READY
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>{it.name}</span>
                          <span>×{it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPrintSlipOrder(order)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
                      >
                        Print Slip
                      </button>
                      <button
                        onClick={() => handleAdvanceOrderStatus(order, OrderStatus.COMPLETED)}
                        className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm hover:opacity-90"
                      >
                        Mark Completed
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 5: COMPLETED ORDERS */}
          {/* ======================================================================= */}
          {activeTab === 'completed' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Completed Orders Archive</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-2">Order ID</th>
                        <th className="py-3 px-2">Customer</th>
                        <th className="py-3 px-2">Items</th>
                        <th className="py-3 px-2">Amount</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {orders.filter(o => ['Collected', 'Completed'].includes(o.status as string)).map(o => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">#{o.id}</td>
                          <td className="py-3 px-2">{o.userName}</td>
                          <td className="py-3 px-2">{o.items.length} items</td>
                          <td className="py-3 px-2 font-bold text-orange-600">₹{o.totalAmount}</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                              Completed
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <button 
                              onClick={() => setPrintSlipOrder(o)}
                              className="text-xs font-bold text-orange-600 hover:underline"
                            >
                              Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* ======================================================================= */}
          {/* TAB 6: COMPLETE FOOD ITEM MANAGEMENT */}
          {/* ======================================================================= */}
          {activeTab === 'menu' && (
            <FoodItemManagementView
              menuItems={menuItems}
              currentUser={currentUser}
              onUpdateMenu={onUpdateMenu}
              triggerToastSuccess={triggerToastSuccess}
              triggerToastError={triggerToastError}
            />
          )}

          {/* ======================================================================= */}
          {/* TAB 7: INVENTORY & RAW INGREDIENTS PAGE */}
          {/* ======================================================================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-5 animate-fadeIn">
              
              <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Raw Ingredients Inventory</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Track stock levels and safety thresholds</p>
                </div>
                <button
                  onClick={() => setShowAddIngredientModal(true)}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-2">Ingredient</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Current Stock</th>
                      <th className="py-3 px-2">Min Threshold</th>
                      <th className="py-3 px-2">Unit Cost</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {ingredients.map(ing => {
                      const isCritical = ing.currentStock <= ing.minThreshold / 2;
                      const isLow = ing.currentStock <= ing.minThreshold;

                      return (
                        <tr key={ing.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{ing.name}</td>
                          <td className="py-3 px-2 text-slate-500">{ing.category || 'General'}</td>
                          <td className="py-3 px-2 font-black">{ing.currentStock} {ing.unit}</td>
                          <td className="py-3 px-2 text-slate-500">{ing.minThreshold} {ing.unit}</td>
                          <td className="py-3 px-2">₹{ing.unitCost} / {ing.unit}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isCritical ? 'bg-rose-500/10 text-rose-500' : isLow ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {isCritical ? 'Critical' : isLow ? 'Low Stock' : 'Available'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingIngredient(ing)}
                                title="View Details"
                                aria-label={`View details for ${ing.name}`}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditIngredient(ing)}
                                title="Edit Ingredient"
                                aria-label={`Edit ${ing.name}`}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjustingIngredient(ing);
                                  setAdjustAmount(5);
                                  setAdjustType('Purchase');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-500/20 transition-all cursor-pointer whitespace-nowrap"
                              >
                                Adjust Stock
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 8: STOCK MOVEMENTS LOG */}
          {/* ======================================================================= */}
          {activeTab === 'stock-movements' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Stock Movement Audit History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-2">Date & Time</th>
                        <th className="py-3 px-2">Ingredient</th>
                        <th className="py-3 px-2">Type</th>
                        <th className="py-3 px-2">Quantity</th>
                        <th className="py-3 px-2">Prev → New</th>
                        <th className="py-3 px-2">Reason</th>
                        <th className="py-3 px-2">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {stockMovements.map(mv => (
                        <tr key={mv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-2 text-slate-500">{new Date(mv.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{mv.ingredientName}</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold">
                              {mv.movementType}
                            </span>
                          </td>
                          <td className={`py-3 px-2 font-black ${mv.quantity >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                          </td>
                          <td className="py-3 px-2 text-slate-500">{mv.previousStock} → {mv.newStock}</td>
                          <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{mv.reason}</td>
                          <td className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">{mv.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 9: KITCHEN REPORTS */}
          {/* ======================================================================= */}
          {/* ======================================================================= */}
          {/* TAB 9: KITCHEN REPORTS & OPERATIONAL ANALYTICS */}
          {/* ======================================================================= */}
          {activeTab === 'reports' && (() => {
            let activeDataset: any[] = [];
            if (reportSubTab === 'sales') activeDataset = filteredSalesOrders;
            else if (reportSubTab === 'food') activeDataset = filteredFoodPerformance;
            else if (reportSubTab === 'inventory') activeDataset = filteredInventoryStatus;
            else if (reportSubTab === 'stock-movements') activeDataset = filteredStockMovements;
            else if (reportSubTab === 'performance') activeDataset = filteredPerformanceOrders;

            const totalFilteredCount = activeDataset.length;
            const totalPages = Math.ceil(totalFilteredCount / reportItemsPerPage) || 1;
            const currentPageSafe = Math.min(reportCurrentPage, totalPages);
            const paginatedData = activeDataset.slice((currentPageSafe - 1) * reportItemsPerPage, currentPageSafe * reportItemsPerPage);
            const startRecord = totalFilteredCount === 0 ? 0 : (currentPageSafe - 1) * reportItemsPerPage + 1;
            const endRecord = Math.min(currentPageSafe * reportItemsPerPage, totalFilteredCount);
            const totalSalesFiltered = filteredSalesOrders.reduce((sum, o) => sum + o.totalAmount, 0);

            return (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Printable Header Metadata (Hidden on screen, visible during window.print()) */}
                <div className="hidden print:block mb-6 p-4 border border-slate-300 rounded-2xl space-y-1 text-slate-800 text-xs">
                  <h1 className="text-xl font-bold">CraveCanteen — Kitchen Operations Report</h1>
                  <p><strong>Report Sub-Module:</strong> {reportSubTab.toUpperCase()}</p>
                  <p><strong>Date Range:</strong> {reportFromDate || 'Beginning'} to {reportToDate || 'Today'}</p>
                  <p><strong>Search Query:</strong> {appliedReportSearch ? `"${appliedReportSearch}"` : 'None'}</p>
                  <p><strong>Generated On:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>Total Filtered Records:</strong> {totalFilteredCount}</p>
                </div>

                {/* Main Header & Export Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      Kitchen Reports & Analytics
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Good Food • Brighter Days — Operational logs, sales breakdowns, & stock movements
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print PDF</span>
                    </button>
                  </div>
                </div>

                {/* 1. REPORT FILTER BAR & SEARCH AREA */}
                <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
                  
                  {/* Search Bar Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search reports by Order ID, Customer, Food item, Item code, Status, Movement, Staff..."
                      value={reportSearchInput}
                      onChange={(e) => setReportSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyReportFilters();
                        }
                      }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                    />
                    {reportSearchInput && (
                      <button
                        onClick={() => {
                          setReportSearchInput('');
                          setAppliedReportSearch('');
                          setReportCurrentPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* From / To Date Pickers & Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    
                    {/* From Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={reportFromDate}
                        onChange={(e) => {
                          setReportFromDate(e.target.value);
                          setQuickDateFilter('CUSTOM');
                          setReportCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={reportToDate}
                        onChange={(e) => {
                          setReportToDate(e.target.value);
                          setQuickDateFilter('CUSTOM');
                          setReportCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <button
                        onClick={handleApplyReportFilters}
                        className="flex-1 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Apply Filters</span>
                      </button>
                      <button
                        onClick={handleResetReportFilters}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Date Filter Shortcuts */}
                  <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Quick Range:</span>
                    {[
                      { id: 'ALL', label: 'All Time' },
                      { id: 'TODAY', label: 'Today' },
                      { id: 'YESTERDAY', label: 'Yesterday' },
                      { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                      { id: 'THIS_MONTH', label: 'This Month' },
                      { id: 'LAST_MONTH', label: 'Last Month' }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handleQuickDateSelect(btn.id as any)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          quickDateFilter === btn.id
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                </div>

                {/* KPI Metrics in Current Filter Range */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400">Total Sales (Filtered)</p>
                    <h4 className="text-2xl font-black text-orange-600 mt-1">₹{totalSalesFiltered}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400">Filtered Records</p>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalFilteredCount}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400">Matching Orders</p>
                    <h4 className="text-2xl font-black text-blue-600 mt-1">{filteredSalesOrders.length}</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400">Avg Prep Time</p>
                    <h4 className="text-2xl font-black text-emerald-600 mt-1">{avgPrepTimeMins} mins</h4>
                  </div>
                </div>

                {/* REPORT SUB-TAB SELECTION */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar print:hidden">
                  {[
                    { id: 'sales', label: 'Sales & Orders', icon: ShoppingCart },
                    { id: 'food', label: 'Food Item Sales', icon: Coffee },
                    { id: 'inventory', label: 'Stock & Ingredients', icon: Package },
                    { id: 'stock-movements', label: 'Stock Movement Logs', icon: History },
                    { id: 'performance', label: 'Kitchen Performance', icon: TrendingUp }
                  ].map(tab => {
                    const IconComp = tab.icon;
                    const isActive = reportSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setReportSubTab(tab.id as any);
                          setReportCurrentPage(1);
                        }}
                        className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* FILTER RESULTS SUMMARY BAR */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 text-xs print:hidden">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-[11px]">
                      {totalFilteredCount} matching records
                    </span>
                    {(appliedReportSearch || reportFromDate || reportToDate) && (
                      <span className="text-slate-400 text-[11px] font-normal">
                        Active Filters: {appliedReportSearch && `Search "${appliedReportSearch}" `} {reportFromDate && `From ${reportFromDate} `} {reportToDate && `To ${reportToDate}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                    <span>Sort by:</span>
                    <button
                      onClick={() => {
                        setReportSortOrder(reportSortOrder === 'asc' ? 'desc' : 'asc');
                        setReportCurrentPage(1);
                      }}
                      className="font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {reportSortOrder === 'desc' ? 'Newest / Highest ↓' : 'Oldest / Lowest ↑'}
                    </button>
                  </div>
                </div>

                {/* NO RESULTS EMPTY STATE */}
                {totalFilteredCount === 0 && (
                  <div className="bg-white dark:bg-[#0f172a] p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-fadeIn">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">No reports found matching criteria</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        No records match your selected search query or date window. Try adjusting your parameters or resetting filters.
                      </p>
                    </div>
                    {(appliedReportSearch || reportFromDate || reportToDate) && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[11px] font-mono text-slate-600 dark:text-slate-400 inline-block max-w-lg text-left">
                        {appliedReportSearch && <div>• Search: "{appliedReportSearch}"</div>}
                        {reportFromDate && <div>• From: {reportFromDate}</div>}
                        {reportToDate && <div>• To: {reportToDate}</div>}
                      </div>
                    )}
                    <div>
                      <button
                        onClick={handleResetReportFilters}
                        className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:bg-orange-700 transition-all cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 1: SALES & ORDERS TABLE */}
                {reportSubTab === 'sales' && totalFilteredCount > 0 && (
                  <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                          <tr>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Food Items</th>
                            <th className="py-3 px-4">Payment</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedData.map((o: Order) => (
                            <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-slate-500 dark:text-slate-400">
                                {new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">{o.id}</td>
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{o.userName || 'Guest User'}</td>
                              <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                {o.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                                  {o.paymentMethod || 'CASH'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-black text-slate-900 dark:text-white">₹{o.totalAmount}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  o.status === OrderStatus.COLLECTED || (o.status as string) === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                  o.status === OrderStatus.CANCELLED ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                  'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: FOOD ITEM PERFORMANCE TABLE */}
                {reportSubTab === 'food' && totalFilteredCount > 0 && (
                  <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                          <tr>
                            <th className="py-3 px-4">Food Item</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Units Sold</th>
                            <th className="py-3 px-4">Total Revenue</th>
                            <th className="py-3 px-4">Stock</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedData.map((f: any) => (
                            <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                                <img src={f.image} alt={f.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                <span>{f.name}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-medium">{f.category}</td>
                              <td className="py-3 px-4 text-slate-500 font-medium">{f.foodType || 'Veg'}</td>
                              <td className="py-3 px-4 font-black text-orange-600">{f.unitsSold} units</td>
                              <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">₹{f.totalRevenue}</td>
                              <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{f.availQty} {f.unit || 'units'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  f.isAvailable && f.availQty > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                }`}>
                                  {f.isAvailable && f.availQty > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: STOCK & INVENTORY STATUS TABLE */}
                {reportSubTab === 'inventory' && totalFilteredCount > 0 && (
                  <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                          <tr>
                            <th className="py-3 px-4">Item Name</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Category / Details</th>
                            <th className="py-3 px-4">Current Stock</th>
                            <th className="py-3 px-4">Min Threshold</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedData.map((inv: any, idx: number) => (
                            <tr key={inv.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{inv.name}</td>
                              <td className="py-3 px-4 font-semibold text-slate-500">{inv.type}</td>
                              <td className="py-3 px-4 font-medium text-slate-500">{inv.detail}</td>
                              <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{inv.stock} {inv.unit}</td>
                              <td className="py-3 px-4 font-medium text-slate-400">{inv.minThreshold} {inv.unit}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  inv.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                  inv.status === 'LOW STOCK' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                  'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 4: STOCK MOVEMENT LOGS TABLE */}
                {reportSubTab === 'stock-movements' && totalFilteredCount > 0 && (
                  <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                          <tr>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Reference</th>
                            <th className="py-3 px-4">Item Name</th>
                            <th className="py-3 px-4">Movement Type</th>
                            <th className="py-3 px-4">Quantity</th>
                            <th className="py-3 px-4">Stock Transition</th>
                            <th className="py-3 px-4">Staff User</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedData.map((mv: StockMovement) => (
                            <tr key={mv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 text-slate-500 font-medium">
                                {new Date(mv.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{mv.reference || '-'}</td>
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{mv.itemName}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                  mv.type === 'RESTOCK' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                  mv.type === 'SALE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                  mv.type === 'WASTAGE' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                  'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                }`}>
                                  {mv.type}
                                </span>
                              </td>
                              <td className={`py-3 px-4 font-black ${mv.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-semibold">
                                {mv.previousStock} → <span className="font-black text-slate-900 dark:text-white">{mv.newStock}</span>
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-500">{mv.user || 'Staff'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 5: KITCHEN PERFORMANCE TABLE */}
                {reportSubTab === 'performance' && totalFilteredCount > 0 && (
                  <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                          <tr>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Items Summary</th>
                            <th className="py-3 px-4">Order Placed</th>
                            <th className="py-3 px-4">Est Prep Duration</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedData.map((o: Order) => (
                            <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-orange-600">{o.id}</td>
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{o.userName || 'Guest'}</td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                {o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                              </td>
                              <td className="py-3 px-4 text-slate-500">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="py-3 px-4 font-bold text-blue-600">{o.items.length * 5 + 10} mins</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  o.status === OrderStatus.COLLECTED || (o.status as string) === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PAGINATION CONTROLS */}
                {totalFilteredCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs print:hidden">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                      Showing <strong className="text-slate-900 dark:text-white">{startRecord}–{endRecord}</strong> of <strong className="text-slate-900 dark:text-white">{totalFilteredCount}</strong> records
                    </p>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setReportCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPageSafe <= 1}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                          .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPageSafe) <= 1)
                          .map((page, idx, arr) => {
                            const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                                <button
                                  onClick={() => setReportCurrentPage(page)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    currentPageSafe === page
                                      ? 'bg-orange-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}
                      </div>

                      <button
                        onClick={() => setReportCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPageSafe >= totalPages}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ======================================================================= */}
          {/* TAB 10: NOTIFICATIONS PAGE */}
          {/* ======================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Kitchen Alerts & System Notices</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order updates, inventory threshold alerts, and announcements</p>
                </div>
                <button
                  onClick={() => api.markAllNotificationsRead()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
                >
                  Mark All as Read
                </button>
              </div>

              <div className="space-y-3">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => api.markNotificationRead(notif.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      notif.read
                        ? 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 opacity-75'
                        : 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/30'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 10.5: USER MANAGEMENT */}
          {/* ======================================================================= */}
          {activeTab === 'users' && (
            <UserManagementView
              currentUser={currentUser}
              triggerToastSuccess={triggerToastSuccess}
              triggerToastError={triggerToastError}
            />
          )}

          {/* ======================================================================= */}
          {/* TAB 11: PROFILE & SHIFT INFO */}
          {/* ======================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl">
              
              <div className="bg-white dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex items-center space-x-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30">
                    {currentUser?.name?.substring(0, 2).toUpperCase() || 'KS'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{currentUser?.name || 'Kitchen Staff'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{currentUser?.email || 'staff@cravecanteen.com'}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 text-[10px] font-extrabold uppercase tracking-wider">
                      Employee ID: KITCHEN-8842
                    </span>
                  </div>
                </div>

                {/* Shift Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Assigned Shift</h4>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>Morning Shift (08:00 AM – 04:00 PM)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px]">● Active</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setProfileForm({
                        name: currentUser?.name || '',
                        email: currentUser?.email || '',
                        phoneNumber: currentUser?.phoneNumber || '',
                        department: currentUser?.department || 'Kitchen Operations'
                      });
                      setShowEditProfileModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25"
                  >
                    Edit Profile Details
                  </button>
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
                  >
                    Change Password
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 12: HELP & SUPPORT PAGE (SUBMITTED TICKETS VIEW) */}
          {/* ======================================================================= */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Top Header Card & Quick Metrics */}
              <div className="bg-white dark:bg-[#0f172a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Submitted Support Tickets</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                      Monitor, filter, and track customer, staff, and operational support issues submitted across the canteen hub.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200">
                      Total: <span className="font-black text-orange-600 dark:text-orange-400">{supportTickets.length}</span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">
                      Open: <span className="font-black">{supportTickets.filter(t => t.status === 'OPEN').length}</span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                      In Progress: <span className="font-black">{supportTickets.filter(t => t.status === 'IN_PROGRESS').length}</span>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Resolved: <span className="font-black">{supportTickets.filter(t => t.status === 'RESOLVED').length}</span>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tickets by ID, user, order #, category or description..."
                      value={supportSearchQuery}
                      onChange={(e) => setSupportSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-orange-500"
                    />
                    {supportSearchQuery && (
                      <button
                        onClick={() => setSupportSearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Filter */}
                    <select
                      value={supportStatusFilter}
                      onChange={(e: any) => setSupportStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">Open Only</option>
                      <option value="IN_PROGRESS">In Progress Only</option>
                      <option value="RESOLVED">Resolved Only</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                      value={supportPriorityFilter}
                      onChange={(e: any) => setSupportPriorityFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submitted Support Tickets Table Card */}
              <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                {filteredSupportTickets.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No support tickets found</p>
                    <p className="text-xs text-slate-400">Try changing your search terms or filter criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                        <tr>
                          <th className="py-3.5 px-4">Ticket ID</th>
                          <th className="py-3.5 px-4">Submitted By</th>
                          <th className="py-3.5 px-4">Category & Order Ref</th>
                          <th className="py-3.5 px-4">Priority</th>
                          <th className="py-3.5 px-4">Submitted At</th>
                          <th className="py-3.5 px-4">Status & Action</th>
                          <th className="py-3.5 px-4">Description</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSupportTickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white whitespace-nowrap">
                              {ticket.id}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{ticket.submittedBy}</div>
                              <div className="text-[10px] font-extrabold uppercase text-slate-400">{ticket.userRole}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-700 dark:text-slate-200">{ticket.issueType}</div>
                              {ticket.orderRef && ticket.orderRef !== '-' && (
                                <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  Order: {ticket.orderRef}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                                ticket.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                ticket.priority === 'High' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                ticket.priority === 'Medium' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-500 whitespace-nowrap">
                              {new Date(ticket.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <select
                                value={ticket.status}
                                onChange={(e: any) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-black border cursor-pointer outline-none transition-all ${
                                  ticket.status === 'RESOLVED'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : ticket.status === 'IN_PROGRESS'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                    : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                <option value="OPEN">● OPEN</option>
                                <option value="IN_PROGRESS">● IN PROGRESS</option>
                                <option value="RESOLVED">● RESOLVED</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300 max-w-xs" title={ticket.description}>
                              <p className="line-clamp-2 leading-relaxed">{ticket.description}</p>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setViewingSupportTicket(ticket)}
                                title="View Ticket Details"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* VIEW SUPPORT TICKET DETAILS MODAL */}
              {viewingSupportTicket && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-5 p-6">
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            Support Ticket Details #{viewingSupportTicket.id}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            Submitted on {new Date(viewingSupportTicket.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingSupportTicket(null)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Submitted By</span>
                        <span className="text-slate-900 dark:text-white font-bold">{viewingSupportTicket.submittedBy}</span>
                        <span className="text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400 block mt-0.5">
                          Role: {viewingSupportTicket.userRole}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Category</span>
                        <span className="text-slate-900 dark:text-white font-bold">{viewingSupportTicket.issueType}</span>
                        {viewingSupportTicket.orderRef && viewingSupportTicket.orderRef !== '-' && (
                          <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                            Order Ref: {viewingSupportTicket.orderRef}
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Priority Level</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                          viewingSupportTicket.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                          viewingSupportTicket.priority === 'High' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          viewingSupportTicket.priority === 'Medium' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {viewingSupportTicket.priority}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Ticket Status</span>
                        <select
                          value={viewingSupportTicket.status}
                          onChange={(e: any) => {
                            const newSt = e.target.value;
                            handleUpdateTicketStatus(viewingSupportTicket.id, newSt);
                            setViewingSupportTicket(prev => prev ? { ...prev, status: newSt } : null);
                          }}
                          className="w-full mt-0.5 px-2.5 py-1 rounded-xl text-xs font-bold border outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                        >
                          <option value="OPEN">● OPEN</option>
                          <option value="IN_PROGRESS">● IN PROGRESS</option>
                          <option value="RESOLVED">● RESOLVED</option>
                        </select>
                      </div>
                    </div>

                    {/* Description Box */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Full Description & Details</label>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {viewingSupportTicket.description}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setViewingSupportTicket(null)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                      >
                        Close Details
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 13: POS TERMINAL VIEW */}
          {/* ======================================================================= */}
          {activeTab === 'pos' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* POS Sub-tab Selector Header */}
              <div className="bg-white dark:bg-[#0f172a] p-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPosSubTab('NEW_SALE')}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      posSubTab === 'NEW_SALE'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>New Counter Order / Walk-in</span>
                  </button>

                  <button
                    onClick={() => setPosSubTab('PENDING_CASH')}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      posSubTab === 'PENDING_CASH'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Pending Cash Payments</span>
                    {pendingCashOrders.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                        {pendingCashOrders.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {posSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{posSuccessMsg}</span>
                </div>
              )}

              {posSubTab === 'NEW_SALE' ? (
                /* NEW POS SALE VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* POS Item Menu Selection */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#0f172a] p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={posSearch}
                          onChange={(e) => setPosSearch(e.target.value)}
                          placeholder="Search food items for POS order..."
                          className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {menuItems.filter(i => (!posSearch || i.name.toLowerCase().includes(posSearch.toLowerCase()) || (i.itemCode && i.itemCode.toLowerCase().includes(posSearch.toLowerCase())))).slice(0, 15).map(item => {
                        const stockQty = item.stockQuantity ?? item.stock ?? 0;
                        const reservedQty = item.reservedQuantity || 0;
                        const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
                        const isOutOfStock = availQty <= 0 || !item.isAvailable;

                        return (
                          <button
                            key={item.id}
                            disabled={isOutOfStock}
                            onClick={() => handleAddPosCart(item)}
                            className={`p-3 rounded-2xl bg-white dark:bg-[#0f172a] border transition-all shadow-xs flex flex-col justify-between space-y-2 group text-left ${
                              isOutOfStock 
                                ? 'opacity-60 cursor-not-allowed border-rose-500/40 grayscale-[0.3]' 
                                : 'border-slate-200 dark:border-slate-800 hover:border-amber-500 cursor-pointer'
                            }`}
                          >
                            <div className="relative">
                              <img src={item.image} alt={item.name} className="w-full h-20 rounded-xl object-cover" />
                              {isOutOfStock ? (
                                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  OUT OF STOCK
                                </span>
                              ) : (
                                <span className="absolute top-1 right-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md">
                                  Stock: {availQty}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-500">{item.name}</h4>
                              <div className="flex justify-between items-center mt-0.5">
                                <p className="text-xs font-black text-amber-600 dark:text-amber-400">₹{item.price}</p>
                                <span className="text-[10px] text-slate-400 font-semibold">{item.mealTime || item.category}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* POS Cart Sidebar */}
                  <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                        POS Counter Sale
                      </h3>

                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Customer Type</label>
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {(['Student', 'Faculty', 'Walk-in'] as const).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setPosCustomerType(t)}
                                className={`py-1.5 text-[10px] font-extrabold rounded-lg border transition-all ${
                                  posCustomerType === t
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-2 max-h-56 overflow-y-auto pt-2">
                          {posCart.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">Tap menu items to add to POS order</p>
                          ) : (
                            posCart.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.food.name}</p>
                                  <p className="text-[10px] text-slate-400">₹{item.food.price} × {item.quantity}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button onClick={() => handleUpdatePosQty(item.food.id, -1)} className="p-1 rounded bg-slate-200 dark:bg-slate-700">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-extrabold px-1.5">{item.quantity}</span>
                                  <button onClick={() => handleAddPosCart(item.food)} className="p-1 rounded bg-slate-200 dark:bg-slate-700">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* POS Total & Checkout */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-sm font-black">
                        <span className="text-slate-600 dark:text-slate-400">Total Payable</span>
                        <span className="text-amber-600 dark:text-amber-400 text-base">
                          ₹{posCart.reduce((sum, i) => sum + (i.food.price * i.quantity), 0)}
                        </span>
                      </div>

                      <button
                        onClick={handleCompletePosSale}
                        disabled={posCart.length === 0 || isPosProcessing}
                        className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        {isPosProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete Counter Sale</span>}
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                /* PENDING CASH COUNTER PAYMENTS VIEW */
                <div className="space-y-4">
                  <div className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Pending Counter Cash Payments</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black">
                        {pendingCashOrders.length} {pendingCashOrders.length === 1 ? 'order' : 'orders'} awaiting cash
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      When students/faculty choose "Pay at Counter", collect cash here and click <strong>Receive Cash Payment</strong>. Only then is the order sent to the kitchen!
                    </p>
                  </div>

                  {pendingCashOrders.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        No Pending Counter Cash Payments
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        All student and faculty orders have either been paid online via Wallet/UPI or already processed by counter staff.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingCashOrders.map(order => (
                        <div
                          key={order.id}
                          className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-amber-500/40 shadow-sm space-y-4 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                              <span className="text-xs font-black text-orange-600 dark:text-orange-400 block">
                                #{order.id}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {order.userName}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-500/30">
                              AWAITING CASH
                            </span>
                          </div>

                          <div className="space-y-1.5 flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Summary</span>
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                                <span>{it.quantity}x {it.name}</span>
                                <span className="font-bold">₹{it.price * it.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-500">Amount Due</span>
                              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                                ₹{order.totalAmount}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setCashPaymentModalOrder(order);
                                setCashReceivedAmount(order.totalAmount);
                              }}
                              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Receive Cash & Confirm</span>
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ORDER DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Order Details</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">#{selectedOrder.id}</h3>
                <p className="text-xs font-bold text-slate-500">{selectedOrder.userName}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400">Order Items</h4>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{it.name}</p>
                      <p className="text-[10px] text-slate-400">₹{it.price} each</p>
                    </div>
                    <span className="font-black text-orange-600">×{it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Amount</span>
                <span className="text-base font-black text-slate-900 dark:text-white">₹{selectedOrder.totalAmount}</span>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={() => setPrintSlipOrder(selectedOrder)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
                >
                  Print Kitchen Slip
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POS CASH PAYMENT RECEIPT & CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cashPaymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn font-sans">
          <div className="bg-white dark:bg-[#0f172a] border border-amber-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-5">
            <button 
              onClick={() => setCashPaymentModalOrder(null)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Receive Cash Payment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order <strong>#{cashPaymentModalOrder.id}</strong> • {cashPaymentModalOrder.userName}
              </p>
            </div>

            {/* Bill Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Items ({cashPaymentModalOrder.items.length})</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {cashPaymentModalOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-extrabold text-slate-900 dark:text-white">Total Amount Due</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                  ₹{cashPaymentModalOrder.totalAmount}
                </span>
              </div>
            </div>

            {/* Cash Received Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cash Received from Customer (₹)
              </label>
              <input
                type="number"
                value={cashReceivedAmount}
                onChange={(e) => setCashReceivedAmount(Number(e.target.value))}
                className="w-full px-4 py-3 text-lg font-black rounded-xl bg-slate-50 dark:bg-slate-800 border border-amber-500/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex gap-1.5 pt-1">
                {[cashPaymentModalOrder.totalAmount, 50, 100, 200, 500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashReceivedAmount(amt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 text-slate-700 dark:text-slate-200 font-bold text-[11px] border border-slate-200 dark:border-slate-700"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Calculation */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">Change to Return Customer</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                ₹{Math.max(0, cashReceivedAmount - cashPaymentModalOrder.totalAmount)}
              </span>
            </div>

            <button
              onClick={async () => {
                if (!cashPaymentModalOrder) return;
                try {
                  await api.confirmCounterCashPayment(cashPaymentModalOrder.id, currentUser?.name || 'POS Staff');
                  triggerToastSuccess(`Cash payment confirmed for #${cashPaymentModalOrder.id}! Order sent to kitchen preparing list.`);
                  setCashPaymentModalOrder(null);
                } catch (err: any) {
                  triggerToastError(err?.message || "Failed to confirm cash payment.");
                }
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm Cash Payment & Send to Kitchen</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINT ORDER SLIP MODAL */}
      {/* ========================================================================= */}
      {printSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative font-mono space-y-4">
            <button 
              onClick={() => setPrintSlipOrder(null)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-300 pb-3">
              <h3 className="text-base font-black uppercase">CraveCanteen</h3>
              <p className="text-[10px]">GOOD FOOD • BRIGHTER DAYS</p>
              <p className="text-xs font-bold mt-2">KITCHEN ORDER SLIP</p>
              <p className="text-xs">Order #{printSlipOrder.id}</p>
              <p className="text-[10px] text-slate-500">{new Date(printSlipOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="space-y-1 text-xs">
              <p><strong>Customer:</strong> {printSlipOrder.userName}</p>
              <p><strong>Status:</strong> {printSlipOrder.status}</p>
            </div>

            <div className="border-t border-b border-slate-300 py-2 space-y-1 text-xs">
              {printSlipOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.name} x{it.quantity}</span>
                  <span>₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span>Total</span>
              <span>₹{printSlipOrder.totalAmount}</span>
            </div>

            <div className="pt-3 print:hidden flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
              >
                Print Slip Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT MENU ITEM */}
      {/* ========================================================================= */}
      {(showAddItemModal || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button 
              onClick={() => { setShowAddItemModal(false); setEditingItem(null); }} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Morning Tiffin">Morning Tiffin</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Healthy">Healthy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Image URL</label>
                <input
                  type="text"
                  value={menuForm.image}
                  onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold"
              >
                Save Menu Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD INGREDIENT */}
      {/* ========================================================================= */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowAddIngredientModal(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Raw Ingredient</h3>

            <form onSubmit={handleAddIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Unit</label>
                  <select
                    value={ingredientForm.unit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Current Stock</label>
                  <input
                    type="number"
                    required
                    value={ingredientForm.currentStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, currentStock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Min Threshold</label>
                  <input
                    type="number"
                    required
                    value={ingredientForm.minThreshold}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, minThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={ingredientForm.unitCost}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, unitCost: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold"
              >
                Add Ingredient
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADJUST STOCK */}
      {/* ========================================================================= */}
      {adjustingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button 
              onClick={() => setAdjustingIngredient(null)} 
              aria-label="Close adjust stock modal"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">Adjust Stock: {adjustingIngredient.name}</h3>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Movement Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Purchase">Purchase (+ Stock)</option>
                  <option value="Adjustment">Adjustment (+/- Stock)</option>
                  <option value="Consumption">Consumption (- Stock)</option>
                  <option value="Waste">Waste (- Stock)</option>
                  <option value="Return">Return (+ Stock)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Quantity Delta ({adjustingIngredient.unit})</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Vendor delivery, wastage..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold"
              >
                Record Stock Movement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5B: VIEW INGREDIENT DETAILS */}
      {/* ========================================================================= */}
      {viewingIngredient && (() => {
        const ing = viewingIngredient;
        const isCritical = ing.currentStock <= ing.minThreshold / 2;
        const isLow = ing.currentStock <= ing.minThreshold;
        const statusLabel = ing.currentStock <= 0 ? 'Out of Stock' : isCritical ? 'Critical' : isLow ? 'Low Stock' : 'Available';
        const statusColor = ing.currentStock <= 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : isCritical ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : isLow ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-5">
              <button 
                onClick={() => setViewingIngredient(null)} 
                aria-label="Close ingredient details"
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 pr-8">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider">
                    {ing.category || 'General Ingredient'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{ing.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {ing.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Current Stock</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{ing.currentStock} {ing.unit}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Min Threshold</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{ing.minThreshold} {ing.unit}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Unit Cost</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{ing.unitCost} / {ing.unit}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Storage Location</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{ing.storageLocation || 'Main Canteen Pantry'}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-semibold text-slate-500">Supplier:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{ing.supplier || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-semibold text-slate-500">Batch Number:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{ing.batchNumber || `BAT-${ing.id.toUpperCase()}`}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-semibold text-slate-500">Expiry Date:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{ing.expiryDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-semibold text-slate-500">Last Updated:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {ing.updatedAt ? new Date(ing.updatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {ing.description && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-500 block mb-1">Description:</span>
                    <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-xs">
                      {ing.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setViewingIngredient(null);
                    handleOpenEditIngredient(ing);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Ingredient</span>
                </button>
                <button
                  onClick={() => {
                    setViewingIngredient(null);
                    setAdjustingIngredient(ing);
                    setAdjustAmount(5);
                    setAdjustType('Purchase');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 5C: EDIT INGREDIENT DETAILS */}
      {/* ========================================================================= */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingIngredient(null)} 
              aria-label="Close edit ingredient modal"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 pr-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Ingredient Details</h3>
              <p className="text-xs text-slate-500">Update metadata for {editingIngredient.name}</p>
            </div>

            <form onSubmit={handleSaveEditIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  value={editIngredientForm.name}
                  onChange={(e) => setEditIngredientForm({ ...editIngredientForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Category *</label>
                  <select
                    value={editIngredientForm.category}
                    onChange={(e) => setEditIngredientForm({ ...editIngredientForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Spices">Spices</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Grains">Grains</option>
                    <option value="Oils & Ghee">Oils & Ghee</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Unit *</label>
                  <select
                    value={editIngredientForm.unit}
                    onChange={(e) => setEditIngredientForm({ ...editIngredientForm, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="packet">packet</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Minimum Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editIngredientForm.minThreshold}
                    onChange={(e) => setEditIngredientForm({ ...editIngredientForm, minThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={editIngredientForm.unitCost}
                    onChange={(e) => setEditIngredientForm({ ...editIngredientForm, unitCost: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                💡 Current stock ({editingIngredient.currentStock} {editingIngredient.unit}) cannot be overwritten directly here. Use <strong>Adjust Stock</strong> to log inventory movements.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Foods"
                    value={editIngredientForm.supplier}
                    onChange={(e) => setEditIngredientForm({ ...editIngredientForm, supplier: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Cold Storage"
                    value={editIngredientForm.storageLocation}
                    onChange={(e) => setEditIngredientForm({ ...editIngredientForm, storageLocation: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredient description..."
                  value={editIngredientForm.description}
                  onChange={(e) => setEditIngredientForm({ ...editIngredientForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIngredient(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowEditProfileModal(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Kitchen Profile</h3>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold"
              >
                Save Profile Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: CHANGE PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowChangePasswordModal(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">Change Account Password</h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (passForm.newPass !== passForm.confirmPass) {
                triggerToastError("New passwords do not match.");
                return;
              }
              setShowChangePasswordModal(false);
              setPassForm({ currentPass: '', newPass: '', confirmPass: '' });
              triggerToastSuccess("Password changed successfully!");
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passForm.currentPass}
                  onChange={(e) => setPassForm({ ...passForm, currentPass: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passForm.newPass}
                  onChange={(e) => setPassForm({ ...passForm, newPass: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passForm.confirmPass}
                  onChange={(e) => setPassForm({ ...passForm, confirmPass: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: QR CODE SCANNER MODAL */}
      {/* ========================================================================= */}
      {scannerMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative space-y-4 text-center">
            <button 
              onClick={() => setScannerMode(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">Scan Customer Order QR</h3>
            <p className="text-xs text-slate-500">Hold customer order QR code in front of camera</p>

            <div id="reader-container" className="w-full h-64 bg-black rounded-2xl overflow-hidden" />

            {cameraError && (
              <p className="text-xs text-rose-500 font-bold">{cameraError}</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffPortal;
