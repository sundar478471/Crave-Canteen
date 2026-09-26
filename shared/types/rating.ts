export interface OrderRating {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  categories: {
    taste: number;
    quality: number;
    quantity: number;
    service: number;
    cleanliness: number;
  };
  comment?: string;
  createdAt: number;
}
