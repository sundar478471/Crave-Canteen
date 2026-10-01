import React, { useState, useEffect } from 'react';
import { User, UserRole, FoodItem, Order, OrderStatus } from '@/types';
import { api } from '@/services/api/apiClient';
import AuthScreen from '@/components/auth/AuthScreen';
import { StudentPortal } from '@/components/student/StudentPortal';
import { FacultyPortal } from '@/components/faculty/FacultyPortal';
import StaffPortal from '@/components/staff/StaffPortal';
import ChatWidget from '@/components/ai/ChatWidget';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { auth, signOut } from '@/services/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { NavTab } from '@/components/layout/Sidebar';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<{ food: FoodItem; quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Client-side router path state
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  // Listen to browser URL navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper to push history state & update route state
  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  // Restore user session on mount
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
        setIsLoading(false);
      },
      (error) => {
        console.warn("Firebase onAuthStateChanged notice:", error?.message || error);
        setIsAuthReady(true);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Menu and Orders when authenticated
  useEffect(() => {
    if (!currentUser?.id || !isAuthReady) return;

    const unsubscribeMenu = api.subscribeToMenu((menu) => {
      setMenuItems(menu);
    });

    const unsubscribeOrders = api.subscribeToOrders(currentUser.id, currentUser.role, (history) => {
      setOrders(history);
    });

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, [currentUser?.id, currentUser?.role, isAuthReady]);

  // Subscribe to real-time User record updates
  useEffect(() => {
    if (!currentUser?.id || !isAuthReady) return;

    const unsubscribeUser = api.subscribeToUser(currentUser.id, (user) => {
      if (user) {
        setCurrentUser(prev => {
          if (!prev) return user;
          if (prev.id === user.id && prev.updatedAt === user.updatedAt && prev.rewardPoints === user.rewardPoints && prev.walletBalance === user.walletBalance && prev.role === user.role && prev.status === user.status) {
            return prev;
          }
          return user;
        });
        try {
          localStorage.setItem('cravecanteen_user', JSON.stringify(user));
        } catch (e) {
          // ignore
        }
      }
    });

    return () => unsubscribeUser();
  }, [currentUser?.id, isAuthReady]);

  // Handle Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('cravecanteen_user', JSON.stringify(user));
    } catch (e) {
      console.warn("Local user save error:", e);
    }

    // Role-based routing redirect
    if (user.role === UserRole.FACULTY) {
      navigateTo('/faculty');
    } else if (
      user.role === UserRole.STAFF || 
      user.role === UserRole.KITCHEN_STAFF || 
      user.role === UserRole.CANTEEN_MANAGER || 
      user.role === UserRole.VENDOR_ADMIN || 
      user.role === UserRole.ADMIN
    ) {
      navigateTo('/kitchen');
    } else {
      navigateTo('/student');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setCurrentUser(null);
    setCart([]);
    try {
      localStorage.removeItem('cravecanteen_user');
      await signOut(auth);
    } catch (e) {
      console.warn("Signout error:", e);
    }
    navigateTo('/login');
  };

  // Cart operations
  const handleAddToCart = (food: FoodItem, quantity: number = 1) => {
    const stockQty = food.stockQuantity ?? food.stock ?? 0;
    const reservedQty = food.reservedQuantity || 0;
    const availQty = food.availableQuantity !== undefined ? food.availableQuantity : Math.max(0, stockQty - reservedQty);

    if (availQty <= 0 || !food.isAvailable) {
      alert(`"${food.name}" is currently OUT OF STOCK.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.food.id === food.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + quantity > availQty) {
        alert(`Only ${availQty} ${food.unit || 'units'} of "${food.name}" available in stock.`);
        return prev;
      }
      if (existing) {
        return prev.map(item => 
          item.food.id === food.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { food, quantity }];
    });
  };

  const handleUpdateCartQuantity = (foodId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.food.id === foodId) {
          const stockQty = item.food.stockQuantity ?? item.food.stock ?? 0;
          const reservedQty = item.food.reservedQuantity || 0;
          const availQty = item.food.availableQuantity !== undefined ? item.food.availableQuantity : Math.max(0, stockQty - reservedQty);
          const newQty = item.quantity + delta;

          if (delta > 0 && newQty > availQty) {
            alert(`Only ${availQty} units of "${item.food.name}" available in stock.`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as { food: FoodItem; quantity: number }[];
    });
  };

  const handleRemoveFromCart = (foodId: string) => {
    setCart(prev => prev.filter(item => item.food.id !== foodId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Status updates for Kitchen staff
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, extra?: Partial<Order>) => {
    await api.updateOrderStatus(orderId, status, extra);
  };

  const handleUpdateMenu = async (newMenu: FoodItem[]) => {
    await api.updateMenu(newMenu);
  };

  // Determine sub-tab from path
  const getSubTabFromPath = (path: string): NavTab => {
    if (path.includes('/menu')) return 'menu';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/wallet')) return 'wallet';
    if (path.includes('/favorites')) return 'favorites';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/support')) return 'support';
    return 'home';
  };

  const activeTab = getSubTabFromPath(currentPath);

  // Tab navigation handler
  const handleNavigateTab = (tab: NavTab) => {
    const base = currentUser?.role === UserRole.FACULTY ? '/faculty' : '/student';
    const subPath = tab === 'home' ? '' : `/${tab}`;
    navigateTo(`${base}${subPath}`);
  };

  // RBAC Routing & Security Boundaries
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <AuthScreen onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  const isKitchenUser = 
    currentUser.role === UserRole.STAFF || 
    currentUser.role === UserRole.KITCHEN_STAFF || 
    currentUser.role === UserRole.CANTEEN_MANAGER || 
    currentUser.role === UserRole.VENDOR_ADMIN || 
    currentUser.role === UserRole.ADMIN;

  const isFacultyUser = currentUser.role === UserRole.FACULTY;
  const isStudentUser = currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.CUSTOMER;

  // RBAC Guard Checks
  if (isKitchenUser && (currentPath.startsWith('/student') || currentPath.startsWith('/faculty') || currentPath === '/' || currentPath === '/login')) {
    if (currentPath !== '/kitchen') navigateTo('/kitchen');
  } else if (isFacultyUser && (currentPath.startsWith('/student') || currentPath.startsWith('/kitchen') || currentPath === '/' || currentPath === '/login')) {
    if (!currentPath.startsWith('/faculty')) navigateTo('/faculty');
  } else if (isStudentUser && (currentPath.startsWith('/faculty') || currentPath.startsWith('/kitchen') || currentPath === '/' || currentPath === '/login')) {
    if (!currentPath.startsWith('/student')) navigateTo('/student');
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#070b14]">
        
        {/* KITCHEN ROLE VIEW */}
        {isKitchenUser && (
          <StaffPortal
            currentUser={currentUser}
            currentPath={currentPath}
            onNavigate={navigateTo}
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            menuItems={menuItems}
            onUpdateMenu={handleUpdateMenu}
            onLogout={handleLogout}
            onUserUpdated={(u) => setCurrentUser(u)}
            userRole={currentUser.role}
          />
        )}

        {/* FACULTY ROLE VIEW */}
        {isFacultyUser && (
          <FacultyPortal
            currentUser={currentUser}
            menuItems={menuItems}
            orders={orders}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onLogout={handleLogout}
            onUserUpdated={(u) => setCurrentUser(u)}
            activePathTab={activeTab}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {/* STUDENT ROLE VIEW */}
        {isStudentUser && (
          <StudentPortal
            currentUser={currentUser}
            menuItems={menuItems}
            orders={orders}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onLogout={handleLogout}
            onUserUpdated={(u) => setCurrentUser(u)}
            activePathTab={activeTab}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {/* AI Assistant Chat Widget (Not displayed in Kitchen Portal) */}
        {!isKitchenUser && (
          <ChatWidget 
            menu={menuItems} 
            userName={currentUser?.name || 'Guest'} 
            orders={orders} 
            onAddToCart={handleAddToCart}
          />
        )}

      </div>
    </ErrorBoundary>
  );
};

export default App;
