# User Data Model Specification

## Fields & Data Types
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Firebase Auth UID or unique string |
| `name` | string | Yes | Full Display Name |
| `email` | string | Yes | User email address |
| `phoneNumber` | string | No | 10-digit telephone number |
| `role` | string | Yes | Role (`STUDENT`, `STAFF`, `ADMIN`) |
| `rewardPoints` | number | No | Accumulated loyalty points |
| `favorites` | array | No | Array of favorited food IDs |
| `createdAt` | number | No | Timestamp of creation |

## Indexes
- Single field index on `email` (Unique).
- Single field index on `role`.

## Security Rule Boundaries
- Users can read and update only their own profile document unless they hold `STAFF` or `ADMIN` role.
