import React from 'react';
import { FoodItem } from '../../types';
import { Plus, Minus, Clock, Star, Ban, Heart, Flame, AlertTriangle, CheckCircle } from 'lucide-react';

interface FoodCardProps {
  item: FoodItem;
  onAdd: () => void;
  onUpdateQuantity?: (delta: number) => void;
  quantity?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onItemClick?: () => void;
  isTimeAvailable?: boolean;
}

const FoodCard: React.FC<FoodCardProps> = ({ 
  item, 
  onAdd, 
  onUpdateQuantity, 
  quantity = 0, 
  isFavorite, 
  onToggleFavorite,
  onItemClick,
  isTimeAvailable = true 
}) => {
  // Stock-based availability calculation
  const stockQty = item.stockQuantity ?? item.stock ?? 0;
  const reservedQty = item.reservedQuantity || 0;
  const availQty = item.availableQuantity !== undefined ? item.availableQuantity : Math.max(0, stockQty - reservedQty);
  
  const isOutOfStock = availQty <= 0 || !item.isAvailable;
  const isLowStock = !isOutOfStock && availQty <= (item.minimumStockLevel ?? 5);
  const isDisabled = isOutOfStock || !isTimeAvailable;

  const isVeg = item.foodType === 'Veg' || item.isVegetarian || (
    !item.name.toLowerCase().includes('chicken') && 
    !item.name.toLowerCase().includes('egg') && 
    !item.name.toLowerCase().includes('mutton') &&
    !item.name.toLowerCase().includes('fish')
  );

  return (
    <div 
      onClick={onItemClick}
      className={`bg-white dark:bg-[#131b2e] rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 dark:hover:border-orange-500/50 transition-all duration-300 group flex flex-col cursor-pointer ${
        isDisabled ? 'opacity-80 cursor-not-allowed grayscale-[0.2]' : ''
      }`}
    >
      {/* Food Image Container */}
      <div className="relative h-36 sm:h-44 md:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img 
          src={item.image} 
          alt={item.name} 
          className={`w-full h-full object-cover transition-transform duration-500 ${!isDisabled && 'group-hover:scale-105'}`}
          loading="eager"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-75" />

        {/* Category & Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-[70%]">
          <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shadow-xs">
            {item.mealTime || item.category}
          </span>
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
            {item.foodType || item.category}
          </span>
        </div>
        
        {/* Rating & Favorite Heart */}
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-xl flex items-center text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200/60 dark:border-slate-800">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
            4.5
          </div>
          {onToggleFavorite && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 sm:p-2 rounded-xl backdrop-blur-md transition-all shadow-xs ${
                isFavorite 
                  ? 'bg-rose-500 text-white scale-105 shadow-rose-500/30' 
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'
              }`}
              title="Toggle Favorite"
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Veg / Non-Veg Indicator & Stock Badge */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-xs ${
            isVeg 
              ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
              : 'bg-rose-500/90 text-white border-rose-400/50'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {isVeg ? 'VEG' : 'NON-VEG'}
          </span>

          {/* Stock Badges */}
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
              <Ban className="w-3 h-3" />
              OUT OF STOCK
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              ONLY {availQty} LEFT
            </span>
          ) : (
            <span className="bg-emerald-600/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md border border-emerald-400/40 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {availQty} Available
            </span>
          )}
        </div>
      </div>
      
      {/* Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {item.name}
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 mb-3 leading-relaxed">
          {item.description}
        </p>
        
        {/* Nutrition Info Bar */}
        {item.nutrition && (
          <div className="flex items-center justify-between gap-2 mb-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center text-rose-500 font-bold">
              <Flame className="w-3.5 h-3.5 mr-1 text-rose-500" />
              <span>{item.nutrition.calories} kcal</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
              <span>P: {item.nutrition.protein}g</span>
              <span>C: {item.nutrition.carbs}g</span>
              <span>F: {item.nutrition.fat}g</span>
            </div>
          </div>
        )}

        {/* Prep Time */}
        <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-orange-600 dark:text-orange-400" />
          <span>{!isOutOfStock ? `Prep Time: ${item.estimatedTime || 10}–15 mins` : 'Currently Unavailable'}</span>
        </div>

        {/* Price & Add Button Bar */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Price</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">₹{item.price}</span>
          </div>

          {quantity > 0 ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-orange-50 dark:bg-orange-950/60 rounded-xl p-1 border border-orange-200 dark:border-orange-800/60 shadow-xs"
            >
              <button 
                type="button"
                onClick={() => onUpdateQuantity && onUpdateQuantity(-1)} 
                className="p-1.5 hover:bg-white dark:hover:bg-orange-900/60 rounded-lg transition-all text-orange-700 dark:text-orange-300 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-extrabold text-orange-900 dark:text-orange-100 px-3 text-sm">{quantity}</span>
              <button 
                type="button"
                disabled={quantity >= availQty}
                onClick={() => onUpdateQuantity && onUpdateQuantity(1)} 
                className={`p-1.5 rounded-lg transition-all text-orange-700 dark:text-orange-300 ${
                  quantity < availQty ? 'hover:bg-white dark:hover:bg-orange-900/60 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
                title={quantity >= availQty ? `Maximum available stock (${availQty}) reached` : 'Increase quantity'}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDisabled) onAdd();
              }}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                !isDisabled
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/20 active:scale-95 cursor-pointer' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none cursor-not-allowed border border-slate-300 dark:border-slate-700'
              }`}
            >
              {!isDisabled ? (
                <>
                  <Plus className="w-4 h-4" />
                  <span>ADD TO CART</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>OUT OF STOCK</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
