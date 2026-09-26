import { validateOrderPayload } from '../../shared/validation';
import { formatCurrency, getShortOrderId } from '../../shared/utils';
import { OrderStatus } from '../../shared/types';

describe('Order Unit Tests', () => {
  test('validateOrderPayload validates order parameters', () => {
    const valid = validateOrderPayload({
      userId: 'user-1',
      items: [{ foodId: 'f1', quantity: 2, name: 'Idli', price: 60 }],
      totalAmount: 120
    });
    expect(valid.isValid).toBe(true);

    const invalid = validateOrderPayload({
      userId: '',
      items: [],
      totalAmount: 0
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  test('formatCurrency formats INR correctly', () => {
    expect(formatCurrency(150)).toBe('Rs. 150.00');
  });

  test('getShortOrderId extracts short ID', () => {
    expect(getShortOrderId('ORD-101')).toBe('101');
    expect(getShortOrderId('101')).toBe('101');
  });
});
