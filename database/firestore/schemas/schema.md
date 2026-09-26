# Firestore Collections Schema

## 1. Collection: `users`
- `id` (string, Document ID): Unique user ID (matches Firebase Auth UID or custom ID).
- `name` (string): Full display name of the user.
- `email` (string): User email address.
- `phoneNumber` (string): 10-digit or international formatted phone number.
- `role` (string): `STUDENT` | `STAFF` | `ADMIN`.
- `rewardPoints` (number): Loyalty reward points integer count.
- `favorites` (array of strings): Array of food item IDs.
- `createdAt` (number): Epoch timestamp in milliseconds.

## 2. Collection: `menu`
- `id` (string, Document ID): Unique menu item ID (e.g. `m0-a1b2c`).
- `name` (string): Food item title.
- `description` (string): Short item description.
- `price` (number): Item price in INR.
- `category` (string): `MORNING TIFFIN` | `MAIN COURSE` | `SNACKS` | `BEVERAGES` | etc.
- `timeSlot` (string): `Morning` | `Evening` | `Night` | `All Day`.
- `image` (string): HTTPS image URL.
- `estimatedTime` (number): Estimated preparation time in minutes.
- `isAvailable` (boolean): Availability toggle.
- `stock` (number): Available stock quantity.
- `nutrition` (map):
  - `calories` (number)
  - `protein` (number)
  - `carbs` (number)
  - `fat` (number)

## 3. Collection: `orders`
- `id` (string, Document ID): Custom Order ID (e.g. `ORD-101`).
- `userId` (string): ID of customer placing order.
- `userName` (string): Name of customer.
- `items` (array of maps):
  - `foodId` (string)
  - `name` (string)
  - `quantity` (number)
  - `price` (number)
  - `status` (string): `PENDING` | `PREPARING` | `READY`
- `totalAmount` (number): Final order price after discounts.
- `discountApplied` (number): Discount amount deducted.
- `status` (string): `Booked` | `Preparing` | `Ready` | `Collected` | `Cancelled`.
- `createdAt` (number): Order creation epoch timestamp.
- `estimatedFinishTime` (number): Estimated order completion epoch timestamp.
- `paymentMethod` (string): `GPAY` | `PAYTM` | `PHONEPE` | `CARD` | `CASH`.
- `cancellationReason` (string, optional): Reason for order cancellation.

## 4. Collection: `audit_logs`
- `id` (string, Document ID): Log entry ID.
- `action` (string): Action performed (e.g., `ORDER_CANCELLED`, `MENU_UPDATED`).
- `performedBy` (string): User ID performing action.
- `timestamp` (number): Epoch timestamp.
- `details` (map): Action metadata payload.
