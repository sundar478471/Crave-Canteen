import { validateEmail, validatePhoneNumber } from '../../shared/validation';
import { UserRole } from '../../shared/types';
import { mockStudentUser, mockStaffUser } from '../fixtures/users.fixture';

describe('Auth Unit Tests', () => {
  test('validateEmail correctly validates email formats', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  test('validatePhoneNumber accepts valid 10+ digit phones', () => {
    expect(validatePhoneNumber('+919876543210')).toBe(true);
    expect(validatePhoneNumber('9876543210')).toBe(true);
    expect(validatePhoneNumber('123')).toBe(false);
  });

  test('User roles are properly differentiated', () => {
    expect(mockStudentUser.role).toBe(UserRole.STUDENT);
    expect(mockStaffUser.role).toBe(UserRole.STAFF);
  });
});
