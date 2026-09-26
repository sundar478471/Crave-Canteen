export interface ExtractedEntities {
  maxPrice?: number;
  minPrice?: number;
  isVeg?: boolean;
  isNonVeg?: boolean;
  highProtein?: boolean;
  category?: string;
  vendorId?: string;
  searchKeyword?: string;
}

export class LocalEntityExtractor {
  public extract(text: string): ExtractedEntities {
    const normalized = text.toLowerCase().trim();
    const entities: ExtractedEntities = {};

    // Price extraction
    const priceMatch = normalized.match(/(?:under|below|less than|within|rs\.?|₹|\$)\s*(\d+)/i) ||
                       normalized.match(/(\d+)\s*(?:rupees|rs|bucks|\/-)?/i);
    if (priceMatch) {
      const parsed = parseInt(priceMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 5000) {
        entities.maxPrice = parsed;
      }
    }

    // Dietary preferences
    if (normalized.includes('vegetarian') || normalized.includes('pure veg') || normalized.includes(' veg ') || normalized.startsWith('veg ')) {
      entities.isVeg = true;
    } else if (normalized.includes('non veg') || normalized.includes('non-veg') || normalized.includes('chicken') || normalized.includes('egg')) {
      entities.isNonVeg = true;
    }

    // Protein & Healthy
    if (normalized.includes('high protein') || normalized.includes('protein') || normalized.includes('gym') || normalized.includes('fit')) {
      entities.highProtein = true;
    }

    // Category mapping
    if (normalized.includes('breakfast') || normalized.includes('tiffin')) {
      entities.category = 'MORNING TIFFIN';
    } else if (normalized.includes('snack') || normalized.includes('bites')) {
      entities.category = 'SNACKS';
    } else if (normalized.includes('drink') || normalized.includes('beverage') || normalized.includes('juice') || normalized.includes('coffee') || normalized.includes('tea')) {
      entities.category = 'BEVERAGES';
    } else if (normalized.includes('dessert') || normalized.includes('sweet')) {
      entities.category = 'DESSERTS';
    } else if (normalized.includes('lunch') || normalized.includes('dinner') || normalized.includes('thali') || normalized.includes('main course')) {
      entities.category = 'MAIN COURSE';
    }

    // Vendor mapping
    if (normalized.includes('bakery')) {
      entities.vendorId = 'bakery-hub';
    } else if (normalized.includes('juice')) {
      entities.vendorId = 'juice-bar';
    } else if (normalized.includes('coffee')) {
      entities.vendorId = 'coffee-corner';
    } else if (normalized.includes('mess')) {
      entities.vendorId = 'hostel-mess';
    }

    return entities;
  }
}
