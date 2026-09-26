import { FoodItem, Order } from '../../types';
import { LocalAIConversationManager, LocalRecommendationEngine, LocalEntityExtractor } from '../../../ai-engine';

const conversationManager = new LocalAIConversationManager();
const recommendationEngine = new LocalRecommendationEngine();
const entityExtractor = new LocalEntityExtractor();

export const getFoodRecommendation = async (preferences: string, menu: FoodItem[]): Promise<string> => {
  const entities = entityExtractor.extract(preferences);
  const recommendations = recommendationEngine.recommend(menu, entities);
  if (recommendations.length > 0) {
    const top2 = recommendations.slice(0, 2);
    return `We recommend: ${top2.map(r => `${r.food.name} (₹${r.food.price})`).join(' and ')}. ${top2[0].explanation}`;
  }
  return "We recommend trying our popular Masala Dosa or Fresh Fruit Juice!";
};

export const analyzeMealNutrition = async (items: FoodItem[]): Promise<string> => {
  if (!items || items.length === 0) {
    return "Select items to see nutritional insights!";
  }
  const totalCalories = items.reduce((sum, item) => sum + (item.nutrition?.calories || 250), 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.nutrition?.protein || 8), 0);
  const healthScore = Math.min(10, Math.max(6, Math.round(totalProtein * 0.4 + (1000 - totalCalories) * 0.005)));

  return `Healthy Score: ${healthScore}/10. Total Meal Stats: ~${totalCalories} kcal, ${totalProtein}g protein. A great energizing combo for your campus routine!`;
};

export const generateSpendingStatementEmail = async (userName: string, stats: { daily: number; weekly: number; monthly: number; topItems: string[] }): Promise<string> => {
  const topItemsStr = stats.topItems && stats.topItems.length > 0 ? stats.topItems.join(', ') : 'Daily Specials';
  return `Hi ${userName},

Here is your CraveCanteen Spending Statement:
- Today's Spend: ₹${stats.daily}
- This Week's Spend: ₹${stats.weekly}
- This Month's Spend: ₹${stats.monthly}
- Favorite Items: ${topItemsStr}

Pro Tip: Select daily time-slots to avoid queue wait times and collect 1 reward point per ₹10 spent!

Thank you for choosing CraveCanteen!`;
};

export const createAssistantChat = (menu: FoodItem[], userName: string, orders: Order[]) => {
  return {
    async sendMessage(params: { message: string } | string) {
      const userText = typeof params === 'string' ? params : params.message;
      const res = conversationManager.processMessage(userText, {
        menu,
        activeOrders: orders,
        currentUser: { id: 'usr-current', name: userName, email: '', role: 'STUDENT' as any }
      });
      return {
        text: res.message
      };
    }
  };
};
