import { UserRole } from '../../shared/types';
import { requireRole } from '../../backend/src/middleware/role.middleware';

describe('Security & RBAC Middleware Tests', () => {
  test('requireRole blocks unauthorized roles', () => {
    const middleware = requireRole([UserRole.STAFF]);
    const req: any = { body: { user: { role: UserRole.STUDENT } } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireRole allows authorized roles', () => {
    const middleware = requireRole([UserRole.STAFF]);
    const req: any = { body: { user: { role: UserRole.STAFF } } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
