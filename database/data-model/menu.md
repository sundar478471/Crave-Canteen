# Menu Data Model Specification

## Fields & Data Types
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Unique Food Item Identifier |
| `name` | string | Yes | Food item title |
| `description` | string | Yes | Detailed description |
| `price` | number | Yes | Price in INR |
| `category` | string | Yes | Canteen category |
| `timeSlot` | string | Yes | Availability slot |
| `image` | string | Yes | Image URL |
| `estimatedTime` | number | Yes | Prep time in minutes |
| `isAvailable` | boolean | Yes | Operational toggle |
| `stock` | number | No | Inventory count |

## Indexes
- Single field index on `category`.
- Single field index on `isAvailable`.
