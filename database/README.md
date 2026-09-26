# CraveCanteen Database Layer

This folder contains all Firestore rules, indexes, schemas, data models, seeds, and migrations.

## Directory Layout
- `firestore/rules/firestore.rules`: Security rules enforcing RBAC and data boundaries.
- `firestore/indexes/firestore.indexes.json`: Composite queries index definitions.
- `firestore/schemas/schema.md`: Overall Firestore schema definitions.
- `data-model/`: Individual specification for `users`, `menu`, `orders`, and `audit-logs`.

## Deployment
Deploy rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```
