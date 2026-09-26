import crypto from 'crypto';

const SECRET = process.env.VOUCHER_SECRET || 'cravecanteen-secure-signed-voucher-key-2026';
const redeemedTokens = new Set<string>();

export interface VoucherTokenPayload {
  orderId: string;
  userId: string;
  vendorId?: string;
  timestamp: number;
  nonce: string;
  sig?: string;
}

export class QrService {
  static generateOrderQrData(orderId: string, userId: string, vendorId = 'main-canteen'): string {
    const payload: VoucherTokenPayload = {
      orderId,
      userId,
      vendorId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(4).toString('hex')
    };

    const payloadString = `${payload.orderId}:${payload.userId}:${payload.timestamp}:${payload.nonce}`;
    const sig = crypto.createHmac('sha256', SECRET).update(payloadString).digest('hex');
    payload.sig = sig;

    return JSON.stringify(payload);
  }

  static verifyAndRedeemToken(rawToken: string): { isValid: boolean; orderId?: string; error?: string } {
    try {
      const payload: VoucherTokenPayload = JSON.parse(rawToken);
      if (!payload.orderId || !payload.userId || !payload.sig) {
        return { isValid: false, error: 'Invalid voucher structure' };
      }

      const expectedSig = crypto.createHmac('sha256', SECRET)
        .update(`${payload.orderId}:${payload.userId}:${payload.timestamp}:${payload.nonce}`)
        .digest('hex');

      if (payload.sig !== expectedSig) {
        return { isValid: false, error: 'Voucher signature verification failed' };
      }

      const tokenKey = `${payload.orderId}:${payload.nonce}`;
      if (redeemedTokens.has(tokenKey)) {
        return { isValid: false, error: 'Voucher already redeemed! Atomic double-scan protection active.' };
      }

      // Mark token as atomically redeemed
      redeemedTokens.add(tokenKey);
      return { isValid: true, orderId: payload.orderId };
    } catch (e) {
      return { isValid: false, error: 'Malformed digital voucher data' };
    }
  }
}
