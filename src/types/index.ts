export enum OrderStatus {
  CART = 'Cart',
  PENDING_PAYMENT = 'Pending Payment',
  PAID = 'Paid',
  PEND_BOOKED = 'Booked',
  BOOKED = 'Booked',
  ACCEPTED = 'Accepted',
  PREPARING = 'Preparing',
  READY = 'Ready',
  COMPLETED = 'Collected',
  COLLECTED = 'Collected',
  PAYMENT_FAILED = 'Payment Failed',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
  REFUND_PENDING = 'Refund Pending',
  REFUNDED = 'Refunded'
}

export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  KITCHEN = 'KITCHEN',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  COUNTER_STAFF = 'COUNTER_STAFF',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  CANTEEN_MANAGER = 'CANTEEN_MANAGER',
  VENDOR_ADMIN = 'VENDOR_ADMIN',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type TimeSlot = 'Morning' | 'Evening' | 'Night' | 'All Day' | string;

export interface WalletTransaction {
  id: string;
  type: 'ORDER_PAYMENT' | 'TOP_UP' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  date: number;
  reference: string;
  status: 'SUCCESS' | 'PENDING' | 'CANCELLED';
  description?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'Orders' | 'Menu' | 'Offers' | 'System' | 'Stock';
  timestamp: number;
  read: boolean;
  link?: string;
}

export interface ResourcePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export interface UserPermissions {
  dashboard: ResourcePermission;
  userManagement: ResourcePermission;
  kitchenManagement: ResourcePermission;
  menuManagement: ResourcePermission;
  orders: ResourcePermission;
  inventory: ResourcePermission;
  reports: ResourcePermission;
  settings: ResourcePermission;
}

export function getDefaultPermissionsForRole(role: UserRole | string): UserPermissions {
  const roleStr = String(role);
  const fullAccess: ResourcePermission = { view: true, create: true, edit: true, delete: true, export: true };
  const readOnly: ResourcePermission = { view: true, create: false, edit: false, delete: false, export: false };
  const noAccess: ResourcePermission = { view: false, create: false, edit: false, delete: false, export: false };

  if (['ADMIN', 'SUPER_ADMIN', 'VENDOR_ADMIN', 'CANTEEN_MANAGER'].includes(roleStr)) {
    return {
      dashboard: { ...fullAccess },
      userManagement: { ...fullAccess },
      kitchenManagement: { ...fullAccess },
      menuManagement: { ...fullAccess },
      orders: { ...fullAccess },
      inventory: { ...fullAccess },
      reports: { ...fullAccess },
      settings: { ...fullAccess }
    };
  }

  if (['STAFF', 'KITCHEN_STAFF', 'COUNTER_STAFF'].includes(roleStr)) {
    return {
      dashboard: { view: true, create: false, edit: false, delete: false, export: true },
      userManagement: { view: true, create: false, edit: false, delete: false, export: false },
      kitchenManagement: { view: true, create: true, edit: true, delete: false, export: true },
      menuManagement: { view: true, create: true, edit: true, delete: false, export: false },
      orders: { view: true, create: true, edit: true, delete: true, export: true },
      inventory: { view: true, create: true, edit: true, delete: false, export: true },
      reports: { view: true, create: false, edit: false, delete: false, export: true },
      settings: { view: true, create: false, edit: false, delete: false, export: false }
    };
  }

  if (roleStr === 'FACULTY') {
    return {
      dashboard: { view: true, create: false, edit: false, delete: false, export: false },
      userManagement: { ...noAccess },
      kitchenManagement: { ...noAccess },
      menuManagement: { ...readOnly },
      orders: { view: true, create: true, edit: false, delete: true, export: true },
      inventory: { ...noAccess },
      reports: { view: true, create: false, edit: false, delete: false, export: true },
      settings: { view: true, create: false, edit: true, delete: false, export: false }
    };
  }

  // Default for STUDENT / CUSTOMER
  return {
    dashboard: { view: true, create: false, edit: false, delete: false, export: false },
    userManagement: { ...noAccess },
    kitchenManagement: { ...noAccess },
    menuManagement: { ...readOnly },
    orders: { view: true, create: true, edit: false, delete: true, export: false },
    inventory: { ...noAccess },
    reports: { ...noAccess },
    settings: { view: true, create: false, edit: true, delete: false, export: false }
  };
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  avatar?: string;
  rewardPoints?: number;
  walletBalance?: number;
  favorites?: string[];

  // Personal Info
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer Not to Say' | string;

  // Organization Info
  employeeId?: string;
  studentId?: string;
  rollNumber?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  address?: string;
  emergencyContact?: string;
  hostelBlock?: string;

  // Account & Authorization
  accessLevel?: 'Standard' | 'Elevated' | 'Supervisor' | 'Full Admin' | string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE' | string;
  permissions?: UserPermissions;

  // Audit Information
  createdBy?: string;
  createdByName?: string;
  createdAt?: number;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: number;
  lastLoginAt?: number;

  transactions?: WalletTransaction[];
  notifications?: AppNotification[];
}


export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  id: string;
  itemCode?: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  costPrice?: number;
  sellingPrice?: number;
  originalPrice?: number;
  discount?: number;
  tax?: number;
  finalPrice?: number;
  category: string;
  subcategory?: string;
  subcategoryId?: string;
  mealTime?: 'Breakfast' | 'Lunch' | 'Evening' | 'All Day' | string;
  timeSlot?: TimeSlot;
  foodType?: 'Veg' | 'Non-Veg' | 'Egg' | 'Snacks' | 'Juice' | 'Beverages' | 'Desserts' | 'Fast Food' | 'Combos' | 'Special Items' | string;
  image: string;
  imageUrl?: string;
  additionalImages?: string[];
  estimatedTime?: number;
  preparationTime?: number;
  stockQuantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  minimumStockLevel?: number;
  lowStockThreshold?: number;
  unit?: string;
  isAvailable: boolean;
  isActive?: boolean;
  availableFrom?: string;
  availableUntil?: string;
  isVegetarian?: boolean;
  isNonVegetarian?: boolean;
  containsEgg?: boolean;
  dietaryType?: 'Veg' | 'Non-Veg' | 'Vegan' | 'Egg' | string;
  spicyLevel?: number;
  ingredients?: string[] | string;
  allergens?: string[] | string;
  servingSize?: string;
  portionInfo?: string;
  calories?: number;
  nutrition?: NutritionInfo;
  instructions?: string;
  kitchenStation?: string;
  priority?: 'Normal' | 'Medium' | 'High' | string;
  isPopular?: boolean;
  isRecommended?: boolean;
  isFeatured?: boolean;
  isTodaysSpecial?: boolean;
  displayOrder?: number;
  stock?: number;
  vendorId?: string;
  vendorName?: string;
  startHour?: number;
  endHour?: number;
  availableDays?: number[];
  recipe?: { ingredientId: string; ingredientName: string; quantityRequired: number; unit: string }[];
  createdBy?: string;
  createdByName?: string;
  createdAt?: number | string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: number | string;
}

export interface OrderItem {
  foodId: string;
  quantity: number;
  name: string;
  price: number;
  status?: 'PENDING' | 'PREPARING' | 'READY';
  customization?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  vendorId?: string;
  items: OrderItem[];
  totalAmount: number;
  discountApplied?: number;
  pointsRedeemed?: number;
  couponCode?: string;
  status: OrderStatus;
  createdAt: number;
  checkInTime?: number; 
  estimatedFinishTime: number;
  pickupTimeSlot?: string;
  pickupLocation?: string;
  paymentMethod?: 'GPAY' | 'PAYTM' | 'PHONEPE' | 'AMAZONPAY' | 'CARD' | 'NB' | 'CASH' | 'WALLET';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  clientRequestId?: string;
  cancellationReason?: string;
  refundStatus?: 'NONE' | 'PENDING' | 'PROCESSED';
  qrCodeUrl?: string;
  qrToken?: string;
  receiptUrl?: string;
}

export * from '../../shared/types/vendor';
export * from '../../shared/types/inventory';
export * from '../../shared/types/wallet';
export * from '../../shared/types/rating';
export * from '../../shared/types/offer';
