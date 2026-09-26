import { FoodItem } from '../../shared/types';
import { ExtractedEntities } from '../entities/entityExtractor';

export interface ScoredFoodItem {
  food: FoodItem;
  score: number;
  explanation: string;
}

export class LocalRecommendationEngine {
  public recommend(
    items: FoodItem[],
    entities: ExtractedEntities,
    userFavorites: string[] = []
  ): ScoredFoodItem[] {
    const scoredList: ScoredFoodItem[] = [];

    for (const food of items) {
      if (!food.isAvailable) continue;

      let score = 50; // base score
      const reasons: string[] = [];

      // Price filter/match
      if (entities.maxPrice !== undefined) {
        if (food.price <= entities.maxPrice) {
          score += 30;
          reasons.push(`Costs ₹${food.price} (under your limit of ₹${entities.maxPrice})`);
        } else {
          score -= 40; // Penalty if above limit
        }
      }

      // Category match
      if (entities.category && food.category === entities.category) {
        score += 25;
        reasons.push(`Matches category ${food.category}`);
      }

      // Veg preference
      if (entities.isVeg) {
        const isVegItem = !food.name.toLowerCase().includes('chicken') && !food.name.toLowerCase().includes('egg');
        if (isVegItem) {
          score += 20;
          reasons.push('Vegetarian item');
        } else {
          score -= 50;
        }
      }

      // High Protein
      if (entities.highProtein) {
        if (food.nutrition && food.nutrition.protein >= 10) {
          score += 25;
          reasons.push(`High protein (${food.nutrition.protein}g)`);
        }
      }

      // Favorite bonus
      if (userFavorites.includes(food.id)) {
        score += 15;
        reasons.push('In your favorites');
      }

      // Availability / prep time bonus
      const prepTime = food.estimatedTime ?? food.preparationTime ?? 10;
      if (prepTime <= 15) {
        score += 10;
        reasons.push(`Quick prep (${prepTime} mins)`);
      }

      if (score > 30) {
        const explanation = reasons.length > 0
          ? `Recommended because: ${reasons.join(', ')}.`
          : `Popular choice on campus available right now for ₹${food.price}.`;

        scoredList.push({
          food,
          score,
          explanation
        });
      }
    }

    return scoredList.sort((a, b) => b.score - a.score);
  }
}
