# Audit Logs Data Model Specification

## Fields & Data Types
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Log Entry ID |
| `action` | string | Yes | Description of action |
| `performedBy` | string | Yes | User ID who initiated action |
| `timestamp` | number | Yes | Epoch timestamp in ms |
| `details` | map | No | Additional metadata |
