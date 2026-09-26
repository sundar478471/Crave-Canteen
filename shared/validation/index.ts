import { OrderItem } from '../types/index.js';

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true; // Optional
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function validateOrderPayload(payload: { items: OrderItem[]; totalAmount: number; userId: string }) {
  const errors: string[] = [];
  if (!payload.userId) {
    errors.push('User ID is required');
  }
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('Order must contain at least one item');
  }
  if (typeof payload.totalAmount !== 'number' || payload.totalAmount <= 0) {
    errors.push('Invalid order total amount');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
