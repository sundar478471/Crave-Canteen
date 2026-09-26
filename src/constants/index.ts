import { FoodItem } from '../types';
import { INITIAL_FOOD_ITEMS } from './initialCatalog';

export const INITIAL_COLLEGE_CANTEEN_CATALOGUE: FoodItem[] = INITIAL_FOOD_ITEMS;
export const MENU_ITEMS: FoodItem[] = INITIAL_FOOD_ITEMS;

export const STATUS_COLORS: Record<string, string> = {
  'Cart': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Pending Payment': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Paid': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Booked': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Accepted': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Preparing': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Ready': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Collected': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Payment Failed': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  'Cancelled': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Expired': 'bg-slate-600/10 text-slate-500 border-slate-600/20',
  'Refund Pending': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Refunded': 'bg-teal-500/10 text-teal-400 border-teal-500/20'
};
