import React from 'react';
import { FoodItem } from '@shared/types';

import { Plus, Minus, Clock, Star, Ban, Heart, Barcode as BarcodeIcon, Flame } from 'lucide-react';

interface FoodCardProps {
  item: FoodItem;
  onAdd: () => void;
  onUpdateQuantity?: (delta: number) => void;
  quantity?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isTimeAvailable?: boolean;
}

const FoodCard: React.FC<FoodCardProps> = ({ item, onAdd, onUpdateQuantity, quantity = 0, isFavorite, onToggleFavorite, isTimeAvailable = true }) => {
  const isDisabled = !item.isAvailable || !isTimeAvailable;

  const renderBarcode = (seed: string) => {
    const bars = [];
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let i = 0; i < 20; i++) {
      const width = ((hash + i) % 3) + 1;
      bars.push(<div key={i} className="bg-slate-900/30 rounded-full" style={{ width: `${width}px`, height: '100%' }}></div>);
    }
    return <div className="flex items-center space-x-0.5 h-3 opacity-40">{bars}</div>;
  };

  return (
    <div className={`bg-white rounded-xl md:rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 group flex flex-col ${isDisabled ? 'opacity-70 bg-gray-50 cursor-not-allowed grayscale-[0.5]' : 'hover:shadow-xl'}`}>
      <div className="relative h-28 md:h-48 overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name} 
          className={`w-full h-full object-cover transition-transform duration-500 ${!isDisabled && 'group-hover:scale-110'}`}
        />
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 md:gap-2">
          <span className="bg-white/90 backdrop-blur-md text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1.5 rounded-full uppercase tracking-widest text-orange-600 border border-orange-100">
            {item.category}
          </span>
          {!item.isAvailable ? (
            <span className="bg-rose-600 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              Sold Out
            </span>
          ) : !isTimeAvailable ? (
            <span className="bg-amber-500 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              Not in Slot
            </span>
          ) : null}
        </div>
        
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col space-y-1 md:space-y-2">
          <div className="bg-white/90 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg flex items-center text-[10px] md:text-xs font-bold text-gray-700 shadow-sm">
            <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500 fill-yellow-500 mr-0.5 md:mr-1" />
            4.5
          </div>
          {onToggleFavorite && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 md:p-2 rounded-lg md:rounded-xl backdrop-blur-md transition-all shadow-sm ${
                isFavorite 
                  ? 'bg-rose-500 text-white scale-110' 
                  : 'bg-white/90 text-gray-300 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-3 h-3 md:w-4 md:h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
      
      <div className="p-2.5 md:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xs md:text-lg font-black text-gray-900 italic leading-tight">{item.name}</h3>
          <BarcodeIcon className="w-2.5 h-2.5 md:w-4 md:h-4 text-slate-200 mt-0.5" />
        </div>
        <p className="text-[9px] md:text-xs text-gray-400 font-bold line-clamp-1 md:line-clamp-2 mb-2 md:mb-3">{item.description}</p>
        
        {item.nutrition && (
          <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-4 bg-gray-50 p-1 md:p-2 rounded-lg md:rounded-xl border border-gray-100">
             <div className="flex items-center text-rose-600 shrink-0">
                <Flame className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 md:mr-1" />
                <span className="text-[8px] md:text-[10px] font-black uppercase">{item.nutrition.calories} kcal</span>
             </div>
             <div className="h-3 md:h-3 w-[1px] bg-gray-200 shrink-0"></div>
             <div className="flex space-x-2 md:space-x-2 overflow-x-auto no-scrollbar">
                <span className="text-[8px] md:text-[8px] font-black text-slate-400 uppercase tracking-tighter">P: {item.nutrition.protein}g</span>
                <span className="text-[8px] md:text-[8px] font-black text-slate-400 uppercase tracking-tighter">C: {item.nutrition.carbs}g</span>
                <span className="text-[8px] md:text-[8px] font-black text-slate-400 uppercase tracking-tighter">F: {item.nutrition.fat}g</span>
             </div>
          </div>
        )}

        <div className="flex flex-col gap-1 mb-2 md:mb-4">
          <div className="flex items-center text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-orange-500" />
            {item.isAvailable ? `Ready in ${item.estimatedTime}m` : 'Unavailable'}
          </div>
          <div className="mt-1 md:mt-2">
            {renderBarcode(item.id)}
            <p className="text-[6px] md:text-[7px] font-black text-slate-300 tracking-[0.2em] md:tracking-[0.3em] uppercase mt-0.5">SKU: {item.id.split('-')[0]}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="text-sm md:text-2xl font-black text-gray-900">₹{item.price}</div>
          {quantity > 0 ? (
            <div className="flex items-center bg-orange-100 rounded-lg md:rounded-2xl p-1 md:p-1 border border-orange-200">
              <button 
                onClick={() => onUpdateQuantity && onUpdateQuantity(-1)} 
                className="p-1.5 md:p-2 hover:bg-white rounded-md md:rounded-xl transition-all text-orange-600 shadow-sm"
              >
                <Minus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <span className="font-black text-orange-700 px-2 md:px-3 min-w-[1.5rem] md:min-w-[2rem] text-center italic text-sm md:text-base">{quantity}</span>
              <button 
                onClick={() => onUpdateQuantity && onUpdateQuantity(1)} 
                className="p-1.5 md:p-2 hover:bg-white rounded-md md:rounded-xl transition-all text-orange-600 shadow-sm"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onAdd}
              disabled={isDisabled}
              className={`p-2 md:p-3 rounded-lg md:rounded-2xl transition-all shadow-md active:scale-95 ${
                !isDisabled
                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100' 
                  : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
              }`}
            >
              {!isDisabled ? <Plus className="w-4 h-4 md:w-6 md:h-6" /> : <Ban className="w-4 h-4 md:w-6 md:h-6" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
