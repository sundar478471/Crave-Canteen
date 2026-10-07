import { User, FoodItem, Order, OrderStatus } from '@shared/types';
import { MENU_ITEMS as INITIAL_MENU_ITEMS, DEFAULT_USERS } from '@shared/constants';

import { db, auth } from '../firebase/client';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (process.env.NODE_ENV !== 'production') {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.debug(`[Firestore Operation Notice] ${operationType} on ${path || 'resource'}: ${errMsg}`);
  }
}

export async function getAuthToken(forceRefresh = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = await getAuthToken(false);
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });
  if (response.status === 401 && auth.currentUser) {
    token = await getAuthToken(true);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      response = await fetch(url, { ...options, headers });
    }
  }
  return response;
}

const USERS_COLLECTION = 'users';
const MENU_COLLECTION = 'menu';
const ORDERS_COLLECTION = 'orders';

const LOCAL_USERS_KEY = 'cravecanteen_local_users';
const LOCAL_MENU_KEY = 'cravecanteen_local_menu';
const LOCAL_ORDERS_KEY = 'cravecanteen_local_orders';
const LOCAL_COUNTER_KEY = 'cravecanteen_local_counter';

const menuListeners = new Set<(menu: FoodItem[]) => void>();
const orderListeners = new Set<() => void>();
const userListeners = new Map<string, Set<(user: User | null) => void>>();

export const localStore = {
  getUsers(): (User & { password?: string })[] {
    try {
      const data = localStorage.getItem(LOCAL_USERS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("LocalStore getUsers parse error:", e);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  },

  getUser(userId: string): User | null {
    const users = this.getUsers();
    const found = users.find(u => u.id === userId);
    if (found) {
      const { password: _, ...rest } = found;
      return rest as User;
    }
    return null;
  },

  saveUser(user: User & { password?: string }): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn("LocalStore saveUser storage error:", e);
    }

    const { password: _, ...rest } = user;
    const cleanUser = rest as User;
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
      const phoneClean = u.phoneNumber ? u.phoneNumber.replace(/\D/g, '') : '';
      const phoneMatches = phoneClean && (phoneClean === digitsOnly || (digitsOnly.length >= 10 && phoneClean.endsWith(digitsOnly.slice(-10))));
      return emailMatches || phoneMatches;
    });

    if (!found) return null;
    if (password && found.password && found.password !== password) {
      return null;
    }

    const { password: _, ...rest } = found;
    return rest as User;
  },

  getMenu(): FoodItem[] {
    try {
      const data = localStorage.getItem(LOCAL_MENU_KEY);
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
              localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(parsed));
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
      localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(INITIAL_MENU_ITEMS));
    } catch (e) {
      console.warn("LocalStore getMenu store error:", e);
    }
    return INITIAL_MENU_ITEMS;
  },

  updateMenu(menu: FoodItem[], notify = true): void {
    try {
      localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(menu));
    } catch (e) {
      console.warn("LocalStore updateMenu error:", e);
    }
    if (notify) {
      menuListeners.forEach(cb => {
        try { cb(menu); } catch (e) { console.error(e); }
      });
    }
  },

  getOrders(userId?: string, role?: string): Order[] {
    let orders: Order[] = [];
    try {
      const data = localStorage.getItem(LOCAL_ORDERS_KEY);
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
      const data = localStorage.getItem(LOCAL_COUNTER_KEY);
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
      const data = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (data) {
        orders = JSON.parse(data);
      }
    } catch (e) {
      console.warn("LocalStore createOrder parse error:", e);
    }

    const nextId = this.getNextOrderId();
    try {
      localStorage.setItem(LOCAL_COUNTER_KEY, String(nextId + 1));
    } catch (e) {
      console.warn("LocalStore setCounter error:", e);
    }

    const finalOrder: Order = {
      ...order,
      id: order.id || `ORD-${nextId}`
    } as Order;

    orders.unshift(finalOrder);
    try {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn("LocalStore saveOrders error:", e);
    }

    const currentMenu = this.getMenu();
    let stockChanged = false;
    const updatedMenu = currentMenu.map(menuItem => {
      const orderItem = finalOrder.items.find((it: any) => it.foodId === menuItem.id);
      if (orderItem && menuItem.stock !== undefined) {
        stockChanged = true;
        return {
          ...menuItem,
          stock: Math.max(0, menuItem.stock - orderItem.quantity)
        };
      }
      return menuItem;
    });

    if (stockChanged) {
      this.updateMenu(updatedMenu, true);
    }

    orderListeners.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });

    return finalOrder;
  },

  updateOrderStatus(orderId: string, status: OrderStatus, extra?: Partial<Order>): void {
    let orders: Order[] = [];
    try {
      const data = localStorage.getItem(LOCAL_ORDERS_KEY);
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
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
      } catch (e) {
        console.warn("LocalStore saveOrderStatus error:", e);
      }
      orderListeners.forEach(cb => {
        try { cb(); } catch (e) { console.error(e); }
      });
    }
  },

  toggleFavorite(userId: string, foodId: string): string[] {
    const user = this.getUser(userId);
    if (!user) return [];
    const favs = user.favorites || [];
    const updated = favs.includes(foodId) ? favs.filter((id: string) => id !== foodId) : [...favs, foodId];
    this.saveUser({ ...user, favorites: updated });
    return updated;
  }
};

export const api = {
  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (userDoc.exists()) {
        const user = userDoc.data() as User & { password?: string };
        const { password: _, ...rest } = user;
        localStore.saveUser(rest as User);
        return rest as User;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
    }
    return localStore.getUser(userId);
  },

  async registerUser(user: User & { password?: string }): Promise<User> {
    let uid = user.id;
    try {
      let email = user.email;
      if (!email && user.phoneNumber) {
        email = `${user.phoneNumber.replace('+', '')}@cravecanteen.app`;
      }
      
      const isCurrentAuthUser = auth.currentUser && (auth.currentUser.uid === uid || (email && auth.currentUser.email?.toLowerCase() === email.toLowerCase()));

      if (!isCurrentAuthUser && user.password && user.password.length >= 6 && email && email.includes('@') && (!uid || uid === 'temp-id')) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, user.password);
          uid = userCredential.user.uid;
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            try {
              const signinCred = await signInWithEmailAndPassword(auth, email, user.password);
              uid = signinCred.user.uid;
            } catch (sErr) {
              // Proceed with local user record
            }
          } else {
            console.info("Firebase Auth notice:", authErr?.message || authErr);
          }
        }
      }
    } catch (error: any) {
      console.warn("Firebase registration fallback:", error);
    }

    const newUser: User = { 
      id: uid && uid !== 'temp-id' ? uid : `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: user.name,
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      rewardPoints: user.rewardPoints ?? 100,
      favorites: user.favorites || []
    };

    try {
      await setDoc(doc(db, USERS_COLLECTION, newUser.id), newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${USERS_COLLECTION}/${newUser.id}`);
    }

    return localStore.saveUser({ ...newUser, password: user.password });
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const existing = localStore.getUser(userId);
    const merged = { ...existing, ...updates } as User;
    localStore.saveUser(merged);

    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
    }

    return merged;
  },

  subscribeToUser(userId: string, callback: (user: User | null) => void): () => void {
    callback(localStore.getUser(userId));

    if (!userListeners.has(userId)) {
      userListeners.set(userId, new Set());
    }
    userListeners.get(userId)!.add(callback);

    let unsubFirestore: (() => void) | null = null;
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      unsubFirestore = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const user = docSnap.data() as User & { password?: string };
          const { password: _, ...rest } = user;
          callback(rest as User);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
      });
    } catch (e) {
      console.warn("Could not attach Firestore user listener:", e);
    }

    return () => {
      userListeners.get(userId)?.delete(callback);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async loginUser(identifier: string, password?: string): Promise<User | null> {
    if (!password) return null;

    let email = identifier;
    if (identifier.startsWith('+91')) {
      email = `${identifier.replace('+', '')}@cravecanteen.app`;
    } else if (!identifier.includes('@')) {
      email = `+91${identifier}@cravecanteen.app`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));
      if (userDoc.exists()) {
        const user = userDoc.data() as User & { password?: string };
        const { password: _, ...rest } = user;
        localStore.saveUser(rest as User);
        return rest as User;
      }
    } catch (error: any) {
      if (error?.code !== 'auth/invalid-credential' && error?.code !== 'auth/user-not-found' && error?.code !== 'auth/wrong-password') {
        console.warn("Firebase Auth login notice:", error?.message || error);
      }
    }

    return localStore.loginUser(identifier, password);
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

    let unsubFirestore: (() => void) | null = null;
    try {
      const q = query(collection(db, MENU_COLLECTION));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const menu = snapshot.docs.map(docSnap => docSnap.data() as FoodItem);
          localStore.updateMenu(menu, false);
          callback(menu);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, MENU_COLLECTION);
      });
    } catch (e) {
      console.warn("Could not attach Firestore menu listener:", e);
    }

    return () => {
      menuListeners.delete(callback);
      if (unsubFirestore) unsubFirestore();
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

    const localListener = () => {
      callback(localStore.getOrders(userId, role));
    };
    orderListeners.add(localListener);

    let unsubFirestore: (() => void) | null = null;
    try {
      let q;
      if (role === 'STAFF') {
        q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
      } else if (userId) {
        q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
      }
      if (q) {
        unsubFirestore = onSnapshot(q, (snapshot) => {
          const orders = snapshot.docs.map(docSnap => docSnap.data() as Order);
          if (role !== 'STAFF') {
            orders.sort((a, b) => b.createdAt - a.createdAt);
          }
          callback(orders);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
        });
      }
    } catch (e) {
      console.warn("Could not attach Firestore orders listener:", e);
    }

    return () => {
      orderListeners.delete(localListener);
      if (unsubFirestore) unsubFirestore();
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
  }
};
