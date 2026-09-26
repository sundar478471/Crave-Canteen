import { FoodItem, TimeSlot, User, UserRole } from '../types/index.js';
import { INITIAL_FOOD_ITEMS } from '../../src/constants/initialCatalog.js';

export const CATEGORIES = [
  "ALL", "Breakfast", "Lunch", "Snacks", "Drinks", "Tea", "Coffee", "Desserts", "Combos", "Special Items", "Other"
];

export const CATEGORY_SLOTS: Record<string, { start: number, end: number }> = {
  "MORNING TIFFIN": { start: 6, end: 11 },
  "MAIN COURSE": { start: 12, end: 23 },
  "SNACKS": { start: 16, end: 19 },
  "ARTISAN BREADS": { start: 6, end: 19 },
  "ALL": { start: 0, end: 24 },
  "BEVERAGES": { start: 0, end: 24 },
  "DESSERTS": { start: 0, end: 24 },
  "HEALTHY": { start: 0, end: 24 },
  "CONTINENTAL": { start: 11, end: 22 },
  "GLOBAL FUSION": { start: 12, end: 23 },
};

export const DEFAULT_USERS: (User & { password?: string })[] = [
  {
    id: 'staff-admin',
    name: 'Kitchen Admin',
    email: 'abc@gmail.com',
    phoneNumber: '',
    role: UserRole.STAFF,
    password: '123456',
    rewardPoints: 500,
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
    favorites: []
  },
  {
    id: 'student-demo',
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    phoneNumber: '+919876543210',
    role: UserRole.STUDENT,
    password: '123456',
    rewardPoints: 120,
    favorites: []
  }
];

export const MENU_ITEMS: FoodItem[] = INITIAL_FOOD_ITEMS;

export const STATUS_COLORS: Record<string, string> = {
  'Booked': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Preparing': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Ready': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Collected': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Cancelled': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

