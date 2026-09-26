export interface RawIngredient {
  id: string;
  name: string;
  unit: 'kg' | 'L' | 'g' | 'ml' | 'pcs' | string;
  currentStock: number;
  minThreshold: number;
  unitCost: number;
  category?: string;
  description?: string;
  code?: string;
  supplier?: string;
  supplierContact?: string;
  storageLocation?: string;
  batchNumber?: string;
  expiryDate?: string;
  purchaseDate?: string;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantityRequired: number;
  unit: 'kg' | 'L' | 'g' | 'ml' | 'pcs' | string;
}

export interface FoodRecipe {
  foodId: string;
  ingredients: RecipeIngredient[];
}

export type MovementType = 'Consumption' | 'Purchase' | 'Adjustment' | 'Transfer' | 'Return' | 'Waste' | 'Correction' | 'SALE' | 'RESTOCK' | string;

export interface StockMovement {
  id: string;
  ingredientId?: string;
  ingredientName?: string;
  itemId?: string;
  itemName?: string;
  movementType?: MovementType;
  type?: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  notes?: string;
  user: string;
  userId?: string;
  timestamp: number;
}

export interface KitchenAuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  timestamp: number;
}
