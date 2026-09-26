import { LocalIntentClassifier } from '../intents/intentClassifier';
import { LocalEntityExtractor } from '../entities/entityExtractor';
import { LocalRecommendationEngine, ScoredFoodItem } from '../recommendation/recommendationEngine';
import { CanteenKnowledgeBase } from '../knowledge/canteenKnowledge';
import { FoodItem, Order, User } from '../../shared/types';

export interface AIResponse {
  message: string;
  intent: string;
  suggestedItems?: FoodItem[];
  suggestedActions?: { label: string; action: string; payload?: any }[];
  explanation?: string;
}

export class LocalAIConversationManager {
  private classifier = new LocalIntentClassifier();
  private extractor = new LocalEntityExtractor();
  private recommender = new LocalRecommendationEngine();
  private knowledge = new CanteenKnowledgeBase();

  public processMessage(
    userMessage: string,
    context: {
      menu: FoodItem[];
      activeOrders?: Order[];
      currentUser?: User | null;
    }
  ): AIResponse {
    const classification = this.classifier.classify(userMessage);
    const entities = this.extractor.extract(userMessage);

    const { intent } = classification;

    if (intent === 'ORDER_STATUS') {
      const active = context.activeOrders?.find(o => o.status !== 'Collected' && o.status !== 'Cancelled');
      if (active) {
        return {
          message: `Your active order #${active.id} is currently [${active.status}]. Estimated time remaining: ~10 mins.`,
          intent,
          suggestedActions: [
            { label: 'View QR Code', action: 'VIEW_QR', payload: active.id },
            { label: 'View Order Details', action: 'GOTO_ORDERS' }
          ]
        };
      } else {
        return {
          message: 'You have no active orders in preparation right now. Would you like to order something fresh?',
          intent,
          suggestedActions: [{ label: 'Browse Menu', action: 'GOTO_MENU' }]
        };
      }
    }

    if (intent === 'REORDER') {
      const pastOrder = context.activeOrders?.[0];
      if (pastOrder && pastOrder.items.length > 0) {
        return {
          message: `Would you like to reorder your previous item "${pastOrder.items[0].name}" for ₹${pastOrder.totalAmount}?`,
          intent,
          suggestedActions: [
            { label: `Reorder ${pastOrder.items[0].name}`, action: 'REORDER_ITEM', payload: pastOrder.items[0] }
          ]
        };
      }
    }

    if (intent === 'WALLET_QUERY' || intent === 'REWARD_QUERY') {
      const pts = context.currentUser?.rewardPoints ?? 100;
      return {
        message: `Your Crave Rewards Balance: ${pts} Points (₹${(pts / 10).toFixed(2)} discount equivalent). Earn 1 point for every ₹10 spent!`,
        intent,
        suggestedActions: [{ label: 'Redeem Points at Checkout', action: 'GOTO_CHECKOUT' }]
      };
    }

    // Knowledge FAQ match fallback check
    const faq = this.knowledge.query(userMessage);
    if (faq) {
      return {
        message: `${faq.answer}`,
        intent: 'GENERAL_HELP',
        suggestedActions: [{ label: 'Explore Menu', action: 'GOTO_MENU' }]
      };
    }

    // Recommendation / Menu Search default logic
    const recommendations: ScoredFoodItem[] = this.recommender.recommend(
      context.menu,
      entities,
      context.currentUser?.favorites || []
    );

    if (recommendations.length > 0) {
      const top3 = recommendations.slice(0, 3).map(r => r.food);
      const topExplanation = recommendations[0].explanation;
      const budgetNote = entities.maxPrice ? ` under ₹${entities.maxPrice}` : '';

      return {
        message: `Here are the best options available right now${budgetNote}:`,
        intent: intent === 'GENERAL_HELP' ? 'FOOD_RECOMMENDATION' : intent,
        suggestedItems: top3,
        explanation: topExplanation,
        suggestedActions: [
          { label: 'View Full Menu', action: 'GOTO_MENU' }
        ]
      };
    }

    return {
      message: "I couldn't find an exact item match for that criteria right now, but our full menu has plenty of hot, fresh options available!",
      intent: 'GENERAL_HELP',
      suggestedActions: [{ label: 'Browse Full Menu', action: 'GOTO_MENU' }]
    };
  }
}
