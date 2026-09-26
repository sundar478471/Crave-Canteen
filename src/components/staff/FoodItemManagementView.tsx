import React, { useState, useMemo } from 'react';
import { FoodItem, User } from '../../types';
import { api } from '../../services/api/apiClient';
import { 
  Utensils, Plus, Search, Eye, Edit3, Trash2, Star, RefreshCw, 
  Flame, Check, X, Loader2, Sparkles, Tag, Clock, DollarSign, 
  Image as ImageIcon, Upload, Filter, Layers, AlertCircle, CheckCircle2, 
  Power, Globe, Activity, LayoutGrid, List, Heart, HelpCircle, AlertTriangle
} from 'lucide-react';

interface FoodItemManagementViewProps {
  menuItems: FoodItem[];
  currentUser?: User | null;
  onUpdateMenu: (updatedMenu: FoodItem[]) => void;
  triggerToastSuccess: (msg: string) => void;
  triggerToastError: (msg: string) => void;
}

export const FOOD_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Snacks',
  'Drinks',
  'Tea',
  'Coffee',
  'Fresh Juice',
  'Desserts',
  'Main Course',
  'Starters',
  'Combos',
  'Special Items',
  'Other'
];

export const FoodItemManagementView: React.FC<FoodItemManagementViewProps> = ({
  menuItems,
  currentUser,
  onUpdateMenu,
  triggerToastSuccess,
  triggerToastError
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [loading, setLoading] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');
  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');
  const [specialFilter, setSpecialFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [itemToView, setItemToView] = useState<FoodItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<FoodItem | null>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<FoodItem | null>(null);

  // Form State
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'stock' | 'kitchen'>('basic');
  const [name, setName] = useState<string>('');
  const [itemCode, setItemCode] = useState<string>('');
  const [category, setCategory] = useState<string>('Breakfast');
  const [subcategory, setSubcategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newAddImageUrl, setNewAddImageUrl] = useState<string>('');

  // Pricing
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('0');
  const [taxPercent, setTaxPercent] = useState<string>('0');

  // Availability & Stock
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [availableFrom, setAvailableFrom] = useState<string>('07:00');
  const [availableUntil, setAvailableUntil] = useState<string>('22:00');
  const [stockQuantity, setStockQuantity] = useState<string>('50');
  const [minimumStockLevel, setMinimumStockLevel] = useState<string>('10');
  const [unit, setUnit] = useState<string>('units');

  // Food Info
  const [dietaryType, setDietaryType] = useState<string>('Veg');
  const [spicyLevel, setSpicyLevel] = useState<number>(0);
  const [ingredients, setIngredients] = useState<string>('');
  const [allergens, setAllergens] = useState<string>('');
  const [preparationTime, setPreparationTime] = useState<string>('15');
  const [servingSize, setServingSize] = useState<string>('1 Portion');
  const [calories, setCalories] = useState<string>('250');

  // Kitchen & Station
  const [instructions, setInstructions] = useState<string>('');
  const [kitchenStation, setKitchenStation] = useState<string>('Hot Station');
  const [priority, setPriority] = useState<string>('Normal');

  // Display & Promotion
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isRecommended, setIsRecommended] = useState<boolean>(false);
  const [isTodaysSpecial, setIsTodaysSpecial] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [displayOrder, setDisplayOrder] = useState<string>('1');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto-calculated final price
  const computedFinalPrice = useMemo(() => {
    const sp = parseFloat(sellingPrice) || 0;
    const tax = parseFloat(taxPercent) || 0;
    return sp * (1 + tax / 100);
  }, [sellingPrice, taxPercent]);

  // Open Add Modal
  const openAddModal = () => {
    setItemToEdit(null);
    setName('');
    setItemCode(`FOOD-${Math.floor(100 + Math.random() * 900)}`);
    setCategory('Breakfast');
    setSubcategory('');
    setDescription('');
    setShortDescription('');
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80');
    setAdditionalImages([]);
    setNewAddImageUrl('');
    setOriginalPrice('');
    setSellingPrice('100');
    setDiscountPercent('0');
    setTaxPercent('0');
    setIsAvailable(true);
    setAvailableFrom('07:00');
    setAvailableUntil('22:00');
    setStockQuantity('50');
    setMinimumStockLevel('10');
    setUnit('units');
    setDietaryType('Veg');
    setSpicyLevel(0);
    setIngredients('Fresh ingredients');
    setAllergens('None');
    setPreparationTime('15');
    setServingSize('1 Portion');
    setCalories('250');
    setInstructions('');
    setKitchenStation('Hot Station');
    setPriority('Normal');
    setIsFeatured(false);
    setIsRecommended(false);
    setIsTodaysSpecial(false);
    setIsActive(true);
    setDisplayOrder('1');
    setFormErrors({});
    setActiveTab('basic');
    setShowFormModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: FoodItem) => {
    setItemToEdit(item);
    setName(item.name || '');
    setItemCode(item.itemCode || `FOOD-${item.id.slice(-4)}`);
    setCategory(item.category || 'Breakfast');
    setSubcategory(item.subcategory || '');
    setDescription(item.description || '');
    setShortDescription(item.shortDescription || '');
    setImage(item.image || '');
    setAdditionalImages(item.additionalImages || []);
    setNewAddImageUrl('');
    setOriginalPrice(item.originalPrice !== undefined ? String(item.originalPrice) : String(item.price * 1.2));
    setSellingPrice(String(item.price || item.sellingPrice || 100));
    setDiscountPercent(String(item.discount || 0));
    setTaxPercent(String(item.tax || 0));
    setIsAvailable(item.isAvailable !== false);
    setAvailableFrom(item.availableFrom || '07:00');
    setAvailableUntil(item.availableUntil || '22:00');
    
    const stockQty = item.stockQuantity ?? item.stock ?? 50;
    setStockQuantity(String(stockQty));
    setMinimumStockLevel(String(item.minimumStockLevel ?? 10));
    setUnit(item.unit || 'units');

    setDietaryType(item.dietaryType || (item.isVegetarian ? 'Veg' : item.isNonVegetarian ? 'Non-Veg' : item.containsEgg ? 'Egg' : 'Veg'));
    setSpicyLevel(item.spicyLevel ?? 0);
    setIngredients(Array.isArray(item.ingredients) ? item.ingredients.join(', ') : (item.ingredients || ''));
    setAllergens(Array.isArray(item.allergens) ? item.allergens.join(', ') : (item.allergens || ''));
    setPreparationTime(String(item.preparationTime || item.estimatedTime || 15));
    setServingSize(item.servingSize || '1 Portion');
    setCalories(String(item.nutrition?.calories || item.calories || 250));

    setInstructions(item.instructions || '');
    setKitchenStation(item.kitchenStation || 'Hot Station');
    setPriority(item.priority || 'Normal');

    setIsFeatured(!!item.isFeatured || !!item.isPopular);
    setIsRecommended(!!item.isRecommended);
    setIsTodaysSpecial(!!item.isTodaysSpecial);
    setIsActive(item.isActive !== false);
    setDisplayOrder(String(item.displayOrder || 1));

    setFormErrors({});
    setActiveTab('basic');
    setShowFormModal(true);
  };

  // Image File Upload Helper
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToastError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerToastError('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setImage(result);
        triggerToastSuccess('Food image uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q) ||
        (Array.isArray(item.ingredients) ? item.ingredients.join(' ').toLowerCase().includes(q) : String(item.ingredients || '').toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      if (availabilityFilter !== 'ALL') {
        const stockQty = item.stockQuantity ?? item.stock ?? 0;
        const reservedQty = item.reservedQuantity || 0;
        const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
        const minStockLevel = item.minimumStockLevel ?? 10;

        if (availabilityFilter === 'AVAILABLE' && (!item.isAvailable || availQty <= 0)) return false;
        if (availabilityFilter === 'UNAVAILABLE' && item.isAvailable) return false;
        if (availabilityFilter === 'OUT_OF_STOCK' && availQty > 0) return false;
        if (availabilityFilter === 'LOW_STOCK' && (availQty <= 0 || availQty > minStockLevel)) return false;
      }

      if (dietaryFilter !== 'ALL') {
        const dt = item.dietaryType || (item.isVegetarian ? 'Veg' : item.isNonVegetarian ? 'Non-Veg' : item.containsEgg ? 'Egg' : 'Veg');
        if (dt !== dietaryFilter) return false;
      }

      if (specialFilter !== 'ALL') {
        if (specialFilter === 'TODAYS_SPECIAL' && !item.isTodaysSpecial) return false;
        if (specialFilter === 'FEATURED' && !item.isFeatured && !item.isPopular) return false;
        if (specialFilter === 'RECOMMENDED' && !item.isRecommended) return false;
      }

      if (statusFilter !== 'ALL') {
        const act = item.isActive !== false;
        if (statusFilter === 'ACTIVE' && !act) return false;
        if (statusFilter === 'INACTIVE' && act) return false;
      }

      return true;
    });
  }, [menuItems, searchQuery, selectedCategory, availabilityFilter, dietaryFilter, specialFilter, statusFilter]);

  // Quick Availability Toggle
  const handleQuickToggleAvailability = async (item: FoodItem) => {
    const newStatus = !item.isAvailable;
    const updated = menuItems.map(m => m.id === item.id ? { ...m, isAvailable: newStatus } : m);
    
    try {
      await api.updateMenu(updated);
      onUpdateMenu(updated);

      await api.addAuditLog({
        userId: currentUser?.id || 'staff-kds',
        userName: currentUser?.name || 'Kitchen Staff',
        userRole: currentUser?.role || 'STAFF',
        action: 'TOGGLE_AVAILABILITY',
        entity: 'FoodItem',
        entityId: item.id,
        details: `Set ${item.name} availability to ${newStatus ? 'AVAILABLE' : 'UNAVAILABLE'}`
      });

      triggerToastSuccess(`"${item.name}" is now ${newStatus ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      triggerToastError('Failed to update availability.');
    }
  };

  // Quick Today's Special Toggle
  const handleQuickToggleTodaysSpecial = async (item: FoodItem) => {
    const newSpecial = !item.isTodaysSpecial;
    const updated = menuItems.map(m => m.id === item.id ? { ...m, isTodaysSpecial: newSpecial } : m);

    try {
      await api.updateMenu(updated);
      onUpdateMenu(updated);
      triggerToastSuccess(`"${item.name}" ${newSpecial ? 'marked as Today\'s Special' : 'removed from Today\'s Special'}`);
    } catch (err) {
      triggerToastError('Failed to update Today\'s Special status.');
    }
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Food Item Name is required.';
    }

    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      errors.sellingPrice = 'Please enter a valid Selling Price (> 0).';
    }

    if (!category) {
      errors.category = 'Please select a Food Category.';
    }

    if (!description.trim()) {
      errors.description = 'Item Description is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit (Add or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerToastError('Please correct validation errors before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedSellingPrice = parseFloat(sellingPrice) || 0;
      const parsedOriginalPrice = parseFloat(originalPrice) || parsedSellingPrice * 1.2;
      const parsedDiscount = parseFloat(discountPercent) || 0;
      const parsedTax = parseFloat(taxPercent) || 0;
      const parsedFinalPrice = computedFinalPrice;

      const parsedStock = parseInt(stockQuantity, 10) || 0;
      const parsedMinStock = parseInt(minimumStockLevel, 10) || 10;
      const parsedPrepTime = parseInt(preparationTime, 10) || 15;
      const parsedCalories = parseInt(calories, 10) || 250;

      const now = Date.now();
      const foodItemPayload: FoodItem = {
        id: itemToEdit ? itemToEdit.id : `food-${now}-${Math.random().toString(36).substring(2, 6)}`,
        itemCode: itemCode.trim() || `FOOD-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || description.trim().slice(0, 80),
        price: parsedSellingPrice,
        costPrice: parsedSellingPrice * 0.7,
        sellingPrice: parsedSellingPrice,
        originalPrice: parsedOriginalPrice,
        discount: parsedDiscount,
        tax: parsedTax,
        finalPrice: parsedFinalPrice,
        category: category,
        subcategory: subcategory.trim(),
        mealTime: category === 'Breakfast' ? 'Breakfast' : category === 'Lunch' ? 'Lunch' : category === 'Snacks' ? 'Evening' : 'All Day',
        foodType: dietaryType,
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
        additionalImages: additionalImages,
        estimatedTime: parsedPrepTime,
        preparationTime: parsedPrepTime,
        stockQuantity: parsedStock,
        stock: parsedStock,
        availableQuantity: parsedStock,
        minimumStockLevel: parsedMinStock,
        unit: unit,
        isAvailable: isAvailable,
        isActive: isActive,
        availableFrom: availableFrom,
        availableUntil: availableUntil,
        isVegetarian: dietaryType === 'Veg' || dietaryType === 'Vegan',
        isNonVegetarian: dietaryType === 'Non-Veg',
        containsEgg: dietaryType === 'Egg',
        dietaryType: dietaryType,
        spicyLevel: spicyLevel,
        ingredients: ingredients.split(',').map(s => s.trim()).filter(Boolean),
        allergens: allergens.split(',').map(s => s.trim()).filter(Boolean),
        servingSize: servingSize.trim(),
        portionInfo: servingSize.trim(),
        nutrition: {
          calories: parsedCalories,
          protein: Math.round(parsedCalories * 0.04),
          carbs: Math.round(parsedCalories * 0.12),
          fat: Math.round(parsedCalories * 0.03)
        },
        instructions: instructions.trim(),
        kitchenStation: kitchenStation,
        priority: priority,
        isFeatured: isFeatured,
        isPopular: isFeatured,
        isRecommended: isRecommended,
        isTodaysSpecial: isTodaysSpecial,
        displayOrder: parseInt(displayOrder, 10) || 1,
        createdBy: itemToEdit?.createdBy || currentUser?.id || 'staff-kds',
        createdByName: itemToEdit?.createdByName || currentUser?.name || 'Kitchen Staff',
        createdAt: itemToEdit?.createdAt || now,
        updatedBy: currentUser?.id || 'staff-kds',
        updatedByName: currentUser?.name || 'Kitchen Staff',
        updatedAt: now
      };

      let updatedMenu: FoodItem[];
      if (itemToEdit) {
        updatedMenu = menuItems.map(m => m.id === itemToEdit.id ? foodItemPayload : m);
        triggerToastSuccess(`Food item "${foodItemPayload.name}" updated successfully!`);
      } else {
        updatedMenu = [foodItemPayload, ...menuItems];
        triggerToastSuccess(`Food item "${foodItemPayload.name}" added to canteen menu!`);
      }

      await api.updateMenu(updatedMenu);
      onUpdateMenu(updatedMenu);

      await api.addAuditLog({
        userId: currentUser?.id || 'staff-kds',
        userName: currentUser?.name || 'Kitchen Staff',
        userRole: currentUser?.role || 'STAFF',
        action: itemToEdit ? 'EDIT_FOOD_ITEM' : 'ADD_FOOD_ITEM',
        entity: 'FoodItem',
        entityId: foodItemPayload.id,
        details: `${itemToEdit ? 'Updated' : 'Added'} ${foodItemPayload.name} (Price: ₹${foodItemPayload.price}, Category: ${foodItemPayload.category})`
      });

      if (itemToView && itemToView.id === foodItemPayload.id) {
        setItemToView(foodItemPayload);
      }

      setShowFormModal(false);
      setItemToEdit(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to save food item.';
      setFormErrors({ submit: msg });
      triggerToastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Food Item (Soft Delete Deactivation)
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const updated = menuItems.map(m => m.id === itemToDelete.id ? { ...m, isAvailable: false, isActive: false } : m);
      await api.updateMenu(updated);
      onUpdateMenu(updated);

      await api.addAuditLog({
        userId: currentUser?.id || 'staff-kds',
        userName: currentUser?.name || 'Kitchen Staff',
        userRole: currentUser?.role || 'STAFF',
        action: 'DEACTIVATE_FOOD_ITEM',
        entity: 'FoodItem',
        entityId: itemToDelete.id,
        details: `Deactivated food item "${itemToDelete.name}"`
      });

      triggerToastSuccess(`"${itemToDelete.name}" deactivated cleanly.`);
      if (itemToView && itemToView.id === itemToDelete.id) {
        setItemToView(null);
      }
      setItemToDelete(null);
    } catch (err) {
      triggerToastError('Failed to deactivate food item.');
    }
  };

  const getDietaryBadge = (dt?: string) => {
    switch (dt) {
      case 'Non-Veg':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 border border-rose-500/20">🔴 Non-Veg</span>;
      case 'Egg':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">🟡 Egg</span>;
      case 'Vegan':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">🌱 Vegan</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">🟢 Veg</span>;
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-600" />
            <span>Kitchen Food Item & Menu Management</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Manage canteen dishes, pricing, stock levels, preparation, and specials
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-[#0f172a] text-orange-600 shadow-xs' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-[#0f172a] text-orange-600 shadow-xs' : 'text-slate-500'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORY CHIPS BAR */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {['ALL', ...FOOD_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/40'
            }`}
          >
            {cat === 'ALL' ? 'All Food Categories' : cat}
          </button>
        ))}
      </div>

      {/* 3. SEARCH & MULTI-FILTER BAR */}
      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish name, code, ingredients..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            />
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Availability</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="UNAVAILABLE">Unavailable / Disabled</option>
              <option value="LOW_STOCK">Low Stock Warning</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Dietary Filter */}
          <div>
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Dietary Types</option>
              <option value="Veg">🟢 Vegetarian</option>
              <option value="Non-Veg">🔴 Non-Vegetarian</option>
              <option value="Vegan">🌱 Vegan</option>
              <option value="Egg">🟡 Egg</option>
            </select>
          </div>

          {/* Special Promotion Filter */}
          <div>
            <select
              value={specialFilter}
              onChange={(e) => setSpecialFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
            >
              <option value="ALL">All Promotions</option>
              <option value="TODAYS_SPECIAL">⭐ Today's Special</option>
              <option value="FEATURED">🔥 Featured Items</option>
              <option value="RECOMMENDED">👍 Recommended</option>
            </select>
          </div>

        </div>

        {/* Filter Pills Reset Row */}
        {(selectedCategory !== 'ALL' || availabilityFilter !== 'ALL' || dietaryFilter !== 'ALL' || specialFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">
              Found <strong>{filteredItems.length}</strong> food items
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setAvailabilityFilter('ALL');
                setDietaryFilter('ALL');
                setSpecialFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT DISPLAY (TABLE OR GRID) */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
          <Utensils className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No Food Items Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No canteen dishes match your current filter settings. Click "Add Food Item" to add a new dish.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200/80 dark:border-slate-800">
                  <th className="p-4">Dish</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Stock Level</th>
                  <th className="p-4">Dietary & Special</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredItems.map(item => {
                  const stockQty = item.stockQuantity ?? item.stock ?? 0;
                  const reservedQty = item.reservedQuantity || 0;
                  const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
                  const minStockLevel = item.minimumStockLevel ?? 10;
                  const isOutOfStock = availQty <= 0 || !item.isAvailable;
                  const isLowStock = !isOutOfStock && availQty <= minStockLevel;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                      
                      {/* Dish Thumbnail & Code */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs" 
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.isTodaysSpecial && <span className="text-amber-500" title="Today's Special">⭐</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Code: {item.itemCode || `FOOD-${item.id.slice(-4)}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {item.category}
                        {item.subcategory && <div className="text-[10px] text-slate-400 font-normal">{item.subcategory}</div>}
                      </td>

                      {/* Pricing */}
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          ₹{item.price}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₹{item.originalPrice}
                          </div>
                        )}
                      </td>

                      {/* Availability Quick Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleQuickToggleAvailability(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                            item.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{item.isAvailable ? 'Available' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Stock Quantity */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className={`font-extrabold ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                            {availQty} {item.unit || 'units'}
                          </div>
                          {isLowStock && <div className="text-[9px] font-bold text-amber-500">Low Stock</div>}
                          {isOutOfStock && <div className="text-[9px] font-bold text-rose-500">Out of Stock</div>}
                        </div>
                      </td>

                      {/* Dietary & Badges */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {getDietaryBadge(item.dietaryType || (item.isVegetarian ? 'Veg' : item.isNonVegetarian ? 'Non-Veg' : 'Veg'))}
                          {item.isFeatured && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/10 text-orange-600">Featured</span>}
                        </div>
                      </td>

                      {/* Actions (Eye View, Pencil Edit, Star Special, Trash Delete) */}
                      <td className="p-4 text-right space-x-1">
                        {/* Star Today's Special Toggle */}
                        <button
                          onClick={() => handleQuickToggleTodaysSpecial(item)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            item.isTodaysSpecial 
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' 
                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                          title="Toggle Today's Special"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>

                        {/* Eye View */}
                        <button
                          onClick={() => setItemToView(item)}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title="View Full Item Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Pencil Edit */}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                          title="Edit Food Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Trash Delete / Deactivate */}
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Deactivate Dish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const stockQty = item.stockQuantity ?? item.stock ?? 0;
            const reservedQty = item.reservedQuantity || 0;
            const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
            const minStockLevel = item.minimumStockLevel ?? 10;
            const isOutOfStock = availQty <= 0 || !item.isAvailable;
            const isLowStock = !isOutOfStock && availQty <= minStockLevel;

            return (
              <div key={item.id} className="p-4 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 relative group">
                
                {/* Image & Badges */}
                <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {getDietaryBadge(item.dietaryType)}
                    {item.isTodaysSpecial && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-xs">⭐ Special</span>}
                  </div>

                  <button
                    onClick={() => handleQuickToggleAvailability(item)}
                    className={`absolute top-2 right-2 p-1.5 rounded-xl text-[10px] font-extrabold backdrop-blur-md transition-all cursor-pointer ${
                      item.isAvailable ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
                    }`}
                  >
                    {item.isAvailable ? 'Available' : 'Disabled'}
                  </button>
                </div>

                {/* Details */}
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{item.name}</h4>
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400">₹{item.price}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold line-clamp-1 mt-0.5">{item.description}</p>
                </div>

                {/* Stock Level Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                    Stock: {availQty} {item.unit || 'units'}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setItemToView(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. EYE ICON — FULL FOOD ITEM DETAILS MODAL */}
      {itemToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header Banner */}
            <div className="relative h-48 bg-slate-900 text-white shrink-0 overflow-hidden">
              <img src={itemToView.image} alt={itemToView.name} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    {getDietaryBadge(itemToView.dietaryType)}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white backdrop-blur-md">
                      {itemToView.category}
                    </span>
                    {itemToView.isTodaysSpecial && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">⭐ Today's Special</span>}
                  </div>
                  <h3 className="text-2xl font-black">{itemToView.name}</h3>
                  <p className="text-xs text-slate-300 font-mono">SKU: {itemToView.itemCode || itemToView.id}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const itm = itemToView;
                      setItemToView(null);
                      openEditModal(itm);
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-lg flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Dish</span>
                  </button>
                  <button
                    onClick={() => setItemToView(null)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Details Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Basic Description */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">Description</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {itemToView.description}
                </p>
              </div>

              {/* Pricing & Financial Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Pricing Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Original Price</span>
                    <span className="font-extrabold text-slate-900 dark:text-white line-through">₹{itemToView.originalPrice || itemToView.price * 1.2}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Selling Price</span>
                    <span className="font-extrabold text-orange-600 dark:text-orange-400 text-sm">₹{itemToView.price}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Discount %</span>
                    <span className="font-extrabold text-emerald-600">{itemToView.discount || 0}% OFF</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Final Price (with GST)</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">₹{(itemToView.finalPrice || itemToView.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Stock & Availability */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Stock & Availability Window</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Availability Status</span>
                    <span className={`font-extrabold ${itemToView.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {itemToView.isAvailable ? 'Available' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Current Stock</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{itemToView.stockQuantity ?? itemToView.stock ?? 0} {itemToView.unit || 'units'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Available Hours</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{itemToView.availableFrom || '07:00'} - {itemToView.availableUntil || '22:00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Low Stock Threshold</span>
                    <span className="font-extrabold text-amber-500">{itemToView.minimumStockLevel ?? 10} units</span>
                  </div>
                </div>
              </div>

              {/* Food & Nutritional Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Food & Nutritional Info</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Serving Size</span>
                    <span className="font-bold text-slate-900 dark:text-white">{itemToView.servingSize || '1 Portion'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Prep Time</span>
                    <span className="font-bold text-slate-900 dark:text-white">{itemToView.preparationTime || itemToView.estimatedTime || 15} mins</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Calories</span>
                    <span className="font-bold text-slate-900 dark:text-white">{itemToView.nutrition?.calories || 250} kcal</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Spicy Level</span>
                    <span className="font-bold text-slate-900 dark:text-white">{itemToView.spicyLevel === 0 ? 'Mild' : itemToView.spicyLevel === 1 ? 'Medium 🌶' : 'Spicy 🌶🌶'}</span>
                  </div>
                </div>
              </div>

              {/* Ingredients & Allergens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <span className="text-slate-400 block text-[10px] font-semibold mb-1">Key Ingredients</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {Array.isArray(itemToView.ingredients) ? itemToView.ingredients.join(', ') : (itemToView.ingredients || 'None specified')}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl">
                  <span className="text-slate-400 block text-[10px] font-semibold mb-1">Known Allergens</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {Array.isArray(itemToView.allergens) ? itemToView.allergens.join(', ') : (itemToView.allergens || 'None')}
                  </span>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Created By</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{itemToView.createdByName || 'Kitchen Staff'}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{itemToView.createdAt ? new Date(itemToView.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Last Updated By</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{itemToView.updatedByName || 'Kitchen Staff'}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{itemToView.updatedAt ? new Date(itemToView.updatedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. ADD / EDIT COMPLETE FOOD ITEM FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {itemToEdit ? `Edit Food Item — ${itemToEdit.name}` : 'Add New Food Item'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Complete dish specifications, image, pricing, and availability
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Section Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-5 pt-2 shrink-0 overflow-x-auto no-scrollbar">
              {[
                { id: 'basic', label: '1. Basic Info & Image', icon: ImageIcon },
                { id: 'pricing', label: '2. Pricing & GST', icon: DollarSign },
                { id: 'stock', label: '3. Stock & Hours', icon: Clock },
                { id: 'kitchen', label: '4. Food & Kitchen Info', icon: Flame }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      isActive 
                        ? 'border-orange-600 text-orange-600 dark:text-orange-400' 
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Errors Banner */}
            {formErrors.submit && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.submit}</span>
              </div>
            )}

            {/* Main Form Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: BASIC INFO & IMAGE */}
              {activeTab === 'basic' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Dish Name */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Food Item Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Special Masala Dosa"
                        className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border ${formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} text-slate-900 dark:text-white focus:border-orange-500 outline-none`}
                      />
                      {formErrors.name && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.name}</p>}
                    </div>

                    {/* Item Code / SKU */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Item Code / SKU
                      </label>
                      <input
                        type="text"
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                        placeholder="FOOD-BRK-001"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none font-mono"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      >
                        {FOOD_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        placeholder="e.g. South Indian / Hot Drinks"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Full Description *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Crispy Golden Dosa served with potato masala, coconut chutney, and sambar..."
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Image Preview & Upload Controls */}
                    <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl space-y-3">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Food Image Upload & Preview
                      </label>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-sm relative group">
                          {image ? (
                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 flex-1 w-full">
                          <div className="flex items-center space-x-2">
                            <label className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center space-x-2 cursor-pointer shadow-xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Image File</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageFileUpload}
                                className="hidden" 
                              />
                            </label>

                            {image && (
                              <button
                                type="button"
                                onClick={() => setImage('')}
                                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-300"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="Or paste image URL (https://...)"
                            className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & FINANCIALS */}
              {activeTab === 'pricing' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Selling Price */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="100"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Original Price */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Original Price (for Discount Strikeout)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="120"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Tax % */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Tax / GST %
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(e.target.value)}
                        placeholder="5"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Final Auto-Computed Price Preview */}
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 block">Final Customer Price</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">₹{computedFinalPrice.toFixed(2)}</span>
                      </div>
                      <Tag className="w-6 h-6 text-orange-600" />
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: STOCK & HOURS */}
              {activeTab === 'stock' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Availability Toggle */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Immediate Availability Status
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAvailable(!isAvailable)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-between border transition-all cursor-pointer ${
                          isAvailable
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        }`}
                      >
                        <span>{isAvailable ? 'AVAILABLE FOR ORDERING' : 'DISABLED / UNAVAILABLE'}</span>
                        <Power className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity Available */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Stock Quantity Available *
                      </label>
                      <input
                        type="number"
                        required
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="50"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Low Stock Threshold */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        value={minimumStockLevel}
                        onChange={(e) => setMinimumStockLevel(e.target.value)}
                        placeholder="10"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Portion Unit
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="units / plates / cups"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Available From */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Available From (Time)
                      </label>
                      <input
                        type="time"
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Available Until */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Available Until (Time)
                      </label>
                      <input
                        type="time"
                        value={availableUntil}
                        onChange={(e) => setAvailableUntil(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: FOOD & KITCHEN INFO */}
              {activeTab === 'kitchen' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Dietary Type */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Dietary Preference *
                      </label>
                      <select
                        value={dietaryType}
                        onChange={(e) => setDietaryType(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      >
                        <option value="Veg">🟢 Vegetarian</option>
                        <option value="Non-Veg">🔴 Non-Vegetarian</option>
                        <option value="Vegan">🌱 Vegan</option>
                        <option value="Egg">🟡 Contains Egg</option>
                      </select>
                    </div>

                    {/* Spicy Level */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Spicy Level
                      </label>
                      <select
                        value={spicyLevel}
                        onChange={(e) => setSpicyLevel(parseInt(e.target.value, 10))}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      >
                        <option value={0}>Mild (Not Spicy)</option>
                        <option value={1}>Medium 🌶</option>
                        <option value={2}>Spicy 🌶🌶</option>
                        <option value={3}>Extra Hot 🌶🌶🌶</option>
                      </select>
                    </div>

                    {/* Prep Time */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Preparation Time (Mins)
                      </label>
                      <input
                        type="number"
                        value={preparationTime}
                        onChange={(e) => setPreparationTime(e.target.value)}
                        placeholder="15"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Serving Size */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Serving Portion Size
                      </label>
                      <input
                        type="text"
                        value={servingSize}
                        onChange={(e) => setServingSize(e.target.value)}
                        placeholder="e.g. 2 Pcs / 300ml"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Ingredients */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Ingredients (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="Rice, Lentils, Ghee, Potato, Spices"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Allergens */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Known Allergens
                      </label>
                      <input
                        type="text"
                        value={allergens}
                        onChange={(e) => setAllergens(e.target.value)}
                        placeholder="Dairy, Nuts, Gluten"
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                      />
                    </div>

                    {/* Special Flags Checkboxes */}
                    <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl flex flex-wrap gap-4 items-center">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTodaysSpecial}
                          onChange={(e) => setIsTodaysSpecial(e.target.checked)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-bold">⭐ Today's Special</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-bold">🔥 Featured Item</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isRecommended}
                          onChange={(e) => setIsRecommended(e.target.checked)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-bold">👍 Recommended</span>
                      </label>
                    </div>

                  </div>
                </div>
              )}

            </form>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center space-x-2">
                {activeTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'kitchen') setActiveTab('stock');
                      else if (activeTab === 'stock') setActiveTab('pricing');
                      else if (activeTab === 'pricing') setActiveTab('basic');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
                  >
                    Previous Step
                  </button>
                )}
                {activeTab !== 'kitchen' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'basic') setActiveTab('pricing');
                      else if (activeTab === 'pricing') setActiveTab('stock');
                      else if (activeTab === 'stock') setActiveTab('kitchen');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300"
                  >
                    Next Step
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Item...</span>
                    </>
                  ) : (
                    <span>{itemToEdit ? 'Save Changes' : 'Create Food Item'}</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. DEACTIVATE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Deactivate Dish?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to deactivate <strong>"{itemToDelete.name}"</strong>? It will be safely disabled without breaking past orders.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Deactivate Dish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
