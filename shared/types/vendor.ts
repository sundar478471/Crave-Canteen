export interface Vendor {
  id: string;
  name: string;
  code: string;
  category: string;
  isOpen: boolean;
  rating: number;
  image: string;
  operatingHours: { open: string; close: string };
  pickupLocations: string[];
}
