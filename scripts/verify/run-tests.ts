import { formatCurrency, getShortOrderId } from '../../shared/utils/index';
import { validateOrderPayload, validateEmail } from '../../shared/validation/index';
import { UserRole } from '../../shared/types/auth';
import { LocalIntentClassifier } from '../../ai-engine/intents/intentClassifier';
import { LocalEntityExtractor } from '../../ai-engine/entities/entityExtractor';
import { QrService } from '../../backend/src/services/qr/qr.service';

console.log('🧪 Running Suite 1: Shared Utils & Validation Unit Tests...');
let passed = 0;
let total = 0;

function assert(condition: boolean, description: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${description}`);
  } else {
    console.error(`  ✗ FAIL: ${description}`);
  }
}

// 1. Currency formatting
assert(formatCurrency(100) === 'Rs. 100.00', 'formatCurrency(100) formatting');
assert(formatCurrency(0) === 'Rs. 0.00', 'formatCurrency(0) formatting');

// 2. Order ID generation
const shortId = getShortOrderId('ORD-123456-ABC');
assert(shortId === '123456', 'getShortOrderId extraction');

// 3. Email validation
assert(validateEmail('student@college.edu') === true, 'validateEmail valid');
assert(validateEmail('invalid-email') === false, 'validateEmail invalid');

// 4. Order payload validation
const validOrder = {
  userId: 'usr_1',
  items: [{ foodId: 'f1', quantity: 2, name: 'Burger', price: 100 }],
  totalAmount: 200
};
assert(validateOrderPayload(validOrder).isValid === true, 'validateOrderPayload valid');

const invalidOrder = {
  userId: '',
  items: [],
  totalAmount: 0
};
assert(validateOrderPayload(invalidOrder).isValid === false, 'validateOrderPayload invalid');

console.log(`\n🧪 Running Suite 2: Security & Role Validation Tests...`);
function checkRolePermission(userRole: UserRole, targetArea: 'customer' | 'staff' | 'admin'): boolean {
  if (userRole === UserRole.ADMIN) return true;
  if (userRole === UserRole.STAFF) return targetArea !== 'admin';
  if (userRole === UserRole.CUSTOMER || userRole === UserRole.STUDENT) return targetArea === 'customer';
  return false;
}

assert(checkRolePermission(UserRole.CUSTOMER, 'customer') === true, 'Customer access to customer portal');
assert(checkRolePermission(UserRole.CUSTOMER, 'staff') === false, 'Customer access to staff portal blocked');
assert(checkRolePermission(UserRole.CUSTOMER, 'admin') === false, 'Customer access to admin portal blocked');
assert(checkRolePermission(UserRole.STAFF, 'staff') === true, 'Staff access to staff portal');
assert(checkRolePermission(UserRole.ADMIN, 'admin') === true, 'Admin access to admin portal');

console.log(`\n🧪 Running Suite 3: Local AI Engine & NLP Intelligence Tests...`);
const classifier = new LocalIntentClassifier();
const extractor = new LocalEntityExtractor();

const c1 = classifier.classify("I want food under 100 rupees");
assert(c1.intent === 'FOOD_RECOMMENDATION', 'Local AI classifies budget food intent');

const e1 = extractor.extract("I want food under 100 rupees");
assert(e1.maxPrice === 100, 'Local AI extracts maxPrice entity = 100');

const c2 = classifier.classify("Where is my order status?");
assert(c2.intent === 'ORDER_STATUS', 'Local AI classifies order tracking intent');

console.log(`\n🧪 Running Suite 4: Digital QR Voucher HMAC & Atomic Redemption Tests...`);
const token = QrService.generateOrderQrData('ORD-5555', 'usr-test-123');
assert(typeof token === 'string' && token.includes('sig'), 'QrService generates HMAC signed token');

const verifyFirst = QrService.verifyAndRedeemToken(token);
assert(verifyFirst.isValid === true && verifyFirst.orderId === 'ORD-5555', 'First scan verifies & redeems voucher');

const verifySecond = QrService.verifyAndRedeemToken(token);
assert(verifySecond.isValid === false && (verifySecond.error ? verifySecond.error.includes('already redeemed') : false), 'Second scan blocked by atomic double-scan protection');

console.log(`\n========================================`);
console.log(`Test Execution Summary: ${passed}/${total} passed cleanly.`);
if (passed !== total) {
  process.exit(1);
}
