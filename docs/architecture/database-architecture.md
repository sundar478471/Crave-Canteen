# CraveCanteen Database Architecture

## Security Rules Strategy
1. **Users Collection (`/users/{userId}`)**:
   - `read`: Allowed if user is document owner or holds `STAFF` / `ADMIN` role.
   - `create`: Allowed if authenticated matching own UID.
   - `update`: Allowed if owner or staff.
2. **Menu Collection (`/menu/{itemId}`)**:
   - `read`: Public read allowed for browsing.
   - `write`: Restricted to `STAFF` or `ADMIN` roles.
3. **Orders Collection (`/orders/{orderId}`)**:
   - `read`: Allowed if user owns the order or is `STAFF`/`ADMIN`.
   - `create`: Allowed for authenticated users setting `userId` to own UID.
   - `update`: Allowed if user owns the order or is `STAFF`/`ADMIN`.

## Real-time Listeners (`onSnapshot`)
All real-time listeners registered in `apiClient.ts` return an unsubscription cleanup function to prevent memory leaks and redundant Firestore reads.
