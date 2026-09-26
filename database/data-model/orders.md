# Orders Data Model Specification

## Fields & Data Types
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Unique Order Identifier (`ORD-XXX`) |
| `userId` | string | Yes | ID of customer |
| `userName` | string | Yes | Customer name |
| `items` | array | Yes | List of ordered items |
| `totalAmount` | number | Yes | Total cost after discounts |
| `status` | string | Yes | `Booked`, `Preparing`, `Ready`, `Collected`, `Cancelled` |
| `createdAt` | number | Yes | Epoch timestamp in ms |
| `estimatedFinishTime` | number | Yes | Estimated completion timestamp |
| `paymentMethod` | string | Yes | `GPAY`, `PAYTM`, `PHONEPE`, `CARD`, `CASH` |

## Indexes
- Composite index: `userId` (ASC) + `createdAt` (DESC).
- Composite index: `status` (ASC) + `createdAt` (DESC).
