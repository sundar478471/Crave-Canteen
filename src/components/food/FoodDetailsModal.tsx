import React, { useState } from 'react';
import { FoodItem } from '../../types';
import { X, Star, Heart, Clock, CheckCircle2, Flame, Plus, Minus, ShoppingBag, Ban, AlertTriangle } from 'lucide-react';

interface FoodDetailsModalProps {
  item: FoodItem | null;
  onClose: () => void;
  onAddToCart: (item: FoodItem, quantity: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const FoodDetailsModal: React.FC<FoodDetailsModalProps> = ({
  item,
  onClose,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const stockQty = item.stockQuantity ?? item.stock ?? 0;
  const reservedQty = item.reservedQuantity || 0;
  const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
  
  const isOutOfStock = availQty <= 0 || !item.isAvailable;
  const isLowStock = !isOutOfStock && availQty <= (item.minimumStockLevel ?? 5);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(item, quantity);
    onClose();
  };

  const isVeg = item.foodType === 'Veg' || item.isVegetarian || (
    !item.name.toLowerCase().includes('chicken') && 
    !item.name.toLowerCase().includes('egg') && 
    !item.name.toLowerCase().includes('mutton') &&
    !item.name.toLowerCase().includes('fish')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/40 hover:bg-slate-950/60 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Food Image Banner */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-100 dark:bg-slate-800 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-1.5">
                <span className="inline-block px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                  {item.mealTime || item.category}
                </span>
                <span className="inline-block px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-black uppercase tracking-wider shadow-md border border-white/20">
                  {item.foodType || item.category}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {item.name}
              </h2>
            </div>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                className={`p-3 rounded-2xl backdrop-blur-md transition-all shadow-md shrink-0 cursor-pointer ${
                  isFavorite 
                    ? 'bg-rose-500 text-white scale-110 shadow-rose-500/40' 
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Rating, Price & Availability Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-xs font-extrabold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-500 mr-1.5" />
                <span>★ 4.5 (128 reviews)</span>
              </div>
              
              <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl border ${
                isVeg 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>

            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{item.price}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {item.description || "Crispy and fresh, prepared with finest ingredients in hygienic campus kitchen."}
            </p>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Preparation Time</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">{item.estimatedTime || 10}–15 mins</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isOutOfStock ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' :
                isLowStock ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' :
                'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}>
                {isOutOfStock ? <Ban className="w-4 h-4" /> : isLowStock ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock Status</span>
                <span className={`text-xs font-extrabold ${
                  isOutOfStock ? 'text-rose-600 dark:text-rose-400' :
                  isLowStock ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? `Low Stock (${availQty} left)` : `Available (${availQty} units)`}
                </span>
              </div>
            </div>
          </div>

          {/* Nutritional Information (if available) */}
          {item.nutrition && (
            <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center space-x-2 mb-3">
                <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Nutritional Information (Approx.)
                </h4>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700">
                  <span className="block text-[10px] font-semibold text-slate-400">Calories</span>
                  <span className="text-sm font-black text-orange-600 dark:text-orange-400">{item.nutrition.calories} kcal</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700">
                  <span className="block text-[10px] font-semibold text-slate-400">Protein</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{item.nutrition.protein} g</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700">
                  <span className="block text-[10px] font-semibold text-slate-400">Carbs</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{item.nutrition.carbs} g</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700">
                  <span className="block text-[10px] font-semibold text-slate-400">Fat</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{item.nutrition.fat} g</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between gap-4 shrink-0">
          
          {/* Quantity Selector */}
          <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              disabled={isOutOfStock}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-slate-900 dark:text-white px-2 min-w-[24px] text-center">
              {isOutOfStock ? 0 : quantity}
            </span>
            <button
              disabled={isOutOfStock || quantity >= availQty}
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
              !isOutOfStock
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white shadow-lg shadow-orange-500/25 cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-300 dark:border-slate-700'
            }`}
          >
            {!isOutOfStock ? (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>Add to Cart • ₹{item.price * quantity}</span>
              </>
            ) : (
              <>
                <Ban className="w-5 h-5" />
                <span>OUT OF STOCK</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
