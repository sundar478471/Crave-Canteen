import { FoodItem } from '../../shared/types';

export const mockMenuItems: FoodItem[] = [
  {
    id: 'm1-test',
    name: 'Classic Idli Sambar',
    description: 'Fluffy steamed rice cakes with lentil soup.',
    price: 60,
    category: 'MORNING TIFFIN',
    timeSlot: 'Morning',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600',
    estimatedTime: 10,
    isAvailable: true,
    startHour: 6,
    endHour: 11,
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    nutrition: { calories: 210, protein: 8, carbs: 42, fat: 2 },
    stock: 50
  },
  {
    id: 'm2-test',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with spice-marinated chicken.',
    price: 250,
    category: 'MAIN COURSE',
    timeSlot: 'All Day',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=600',
    estimatedTime: 20,
    isAvailable: true,
    startHour: 12,
    endHour: 23,
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    nutrition: { calories: 620, protein: 34, carbs: 75, fat: 18 },
    stock: 30
  }
];
