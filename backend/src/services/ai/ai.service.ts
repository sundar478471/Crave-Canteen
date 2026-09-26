import { LocalAIConversationManager } from '../../../../ai-engine';

export class AiService {
  private static conversationManager = new LocalAIConversationManager();

  static async generateSpendingStatement(userName: string, stats: any) {
    const monthlySpend = stats?.monthly || 0;
    const yearlySpend = stats?.yearly || 0;
    const topItems = stats?.topItems || [];
    const topItemsStr = topItems.length > 0 ? topItems.join(', ') : 'Canteen Delights';

    return `Dear ${userName},

Here is your CraveCanteen Spending Statement:
• Monthly Total: ₹${monthlySpend}
• Cumulative Spend: ₹${yearlySpend}
• Favorite Campus Picks: ${topItemsStr}

Pro Saver Tip: Order during early time-slots and redeem your Crave Reward Points at checkout to save up to 15% on your daily meals!

Thank you for dining with CraveCanteen. Have a productive day on campus!`;
  }

  static async processChatMessage(message: string, context: any) {
    return this.conversationManager.processMessage(message, context);
  }
}
