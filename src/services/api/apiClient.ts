import { User, UserRole, UserPermissions, getDefaultPermissionsForRole, FoodItem, Order, OrderStatus, RawIngredient, StockMovement, MovementType, KitchenAuditLog, AppNotification } from '../../types';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from '../../constants';
import { db, auth } from '../firebase/client';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, onSnapshot, orderBy, where
} from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

const fallbackLogsSeen = new Set<string>();

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isFallback = errMsg.includes('client is offline') || 
                     errMsg.includes('insufficient permissions') || 
                     errMsg.includes('permission-denied') || 
                     !auth.currentUser;

  if (isFallback) {
    const logKey = `${operationType}:${path || 'resource'}`;
    if (!fallbackLogsSeen.has(logKey)) {
      fallbackLogsSeen.add(logKey);
      console.debug(`[Local Fallback Mode] Firestore ${operationType} on ${path || 'resource'} fallback to localStore.`);
    }
  } else {
    console.warn('Firestore Operation Notice:', errMsg);
  }
}

const USERS_COLLECTION = 'users';
const MENU_COLLECTION = 'menu';
const ORDERS_COLLECTION = 'orders';
const INGREDIENTS_COLLECTION = 'ingredients';
const MOVEMENTS_COLLECTION = 'stock_movements';
const NOTIFICATIONS_COLLECTION = 'notifications';

const LOCAL_USERS_KEY = 'cravecanteen_local_users';
const LOCAL_MENU_KEY = 'cravecanteen_local_menu';
const LOCAL_ORDERS_KEY = 'cravecanteen_local_orders';
const LOCAL_COUNTER_KEY = 'cravecanteen_local_counter';
const LOCAL_INGREDIENTS_KEY = 'cravecanteen_local_ingredients';
const LOCAL_STOCK_MOVEMENTS_KEY = 'cravecanteen_local_stock_movements';
const LOCAL_NOTIFICATIONS_KEY = 'cravecanteen_local_notifications';
const LOCAL_KITCHEN_STATUS_KEY = 'cravecanteen_local_kitchen_status';
const LOCAL_AUDIT_LOG_KEY = 'cravecanteen_local_audit_log';

const menuListeners = new Set<(menu: FoodItem[]) => void>();
const orderListenerMap = new Map<string, Set<(orders: Order[]) => void>>();
const userListeners = new Map<string, Set<(user: User | null) => void>>();
const ingredientListeners = new Set<(ingredients: RawIngredient[]) => void>();
const movementListeners = new Set<(movements: StockMovement[]) => void>();
const notificationListeners = new Set<(notifs: AppNotification[]) => void>();
const kitchenStatusListeners = new Set<(status: 'Online' | 'Busy' | 'Offline') => void>();

function notifyOrderListeners() {
  orderListenerMap.forEach(set => {
    set.forEach(cb => {
      try {
        const orders = localStore.getOrders();
        cb(orders);
      } catch (e) {
        console.error(e);
      }
    });
  });
}

let activeUnsubMenu: (() => void) | null = null;
let activeUnsubIngredients: (() => void) | null = null;
let activeUnsubMovements: (() => void) | null = null;
let activeUnsubNotifs: (() => void) | null = null;
const activeUnsubUserMap = new Map<string, () => void>();
const activeUnsubOrdersMap = new Map<string, () => void>();

export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  const salted = password + '_cravecanteen_secure_salt_2026';
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    let hash = 0;
    for (let i = 0; i < salted.length; i++) {
      const char = salted.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }
}

export async function verifyPassword(inputPassword: string, user: any): Promise<boolean> {
  if (!inputPassword || !user) return false;
  if (user.passwordHash) {
    const inputHash = await hashPassword(inputPassword);
    return inputHash === user.passwordHash;
  }
  if (user.password) {
    return inputPassword === user.password;
  }
  return false;
}

export function stripSensitiveFields(user: any): User {
  if (!user) return user;
  const { password, passwordHash, ...rest } = user;
  return rest as User;
}

const DEFAULT_INGREDIENTS: RawIngredient[] = [
  { id: 'ing-1', name: 'Tomato', unit: 'kg', currentStock: 5, minThreshold: 10, unitCost: 35, category: 'Vegetables' },
  { id: 'ing-2', name: 'Onion', unit: 'kg', currentStock: 18, minThreshold: 15, unitCost: 30, category: 'Vegetables' },
  { id: 'ing-3', name: 'Cooking Oil', unit: 'L', currentStock: 2, minThreshold: 10, unitCost: 140, category: 'Oils & Ghee' },
  { id: 'ing-4', name: 'Basmati Rice', unit: 'kg', currentStock: 8, minThreshold: 25, unitCost: 90, category: 'Grains' },
  { id: 'ing-5', name: 'Paneer', unit: 'kg', currentStock: 12, minThreshold: 5, unitCost: 320, category: 'Dairy' },
  { id: 'ing-6', name: 'Fresh Chicken', unit: 'kg', currentStock: 15, minThreshold: 10, unitCost: 240, category: 'Meat & Poultry' },
  { id: 'ing-7', name: 'Toor Dal', unit: 'kg', currentStock: 20, minThreshold: 10, unitCost: 110, category: 'Pulses' },
  { id: 'ing-8', name: 'Potato', unit: 'kg', currentStock: 25, minThreshold: 15, unitCost: 25, category: 'Vegetables' },
  { id: 'ing-9', name: 'Wheat Flour (Atta)', unit: 'kg', currentStock: 30, minThreshold: 15, unitCost: 40, category: 'Grains' },
  { id: 'ing-10', name: 'Full Cream Milk', unit: 'L', currentStock: 4, minThreshold: 15, unitCost: 60, category: 'Dairy' },
];

const DEFAULT_MOVEMENTS: StockMovement[] = [];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

const DEFAULT_USERS: (User & { password?: string })[] = [
  {
    id: 'staff-admin',
    name: 'Kitchen Admin',
    email: 'abc@gmail.com',
    phoneNumber: '',
    role: UserRole.STAFF,
    password: '123456',
    rewardPoints: 500,
    walletBalance: 0,
    favorites: []
  },
  {
    id: 'staff-sundar',
    name: 'Sundar',
    email: 'sundar48807@gmail.com',
    phoneNumber: '',
    role: UserRole.STAFF,
    password: '123456',
    rewardPoints: 500,
    walletBalance: 0,
    favorites: []
  },
  {
    id: 'faculty-demo',
    name: 'Prof. Sharma',
    email: 'prof.sharma@campus.edu',
    phoneNumber: '+919812345678',
    role: UserRole.FACULTY,
    password: '123456',
    rewardPoints: 350,
    walletBalance: 0,
    favorites: []
  },
  {
    id: 'student-demo',
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    phoneNumber: '+919876543210',
    role: UserRole.STUDENT,
    password: '123456',
    rewardPoints: 100,
    walletBalance: 0,
    favorites: []
  }
];

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const safeStorage = (typeof window !== 'undefined' && window.localStorage)
  ? window.localStorage
  : ((globalThis as any).localStorage || new MemoryStorage());

export const localStore = {
  getUsers(): (User & { password?: string })[] {
    try {
      const data = safeStorage.getItem(LOCAL_USERS_KEY);
      if (data) {
        let parsed: (User & { password?: string })[] = JSON.parse(data);
        // Ensure walletBalance is initialized to 0 if undefined
        parsed = parsed.map(u => ({ ...u, walletBalance: u.walletBalance ?? 0 }));
        let updated = false;
        DEFAULT_USERS.forEach(defUser => {
          if (!parsed.some(u => u.id === defUser.id || (u.email && u.email.toLowerCase() === defUser.email.toLowerCase()))) {
            parsed.push(defUser);
            updated = true;
          }
        });
        if (updated) {
          safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.warn("LocalStore getUsers parse error:", e);
    }
    safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  },

  getUser(userId: string): User | null {
    const users = this.getUsers();
    const found = users.find(u => u.id === userId);
    if (found) {
      return stripSensitiveFields(found);
    }
    return null;
  },

  saveUser(user: User & { password?: string; passwordHash?: string }): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    try {
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn("LocalStore saveUser storage error:", e);
    }

    const cleanUser = stripSensitiveFields(user);
    const userSet = userListeners.get(user.id);
    if (userSet) {
      userSet.forEach(cb => {
        try { cb(cleanUser); } catch (e) { console.error(e); }
      });
    }
    return cleanUser;
  },

  loginUser(identifier: string, password?: string): User | null {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/\D/g, '');

    const found = users.find(u => {
      const emailMatches = u.email && u.email.toLowerCase() === cleanId;
      const usernameMatches = u.username && u.username.toLowerCase() === cleanId;
      const phoneClean = u.phoneNumber ? u.phoneNumber.replace(/\D/g, '') : '';
      const phoneMatches = phoneClean && (phoneClean === digitsOnly || (digitsOnly.length >= 10 && phoneClean.endsWith(digitsOnly.slice(-10))));
      return emailMatches || usernameMatches || phoneMatches;
    });

    if (!found) return null;

    const userStatus = (found.status || 'ACTIVE').toUpperCase();
    if (userStatus === 'INACTIVE' || userStatus === 'SUSPENDED') {
      throw new Error("Your account is currently inactive. Please contact system administrator.");
    }

    if (password) {
      if (found.passwordHash) {
        // Hash will be checked asynchronously in api.loginUser if needed
      } else if (found.password && found.password !== password) {
        return null;
      }
    }

    return stripSensitiveFields(found);
  },

  getMenu(): FoodItem[] {
    try {
      const data = safeStorage.getItem(LOCAL_MENU_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((item: any) => item.id || item.itemCode));
          let updated = false;
          INITIAL_MENU_ITEMS.forEach(item => {
            if (!existingIds.has(item.id) && !existingIds.has(item.itemCode)) {
              parsed.push(item);
              updated = true;
            }
          });
          if (updated) {
            try {
              safeStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(parsed));
            } catch (err) {
              console.warn("Error updating merged menu to localStorage:", err);
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("LocalStore getMenu parse error:", e);
    }
    try {
      safeStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(INITIAL_MENU_ITEMS));
    } catch (e) {
      console.warn("LocalStore getMenu store error:", e);
    }
    return INITIAL_MENU_ITEMS;
  },

  updateMenu(menu: FoodItem[], notify = true): void {
    const normalizedMenu = menu.map(item => {
      const stockQty = item.stockQuantity ?? item.stock ?? 0;
      const reserved = item.reservedQuantity || 0;
      const availableQty = Math.max(0, stockQty - reserved);
      return {
        ...item,
        stockQuantity: stockQty,
        stock: stockQty,
        reservedQuantity: reserved,
        availableQuantity: availableQty,
        isAvailable: availableQty > 0
      };
    });
    try {
      safeStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(normalizedMenu));
    } catch (e) {
      console.warn("LocalStore updateMenu error:", e);
    }
    if (notify) {
      menuListeners.forEach(cb => {
        try { cb(normalizedMenu); } catch (e) { console.error(e); }
      });
    }
  },

  getOrders(userId?: string, role?: string): Order[] {
    let orders: Order[] = [];
    try {
      const data = safeStorage.getItem(LOCAL_ORDERS_KEY);
      if (data) {
        orders = JSON.parse(data);
      }
    } catch (e) {
      console.warn("LocalStore getOrders parse error:", e);
    }
    if (role === 'STAFF') {
      return [...orders].sort((a, b) => b.createdAt - a.createdAt);
    }
    if (userId) {
      return orders.filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
  },

  getNextOrderId(): number {
    let counter = 101;
    try {
      const data = safeStorage.getItem(LOCAL_COUNTER_KEY);
      if (data) {
        counter = parseInt(data, 10) || 101;
      }
    } catch (e) {
      console.warn("LocalStore counter error:", e);
    }
    return counter;
  },

  createOrder(order: Omit<Order, 'id'> & { id?: string }): Order {
    let orders: Order[] = [];
    try {
      const data = safeStorage.getItem(LOCAL_ORDERS_KEY);
      if (data) {
        orders = JSON.parse(data);
      }
    } catch (e) {
      console.warn("LocalStore createOrder parse error:", e);
    }

    // Idempotency check: if clientRequestId matches existing order, return it to prevent duplicate creation
    if (order.clientRequestId) {
      const existing = orders.find(o => o.clientRequestId === order.clientRequestId);
      if (existing) return existing;
    }

    const currentMenu = this.getMenu();

    // 1. Validate Stock Availability & Server-Side Prices
    let validatedTotal = 0;
    const validatedItems = order.items.map(item => {
      const menuItem = currentMenu.find(m => m.id === item.foodId);
      if (!menuItem) {
        throw new Error(`Item "${item.name}" not found in canteen catalogue.`);
      }
      const stockQty = menuItem.stockQuantity ?? menuItem.stock ?? 0;
      const reserved = menuItem.reservedQuantity || 0;
      const available = (menuItem.availableQuantity !== undefined) ? menuItem.availableQuantity : Math.max(0, stockQty - reserved);

      if (available <= 0) {
        throw new Error(`"${menuItem.name}" is currently OUT OF STOCK and cannot be ordered.`);
      }
      if (item.quantity > available) {
        throw new Error(`Only ${available} unit(s) of "${menuItem.name}" available in stock. Requested: ${item.quantity}.`);
      }

      const verifiedPrice = menuItem.price;
      validatedTotal += verifiedPrice * item.quantity;
      return {
        ...item,
        price: verifiedPrice,
        name: menuItem.name
      };
    });

    const isCashOrder = order.paymentMethod === 'CASH';
    const computedPaymentStatus = isCashOrder ? 'PENDING' : 'PAID';
    const computedOrderStatus = isCashOrder ? OrderStatus.PENDING_PAYMENT : OrderStatus.ACCEPTED;

    const nextId = this.getNextOrderId();
    try {
      safeStorage.setItem(LOCAL_COUNTER_KEY, String(nextId + 1));
    } catch (e) {
      console.warn("LocalStore setCounter error:", e);
    }

    const finalOrder: Order = {
      ...order,
      items: validatedItems,
      totalAmount: validatedTotal,
      paymentStatus: computedPaymentStatus,
      status: computedOrderStatus,
      id: order.id || `ORD-${nextId}`
    } as Order;

    orders.unshift(finalOrder);
    try {
      safeStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn("LocalStore saveOrders error:", e);
    }

    // 2. Deduct Stock & Record Stock Movement
    let stockChanged = false;
    const updatedMenu = currentMenu.map(menuItem => {
      const orderItem = finalOrder.items.find(it => it.foodId === menuItem.id);
      if (orderItem) {
        stockChanged = true;
        const currentStock = menuItem.stockQuantity ?? menuItem.stock ?? 0;
        const reserved = menuItem.reservedQuantity || 0;
        const newStock = Math.max(0, currentStock - orderItem.quantity);
        const newAvailable = Math.max(0, newStock - reserved);
        const minLevel = menuItem.minimumStockLevel ?? 5;

        // Log Stock Movement
        this.addStockMovement({
          itemId: menuItem.id,
          itemName: menuItem.name,
          type: 'SALE',
          quantity: orderItem.quantity,
          previousStock: currentStock,
          newStock: newStock,
          reference: finalOrder.id,
          user: finalOrder.userName || 'Customer',
          notes: `Order #${finalOrder.id} (${finalOrder.paymentMethod})`
        });

        // Add Notification if Low Stock or Out of Stock
        if (newAvailable === 0) {
          this.addKitchenNotification({
            title: `Out of Stock: ${menuItem.name}`,
            message: `${menuItem.name} is now out of stock and disabled for ordering.`,
            category: 'Stock',
            link: '/kitchen/inventory'
          });
        } else if (newAvailable <= minLevel) {
          this.addKitchenNotification({
            title: `Low Stock Alert: ${menuItem.name}`,
            message: `Only ${newAvailable} ${menuItem.unit || 'units'} of ${menuItem.name} left in stock.`,
            category: 'Stock',
            link: '/kitchen/inventory'
          });
        }

        return {
          ...menuItem,
          stockQuantity: newStock,
          stock: newStock,
          reservedQuantity: reserved,
          availableQuantity: newAvailable,
          isAvailable: newAvailable > 0
        };
      }
      return menuItem;
    });

    if (stockChanged) {
      this.updateMenu(updatedMenu, true);
    }

    // Notify Kitchen ONLY IF order is paid (not pending cash counter payment)
    if (computedPaymentStatus === 'PAID') {
      this.addKitchenNotification({
        title: `New Confirmed Order: #${finalOrder.id}`,
        message: `${finalOrder.userName} placed a confirmed order for ₹${finalOrder.totalAmount}.`,
        category: 'Orders',
        link: '/kitchen/orders'
      });
    }

    notifyOrderListeners();

    return finalOrder;
  },

  confirmCounterCashPayment(orderId: string, counterStaffName: string = 'POS Counter Staff'): Order {
    let orders: Order[] = [];
    try {
      const data = safeStorage.getItem(LOCAL_ORDERS_KEY);
      if (data) orders = JSON.parse(data);
    } catch (e) {}

    const index = orders.findIndex(o => o.id === orderId);
    if (index < 0) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const targetOrder = orders[index];
    if (targetOrder.paymentStatus === 'PAID' && targetOrder.status !== OrderStatus.PENDING_PAYMENT) {
      return targetOrder;
    }

    const updatedOrder: Order = {
      ...targetOrder,
      paymentStatus: 'PAID',
      status: OrderStatus.ACCEPTED,
      checkInTime: Date.now()
    };

    orders[index] = updatedOrder;
    try {
      safeStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {}

    // Add Kitchen Notification once payment is received
    this.addKitchenNotification({
      title: `Cash Payment Confirmed: #${updatedOrder.id}`,
      message: `${updatedOrder.userName} paid ₹${updatedOrder.totalAmount} cash at counter (${counterStaffName}). Sent to kitchen.`,
      category: 'Orders',
      link: '/kitchen/orders'
    });

    notifyOrderListeners();

    return updatedOrder;
  },

  restockFoodItem(foodId: string, quantityToAdd: number, staffUser: string = 'Staff', role?: string): FoodItem[] {
    if (role && !['STAFF', 'KITCHEN_STAFF', 'COUNTER_STAFF', 'CANTEEN_MANAGER', 'VENDOR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      throw new Error('Unauthorized: Only staff members can restock food items.');
    }

    if (typeof quantityToAdd !== 'number' || isNaN(quantityToAdd)) {
      throw new Error('Please enter a restock quantity.');
    }

    if (!Number.isInteger(quantityToAdd)) {
      throw new Error('Please enter a whole number.');
    }

    if (quantityToAdd <= 0) {
      throw new Error('Restock quantity must be a positive whole number greater than 0.');
    }

    if (quantityToAdd > 100000) {
      throw new Error('Restock quantity exceeds maximum allowable limit.');
    }

    const currentMenu = this.getMenu();
    const targetItem = currentMenu.find(item => item.id === foodId);

    if (!targetItem) {
      throw new Error('Food item not found.');
    }

    if (targetItem.isActive === false) {
      throw new Error('Food item is inactive.');
    }

    let updated = false;
    const newMenu = currentMenu.map(item => {
      if (item.id === foodId) {
        updated = true;
        const currentStock = item.stockQuantity ?? item.stock ?? 0;
        const reserved = item.reservedQuantity || 0;
        const newStock = currentStock + quantityToAdd;
        const newAvailable = Math.max(0, newStock - reserved);

        this.addStockMovement({
          itemId: item.id,
          itemName: item.name,
          type: 'RESTOCK',
          quantity: quantityToAdd,
          previousStock: currentStock,
          newStock: newStock,
          reference: `RESTOCK-${Date.now()}`,
          user: staffUser,
          notes: `Restock +${quantityToAdd} units`
        });

        return {
          ...item,
          stockQuantity: newStock,
          stock: newStock,
          reservedQuantity: reserved,
          availableQuantity: newAvailable,
          isAvailable: newAvailable > 0,
          updatedAt: Date.now()
        };
      }
      return item;
    });

    if (updated) {
      this.updateMenu(newMenu, true);
    }
    return newMenu;
  },

  updateOrderStatus(orderId: string, status: OrderStatus, extra?: Partial<Order>): void {
    let orders: Order[] = [];
    try {
      const data = safeStorage.getItem(LOCAL_ORDERS_KEY);
      if (data) {
        orders = JSON.parse(data);
      }
    } catch (e) {
      console.warn("LocalStore updateOrderStatus parse error:", e);
    }

    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      orders[index] = { ...orders[index], status, ...extra };
      try {
        safeStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
      } catch (e) {
        console.warn("LocalStore saveOrderStatus error:", e);
      }
      notifyOrderListeners();
    }
  },

  toggleFavorite(userId: string, foodId: string): string[] {
    const user = this.getUser(userId);
    if (!user) return [];
    const favs = user.favorites || [];
    const updated = favs.includes(foodId) ? favs.filter(id => id !== foodId) : [...favs, foodId];
    this.saveUser({ ...user, favorites: updated });
    return updated;
  },

  getIngredients(): RawIngredient[] {
    try {
      const data = safeStorage.getItem(LOCAL_INGREDIENTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("LocalStore getIngredients parse error:", e);
    }
    try {
      safeStorage.setItem(LOCAL_INGREDIENTS_KEY, JSON.stringify(DEFAULT_INGREDIENTS));
    } catch (e) {}
    return DEFAULT_INGREDIENTS;
  },

  updateIngredient(ingredient: RawIngredient): RawIngredient[] {
    const list = this.getIngredients();
    const idx = list.findIndex(i => i.id === ingredient.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...ingredient, updatedAt: Date.now() };
    } else {
      list.push({ ...ingredient, updatedAt: Date.now() });
    }
    try {
      localStorage.setItem(LOCAL_INGREDIENTS_KEY, JSON.stringify(list));
    } catch (e) {}
    ingredientListeners.forEach(cb => { try { cb(list); } catch (err) {} });

    // Evaluate low stock threshold and trigger alert if necessary
    if (ingredient.currentStock <= ingredient.minThreshold) {
      const title = ingredient.currentStock <= ingredient.minThreshold / 2 ? 'Critical Stock Alert' : 'Low Stock Alert';
      this.addKitchenNotification({
        title: `${title}: ${ingredient.name}`,
        message: `${ingredient.name} stock is down to ${ingredient.currentStock} ${ingredient.unit} (Min: ${ingredient.minThreshold} ${ingredient.unit}).`,
        category: 'Stock',
        link: '/kitchen/inventory'
      });
    }

    return list;
  },

  addIngredient(ing: Omit<RawIngredient, 'id'>): RawIngredient {
    const newIng: RawIngredient = {
      ...ing,
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      updatedAt: Date.now()
    };
    this.updateIngredient(newIng);
    return newIng;
  },

  saveIngredients(list: RawIngredient[]): void {
    try {
      safeStorage.setItem(LOCAL_INGREDIENTS_KEY, JSON.stringify(list));
    } catch (e) {}
    ingredientListeners.forEach(cb => { try { cb(list); } catch (err) {} });
  },

  deleteIngredient(id: string): RawIngredient[] {
    const list = this.getIngredients().filter(i => i.id !== id);
    try {
      safeStorage.setItem(LOCAL_INGREDIENTS_KEY, JSON.stringify(list));
    } catch (e) {}
    ingredientListeners.forEach(cb => { try { cb(list); } catch (err) {} });
    return list;
  },

  getStockMovements(): StockMovement[] {
    try {
      const data = safeStorage.getItem(LOCAL_STOCK_MOVEMENTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    try {
      safeStorage.setItem(LOCAL_STOCK_MOVEMENTS_KEY, JSON.stringify(DEFAULT_MOVEMENTS));
    } catch (e) {}
    return DEFAULT_MOVEMENTS;
  },

  addStockMovement(mv: Omit<StockMovement, 'id' | 'timestamp'>): StockMovement {
    const list = this.getStockMovements();
    const newMv: StockMovement = {
      ...mv,
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now()
    };
    list.unshift(newMv);
    try {
      safeStorage.setItem(LOCAL_STOCK_MOVEMENTS_KEY, JSON.stringify(list));
    } catch (e) {}
    movementListeners.forEach(cb => { try { cb(list); } catch (err) {} });
    return newMv;
  },

  getKitchenNotifications(): AppNotification[] {
    try {
      const data = safeStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    try {
      safeStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    } catch (e) {}
    return DEFAULT_NOTIFICATIONS;
  },

  markNotificationRead(id: string): AppNotification[] {
    const list = this.getKitchenNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    try {
      safeStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list));
    } catch (e) {}
    notificationListeners.forEach(cb => { try { cb(list); } catch (err) {} });
    return list;
  },

  markAllNotificationsRead(): AppNotification[] {
    const list = this.getKitchenNotifications().map(n => ({ ...n, read: true }));
    try {
      safeStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list));
    } catch (e) {}
    notificationListeners.forEach(cb => { try { cb(list); } catch (err) {} });
    return list;
  },

  addKitchenNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const list = this.getKitchenNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      read: false
    };
    list.unshift(newNotif);
    try {
      safeStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list));
    } catch (e) {}
    notificationListeners.forEach(cb => { try { cb(list); } catch (err) {} });

    try {
      setDoc(doc(db, NOTIFICATIONS_COLLECTION, newNotif.id), newNotif).catch(e => {
        handleFirestoreError(e, OperationType.CREATE, NOTIFICATIONS_COLLECTION);
      });
    } catch (e) {}

    return newNotif;
  },

  getKitchenStatus(): 'Online' | 'Busy' | 'Offline' {
    try {
      const status = safeStorage.getItem(LOCAL_KITCHEN_STATUS_KEY);
      if (status && ['Online', 'Busy', 'Offline'].includes(status)) return status as any;
    } catch (e) {}
    return 'Online';
  },

  setKitchenStatus(status: 'Online' | 'Busy' | 'Offline'): void {
    try {
      safeStorage.setItem(LOCAL_KITCHEN_STATUS_KEY, status);
    } catch (e) {}
    kitchenStatusListeners.forEach(cb => { try { cb(status); } catch (err) {} });
  },

  addAuditLog(log: Omit<KitchenAuditLog, 'id' | 'timestamp'>): KitchenAuditLog {
    let logs: KitchenAuditLog[] = [];
    try {
      const data = safeStorage.getItem(LOCAL_AUDIT_LOG_KEY);
      if (data) logs = JSON.parse(data);
    } catch (e) {}
    const newLog: KitchenAuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now()
    };
    logs.unshift(newLog);
    try {
      safeStorage.setItem(LOCAL_AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (e) {}
    return newLog;
  },

  getAuditLogs(): KitchenAuditLog[] {
    try {
      const data = safeStorage.getItem(LOCAL_AUDIT_LOG_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [];
  }
};

export const api = {
  async getAllUsers(): Promise<User[]> {
    let rawUsers: User[] = [];
    try {
      const snap = await getDocs(collection(db, USERS_COLLECTION));
      if (!snap.empty) {
        rawUsers = snap.docs.map(d => {
          const u = d.data() as User & { password?: string };
          const { password: _, ...rest } = u;
          return rest as User;
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    }

    if (rawUsers.length === 0) {
      rawUsers = localStore.getUsers().map(({ password: _, ...u }) => u as User);
    }

    // Process and attach defaults for existing records for 100% backward compatibility
    return rawUsers.map(u => ({
      ...u,
      username: u.username || (u.email ? u.email.split('@')[0] : u.id),
      status: u.status || 'ACTIVE',
      accessLevel: u.accessLevel || (['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN'].includes(String(u.role)) ? 'Full Admin' : 'Standard'),
      permissions: u.permissions || getDefaultPermissionsForRole(u.role),
      createdAt: u.createdAt || Date.now(),
      updatedAt: u.updatedAt || u.createdAt || Date.now()
    }));
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${USERS_COLLECTION}/${userId}`);
    }
    const users = localStore.getUsers().filter(u => u.id !== userId);
    try {
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch (e) {}
  },

  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (userDoc.exists()) {
        const user = userDoc.data() as User & { password?: string };
        const { password: _, ...rest } = user;
        const processed: User = {
          ...rest,
          username: rest.username || (rest.email ? rest.email.split('@')[0] : rest.id),
          status: rest.status || 'ACTIVE',
          accessLevel: rest.accessLevel || (['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN'].includes(String(rest.role)) ? 'Full Admin' : 'Standard'),
          permissions: rest.permissions || getDefaultPermissionsForRole(rest.role),
          createdAt: rest.createdAt || Date.now(),
          updatedAt: rest.updatedAt || rest.createdAt || Date.now()
        };
        localStore.saveUser(processed);
        return processed;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
    }
    return localStore.getUser(userId);
  },

  async registerUser(user: User & { password?: string }, executingUser?: User | null): Promise<User> {
    // 1. Backend Validation
    if (!user.name || !user.name.trim()) {
      throw new Error("Full Name is required.");
    }
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : '';
    const cleanPhone = user.phoneNumber ? user.phoneNumber.trim() : '';
    if (!cleanEmail && !cleanPhone) {
      throw new Error("Either Email or Mobile Number is required.");
    }

    const allExisting = await this.getAllUsers();

    if (cleanEmail) {
      const duplicateEmail = allExisting.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (duplicateEmail) {
        throw new Error(`Email "${cleanEmail}" is already registered by another account.`);
      }
    }

    const cleanUsername = user.username ? user.username.trim().toLowerCase() : '';
    if (cleanUsername) {
      const duplicateUsername = allExisting.find(u => u.username && u.username.toLowerCase() === cleanUsername);
      if (duplicateUsername) {
        throw new Error(`Username "${user.username}" is already taken.`);
      }
    }

    const targetId = user.employeeId || user.studentId || user.rollNumber;
    if (targetId) {
      const duplicateId = allExisting.find(u => (u.employeeId === targetId || u.studentId === targetId || u.rollNumber === targetId));
      if (duplicateId) {
        throw new Error(`ID "${targetId}" is already assigned to user "${duplicateId.name}".`);
      }
    }

    // Backend Role Validation
    const VALID_ROLES = [
      'STUDENT', 'FACULTY', 'KITCHEN', 'STAFF', 'COUNTER_STAFF', 
      'KITCHEN_STAFF', 'CANTEEN_MANAGER', 'VENDOR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMER'
    ];
    const roleStr = String(user.role || '').toUpperCase();
    if (!roleStr || !VALID_ROLES.includes(roleStr)) {
      throw new Error("Please select a valid role (STUDENT, FACULTY, or KITCHEN).");
    }

    let uid = user.id;
    const isKitchenRole = ['KITCHEN', 'STAFF', 'KITCHEN_STAFF', 'COUNTER_STAFF', 'CANTEEN_MANAGER'].includes(roleStr);

    try {
      let authEmail = user.email;
      if (!authEmail && user.phoneNumber) {
        authEmail = `${user.phoneNumber.replace('+', '')}@cravecanteen.app`;
      }
      
      const isCurrentAuthUser = auth.currentUser && (auth.currentUser.uid === uid || (authEmail && auth.currentUser.email?.toLowerCase() === authEmail.toLowerCase()));
      const isAdminCreatingOtherUser = executingUser || (auth.currentUser && !isCurrentAuthUser);

      // ONLY call createUserWithEmailAndPassword if self-registering, NOT a kitchen user, and no admin session is active
      if (!isKitchenRole && !isAdminCreatingOtherUser && !isCurrentAuthUser && user.password && user.password.length >= 6 && authEmail && authEmail.includes('@') && (!uid || uid.startsWith('usr-') || uid === 'temp-id')) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, authEmail, user.password);
          uid = userCredential.user.uid;
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            try {
              const signinCred = await signInWithEmailAndPassword(auth, authEmail, user.password);
              uid = signinCred.user.uid;
            } catch (sErr) {
              // Proceed with local database record
            }
          }
        }
      }
    } catch (error: any) {
      console.warn("Firebase Auth registration notice:", error);
    }

    const now = Date.now();
    const hashedPass = user.password ? await hashPassword(user.password) : undefined;

    const newUser: User & { passwordHash?: string } = {
      id: uid && uid !== 'temp-id' ? uid : `usr-${now}-${Math.random().toString(36).substring(2, 6)}`,
      name: user.name.trim(),
      username: user.username?.trim() || (user.email ? user.email.split('@')[0] : `user_${now}`),
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      avatar: user.avatar || '',
      rewardPoints: user.rewardPoints ?? 100,
      walletBalance: user.walletBalance ?? 0,
      favorites: user.favorites || [],

      // Personal Info
      dob: user.dob || '',
      gender: user.gender || 'Prefer Not to Say',

      // Org Info
      employeeId: user.employeeId || '',
      studentId: user.studentId || user.rollNumber || '',
      rollNumber: user.rollNumber || user.studentId || '',
      department: user.department || '',
      yearClass: user.yearClass || '',
      kitchenId: user.kitchenId || user.kitchenBranch || '',
      kitchenBranch: user.kitchenBranch || user.kitchenId || '',
      designation: user.designation || '',
      joiningDate: user.joiningDate || new Date(now).toISOString().split('T')[0],
      address: user.address || '',
      emergencyContact: user.emergencyContact || '',
      hostelBlock: user.hostelBlock || '',

      // Account & Authorization
      accessLevel: user.accessLevel || (['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER'].includes(String(user.role)) ? 'Full Admin' : 'Standard'),
      status: user.status || 'ACTIVE',
      permissions: user.permissions || getDefaultPermissionsForRole(user.role),

      // Audit Info
      createdBy: executingUser?.id || 'system',
      createdByName: executingUser?.name || 'System Administrator',
      createdAt: now,
      updatedBy: executingUser?.id || 'system',
      updatedByName: executingUser?.name || 'System Administrator',
      updatedAt: now,
      passwordHash: hashedPass
    };

    try {
      await setDoc(doc(db, USERS_COLLECTION, newUser.id), newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${USERS_COLLECTION}/${newUser.id}`);
    }

    localStore.saveUser(newUser);
    return stripSensitiveFields(newUser);
  },

  async updateUser(userId: string, updates: Partial<User & { password?: string; passwordHash?: string }>, executingUser?: User | null): Promise<User> {
    const existing = await this.getUser(userId) || localStore.getUser(userId);
    if (!existing) {
      throw new Error(`User account with ID "${userId}" not found.`);
    }

    // Authorization & Protected Field Check
    if (executingUser) {
      const execRole = String(executingUser.role || '').toUpperCase();
      const isExecAdmin = ['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN', 'STAFF', 'KITCHEN', 'KITCHEN_STAFF', 'COUNTER_STAFF'].includes(execRole);
      const isSelf = executingUser.id === userId;

      if (!isExecAdmin && !isSelf) {
        throw new Error("Unauthorized: You do not have permission to modify other user accounts.");
      }

      if (!isExecAdmin && (updates.role || updates.accessLevel || updates.status || updates.permissions)) {
        throw new Error("Unauthorized: Non-admin users cannot alter account roles, status, access levels, or security permissions.");
      }
    }

    // Backend Unique Checks on update
    const allExisting = await this.getAllUsers();

    if (updates.email && updates.email.trim().toLowerCase() !== existing.email?.toLowerCase()) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const duplicateEmail = allExisting.find(u => u.email && u.email.toLowerCase() === cleanEmail && u.id !== userId);
      if (duplicateEmail) {
        throw new Error(`Email "${cleanEmail}" is already in use by user "${duplicateEmail.name}".`);
      }
    }

    if (updates.username && updates.username.trim().toLowerCase() !== existing.username?.toLowerCase()) {
      const cleanUsername = updates.username.trim().toLowerCase();
      const duplicateUsername = allExisting.find(u => u.username && u.username.toLowerCase() === cleanUsername && u.id !== userId);
      if (duplicateUsername) {
        throw new Error(`Username "${updates.username}" is already taken.`);
      }
    }

    const newTargetId = updates.employeeId || updates.studentId;
    if (newTargetId) {
      const duplicateId = allExisting.find(u => (u.employeeId === newTargetId || u.studentId === newTargetId) && u.id !== userId);
      if (duplicateId) {
        throw new Error(`Employee/Student ID "${newTargetId}" is already assigned to user "${duplicateId.name}".`);
      }
    }

    const now = Date.now();
    const updatedData: Partial<User & { passwordHash?: string }> = {
      ...updates,
      updatedAt: now,
      updatedBy: executingUser?.id || existing.updatedBy || 'system',
      updatedByName: executingUser?.name || existing.updatedByName || 'System'
    };

    if (updates.password) {
      if (updates.password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      updatedData.passwordHash = await hashPassword(updates.password);
      delete (updatedData as any).password;
    }

    const merged = { 
      ...existing, 
      ...updatedData 
    } as User;

    localStore.saveUser(merged as any);

    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await setDoc(userRef, updatedData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
    }

    return stripSensitiveFields(merged);
  },

  async toggleUserStatus(userId: string, newStatus: string, executingUser?: User | null): Promise<User> {
    if (executingUser) {
      const execRole = String(executingUser.role || '').toUpperCase();
      const isExecAdmin = ['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN', 'STAFF', 'KITCHEN', 'KITCHEN_STAFF', 'COUNTER_STAFF'].includes(execRole);
      if (!isExecAdmin) {
        throw new Error("Unauthorized: Only an administrator can activate or deactivate user accounts.");
      }
    }
    return this.updateUser(userId, { status: newStatus }, executingUser);
  },

  async resetUserPassword(userId: string, newPassword: string, executingUser?: User | null): Promise<User> {
    if (executingUser) {
      const execRole = String(executingUser.role || '').toUpperCase();
      const isExecAdmin = ['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER', 'VENDOR_ADMIN', 'STAFF', 'KITCHEN', 'KITCHEN_STAFF', 'COUNTER_STAFF'].includes(execRole);
      if (!isExecAdmin) {
        throw new Error("Unauthorized: Only an administrator can reset user passwords.");
      }
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    return this.updateUser(userId, { password: newPassword }, executingUser);
  },

  subscribeToUser(userId: string, callback: (user: User | null) => void): () => void {
    callback(localStore.getUser(userId));

    if (!userListeners.has(userId)) {
      userListeners.set(userId, new Set());
    }
    const listenerSet = userListeners.get(userId)!;
    listenerSet.add(callback);

    if (!activeUnsubUserMap.has(userId)) {
      try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const unsub = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const user = docSnap.data();
            const stripped = stripSensitiveFields(user);
            userListeners.get(userId)?.forEach(cb => cb(stripped));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
        });
        activeUnsubUserMap.set(userId, unsub);
      } catch (e) {
        console.warn("Could not attach Firestore user listener:", e);
      }
    }

    return () => {
      const set = userListeners.get(userId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          userListeners.delete(userId);
          const activeUnsub = activeUnsubUserMap.get(userId);
          if (activeUnsub) {
            activeUnsub();
            activeUnsubUserMap.delete(userId);
          }
        }
      }
    };
  },

  async loginUser(identifier: string, password?: string): Promise<User | null> {
    if (!password) return null;

    const cleanId = identifier.trim();

    // 1. Authenticate against local database records first
    const users = localStore.getUsers();
    const digitsOnly = cleanId.replace(/\D/g, '');

    const found = users.find(u => {
      const emailMatches = u.email && u.email.toLowerCase() === cleanId.toLowerCase();
      const usernameMatches = u.username && u.username.toLowerCase() === cleanId.toLowerCase();
      const phoneClean = u.phoneNumber ? u.phoneNumber.replace(/\D/g, '') : '';
      const phoneMatches = phoneClean && (phoneClean === digitsOnly || (digitsOnly.length >= 10 && phoneClean.endsWith(digitsOnly.slice(-10))));
      return emailMatches || usernameMatches || phoneMatches;
    });

    if (found) {
      const st = (found.status || 'ACTIVE').toUpperCase();
      if (st === 'INACTIVE' || st === 'SUSPENDED') {
        throw new Error("Your account is currently inactive. Please contact system administrator.");
      }

      const isValidPass = await verifyPassword(password, found);
      if (!isValidPass) {
        return null;
      }

      // Upgrade to passwordHash if missing
      if (!found.passwordHash && found.password) {
        found.passwordHash = await hashPassword(found.password);
        delete found.password;
        localStore.saveUser(found);
      }

      return stripSensitiveFields(found);
    }

    // 2. If not found in localStore, attempt single Firebase Auth login
    let email = cleanId;
    if (email.startsWith('+91')) {
      email = `${email.replace('+', '')}@cravecanteen.app`;
    } else if (!email.includes('@')) {
      email = `+91${email}@cravecanteen.app`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));
      if (userDoc.exists()) {
        const user = userDoc.data();
        const st = (user.status || 'ACTIVE').toUpperCase();
        if (st === 'INACTIVE' || st === 'SUSPENDED') {
          throw new Error("Your account is currently inactive. Please contact system administrator.");
        }
        localStore.saveUser(user as User);
        return stripSensitiveFields(user);
      }
    } catch (error: any) {
      if (error?.message?.includes('inactive')) throw error;
      // Gracefully handle auth error
    }

    // 3. Fallback: Query Firestore users collection for matching email, username or phone number
    try {
      const qEmail = query(collection(db, USERS_COLLECTION), where('email', '==', cleanId.toLowerCase()));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        const userDocData = snapEmail.docs[0].data();
        const st = (userDocData.status || 'ACTIVE').toUpperCase();
        if (st === 'INACTIVE' || st === 'SUSPENDED') {
          throw new Error("Your account is currently inactive. Please contact system administrator.");
        }
        const isValidPass = await verifyPassword(password, userDocData);
        if (isValidPass) {
          localStore.saveUser(userDocData as User);
          return stripSensitiveFields(userDocData);
        }
      }

      const qPhone = query(collection(db, USERS_COLLECTION), where('phoneNumber', '==', cleanId));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        const userDocData = snapPhone.docs[0].data();
        const st = (userDocData.status || 'ACTIVE').toUpperCase();
        if (st === 'INACTIVE' || st === 'SUSPENDED') {
          throw new Error("Your account is currently inactive. Please contact system administrator.");
        }
        const isValidPass = await verifyPassword(password, userDocData);
        if (isValidPass) {
          localStore.saveUser(userDocData as User);
          return stripSensitiveFields(userDocData);
        }
      }
    } catch (fsErr: any) {
      if (fsErr?.message?.includes('inactive')) throw fsErr;
      console.warn("Firestore user lookup fallback notice:", fsErr);
    }

    return null;
  },

  async getMenu(): Promise<FoodItem[]> {
    try {
      const snapshot = await getDocs(collection(db, MENU_COLLECTION));
      if (!snapshot.empty) {
        const items = snapshot.docs.map(docSnap => docSnap.data() as FoodItem);
        localStore.updateMenu(items, false);
        return items;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, MENU_COLLECTION);
    }
    return localStore.getMenu();
  },

  subscribeToMenu(callback: (menu: FoodItem[]) => void): () => void {
    callback(localStore.getMenu());
    menuListeners.add(callback);

    if (!activeUnsubMenu) {
      try {
        const q = query(collection(db, MENU_COLLECTION));
        activeUnsubMenu = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const menu = snapshot.docs.map(docSnap => docSnap.data() as FoodItem);
            localStore.updateMenu(menu, false);
            menuListeners.forEach(cb => cb(menu));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, MENU_COLLECTION);
        });
      } catch (e) {
        console.warn("Could not attach Firestore menu listener:", e);
      }
    }

    return () => {
      menuListeners.delete(callback);
      if (menuListeners.size === 0 && activeUnsubMenu) {
        activeUnsubMenu();
        activeUnsubMenu = null;
      }
    };
  },

  async updateMenu(menu: FoodItem[]): Promise<void> {
    localStore.updateMenu(menu, true);
    try {
      const batch = menu.map(item => setDoc(doc(db, MENU_COLLECTION, item.id), item));
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, MENU_COLLECTION);
    }
  },

  async restockFoodItem(foodId: string, quantityToAdd: number, staffUser: string = 'Staff', role?: string): Promise<FoodItem[]> {
    const updatedMenu = localStore.restockFoodItem(foodId, quantityToAdd, staffUser, role);
    try {
      const item = updatedMenu.find(i => i.id === foodId);
      if (item) {
        await setDoc(doc(db, MENU_COLLECTION, foodId), item);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${MENU_COLLECTION}/${foodId}`);
    }
    return updatedMenu;
  },

  async getOrders(userId?: string, role?: string): Promise<Order[]> {
    try {
      let q;
      if (role === 'STAFF') {
        q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
      } else if (userId) {
        q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
      }
      if (q) {
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(docSnap => docSnap.data() as Order);
        if (role !== 'STAFF') {
          orders.sort((a, b) => b.createdAt - a.createdAt);
        }
        return orders;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    }
    return localStore.getOrders(userId, role);
  },

  subscribeToOrders(userId: string | undefined, role: string | undefined, callback: (orders: Order[]) => void): () => void {
    callback(localStore.getOrders(userId, role));

    const key = `${role || 'all'}_${userId || 'all'}`;
    if (!orderListenerMap.has(key)) {
      orderListenerMap.set(key, new Set());
    }
    const listenerSet = orderListenerMap.get(key)!;
    listenerSet.add(callback);

    if (!activeUnsubOrdersMap.has(key)) {
      try {
        let q;
        if (role === 'STAFF') {
          q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
        } else if (userId) {
          q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
        }
        if (q) {
          const unsub = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(docSnap => docSnap.data() as Order);
            if (role !== 'STAFF') {
              orders.sort((a, b) => b.createdAt - a.createdAt);
            }
            orderListenerMap.get(key)?.forEach(cb => cb(orders));
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
          });
          activeUnsubOrdersMap.set(key, unsub);
        }
      } catch (e) {
        console.warn("Could not attach Firestore orders listener:", e);
      }
    }

    return () => {
      const set = orderListenerMap.get(key);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          orderListenerMap.delete(key);
          const activeUnsub = activeUnsubOrdersMap.get(key);
          if (activeUnsub) {
            activeUnsub();
            activeUnsubOrdersMap.delete(key);
          }
        }
      }
    };
  },

  async createOrder(order: Omit<Order, 'id'> & { id?: string }): Promise<Order> {
    const finalOrder = localStore.createOrder(order);
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, finalOrder.id);
      await setDoc(orderRef, finalOrder);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
    }
    return finalOrder;
  },

  async confirmCounterCashPayment(orderId: string, counterStaffName?: string): Promise<Order> {
    const updated = localStore.confirmCounterCashPayment(orderId, counterStaffName);
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'PAID',
        status: OrderStatus.ACCEPTED,
        checkInTime: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
    return updated;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, extra?: Partial<Order>): Promise<void> {
    localStore.updateOrderStatus(orderId, status, extra);
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(orderRef, { status, ...extra });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },

  async getNextOrderId(): Promise<number> {
    return localStore.getNextOrderId();
  },

  async toggleFavorite(userId: string, foodId: string): Promise<string[]> {
    const updated = localStore.toggleFavorite(userId, foodId);
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, { favorites: updated });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
    }
    return updated;
  },

  async getIngredients(): Promise<RawIngredient[]> {
    try {
      const snapshot = await getDocs(collection(db, INGREDIENTS_COLLECTION));
      if (!snapshot.empty) {
        const items = snapshot.docs.map(docSnap => docSnap.data() as RawIngredient);
        localStore.saveIngredients(items);
        return items;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, INGREDIENTS_COLLECTION);
    }
    return localStore.getIngredients();
  },

  subscribeToIngredients(callback: (ingredients: RawIngredient[]) => void): () => void {
    callback(localStore.getIngredients());
    ingredientListeners.add(callback);

    if (!activeUnsubIngredients) {
      try {
        const q = query(collection(db, INGREDIENTS_COLLECTION));
        activeUnsubIngredients = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map(docSnap => docSnap.data() as RawIngredient);
            localStore.saveIngredients(items);
            ingredientListeners.forEach(cb => cb(items));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, INGREDIENTS_COLLECTION);
        });
      } catch (e) {
        console.warn("Could not attach Firestore ingredients listener:", e);
      }
    }

    return () => {
      ingredientListeners.delete(callback);
      if (ingredientListeners.size === 0 && activeUnsubIngredients) {
        activeUnsubIngredients();
        activeUnsubIngredients = null;
      }
    };
  },

  async updateIngredient(ingredient: RawIngredient): Promise<RawIngredient[]> {
    const list = localStore.updateIngredient(ingredient);
    try {
      await setDoc(doc(db, INGREDIENTS_COLLECTION, ingredient.id), ingredient);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${INGREDIENTS_COLLECTION}/${ingredient.id}`);
    }
    return list;
  },

  async addIngredient(ingredient: Omit<RawIngredient, 'id'>): Promise<RawIngredient> {
    const newIng = localStore.addIngredient(ingredient);
    try {
      await setDoc(doc(db, INGREDIENTS_COLLECTION, newIng.id), newIng);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, INGREDIENTS_COLLECTION);
    }
    return newIng;
  },

  async deleteIngredient(id: string): Promise<RawIngredient[]> {
    const list = localStore.deleteIngredient(id);
    try {
      await deleteDoc(doc(db, INGREDIENTS_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${INGREDIENTS_COLLECTION}/${id}`);
    }
    return list;
  },

  async getStockMovements(): Promise<StockMovement[]> {
    try {
      const snapshot = await getDocs(query(collection(db, MOVEMENTS_COLLECTION), orderBy('timestamp', 'desc')));
      if (!snapshot.empty) {
        const mvs = snapshot.docs.map(docSnap => docSnap.data() as StockMovement);
        return mvs;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, MOVEMENTS_COLLECTION);
    }
    return localStore.getStockMovements();
  },

  subscribeToStockMovements(callback: (movements: StockMovement[]) => void): () => void {
    callback(localStore.getStockMovements());
    movementListeners.add(callback);

    if (!activeUnsubMovements) {
      try {
        const q = query(collection(db, MOVEMENTS_COLLECTION), orderBy('timestamp', 'desc'));
        activeUnsubMovements = onSnapshot(q, (snapshot) => {
          const mvs = snapshot.docs.map(docSnap => docSnap.data() as StockMovement);
          movementListeners.forEach(cb => cb(mvs));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, MOVEMENTS_COLLECTION);
        });
      } catch (e) {
        console.warn("Could not attach Firestore stock movements listener:", e);
      }
    }

    return () => {
      movementListeners.delete(callback);
      if (movementListeners.size === 0 && activeUnsubMovements) {
        activeUnsubMovements();
        activeUnsubMovements = null;
      }
    };
  },

  async addStockMovement(mv: Omit<StockMovement, 'id' | 'timestamp'>): Promise<StockMovement> {
    const newMv = localStore.addStockMovement(mv);
    try {
      await setDoc(doc(db, MOVEMENTS_COLLECTION, newMv.id), newMv);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, MOVEMENTS_COLLECTION);
    }
    return newMv;
  },

  async getKitchenNotifications(): Promise<AppNotification[]> {
    try {
      const snapshot = await getDocs(query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('timestamp', 'desc')));
      if (!snapshot.empty) {
        const notifs = snapshot.docs.map(docSnap => docSnap.data() as AppNotification);
        return notifs;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, NOTIFICATIONS_COLLECTION);
    }
    return localStore.getKitchenNotifications();
  },

  subscribeToKitchenNotifications(callback: (notifications: AppNotification[]) => void): () => void {
    callback(localStore.getKitchenNotifications());
    notificationListeners.add(callback);

    if (!activeUnsubNotifs) {
      try {
        const q = query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('timestamp', 'desc'));
        activeUnsubNotifs = onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(docSnap => docSnap.data() as AppNotification);
          notificationListeners.forEach(cb => cb(notifs));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, NOTIFICATIONS_COLLECTION);
        });
      } catch (e) {
        console.warn("Could not attach Firestore notifications listener:", e);
      }
    }

    return () => {
      notificationListeners.delete(callback);
      if (notificationListeners.size === 0 && activeUnsubNotifs) {
        activeUnsubNotifs();
        activeUnsubNotifs = null;
      }
    };
  },

  async markNotificationRead(id: string): Promise<AppNotification[]> {
    const list = localStore.markNotificationRead(id);
    try {
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${NOTIFICATIONS_COLLECTION}/${id}`);
    }
    return list;
  },

  async markAllNotificationsRead(): Promise<AppNotification[]> {
    const list = localStore.markAllNotificationsRead();
    try {
      const snapshot = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
      const batchPromises = snapshot.docs.map(docSnap => updateDoc(docSnap.ref, { read: true }));
      await Promise.all(batchPromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, NOTIFICATIONS_COLLECTION);
    }
    return list;
  },

  async getKitchenStatus(): Promise<'Online' | 'Busy' | 'Offline'> {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'kitchen_status'));
      if (docSnap.exists()) {
        const st = docSnap.data().status;
        if (st && ['Online', 'Busy', 'Offline'].includes(st)) return st;
      }
    } catch (e) {}
    return localStore.getKitchenStatus();
  },

  subscribeToKitchenStatus(callback: (status: 'Online' | 'Busy' | 'Offline') => void): () => void {
    callback(localStore.getKitchenStatus());
    kitchenStatusListeners.add(callback);
    return () => kitchenStatusListeners.delete(callback);
  },

  async setKitchenStatus(status: 'Online' | 'Busy' | 'Offline'): Promise<void> {
    localStore.setKitchenStatus(status);
    try {
      await setDoc(doc(db, 'settings', 'kitchen_status'), { status });
    } catch (e) {}
  },

  async addAuditLog(log: Omit<KitchenAuditLog, 'id' | 'timestamp'>): Promise<KitchenAuditLog> {
    const newLog = localStore.addAuditLog(log);
    try {
      await setDoc(doc(db, 'audit_logs', newLog.id), newLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `audit_logs/${newLog.id}`);
    }
    return newLog;
  },

  async getAuditLogs(): Promise<KitchenAuditLog[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')));
      if (!snapshot.empty) {
        const logs = snapshot.docs.map(docSnap => docSnap.data() as KitchenAuditLog);
        return logs;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'audit_logs');
    }
    return localStore.getAuditLogs();
  }
};

