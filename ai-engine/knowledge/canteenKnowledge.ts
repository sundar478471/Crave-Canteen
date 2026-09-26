export interface CanteenKnowledgeItem {
  id: string;
  topic: string;
  question: string;
  answer: string;
  keywords: string[];
}

export class CanteenKnowledgeBase {
  private faqs: CanteenKnowledgeItem[] = [
    {
      id: 'faq-1',
      topic: 'Order Pickup',
      question: 'How do I pick up my order?',
      answer: 'After placing an order, show your secure Digital QR Voucher at the canteen pickup counter. Staff will scan it and give you your food immediately.',
      keywords: ['pickup', 'collect', 'qr', 'voucher', 'how to pick up']
    },
    {
      id: 'faq-2',
      topic: 'Time Slots',
      question: 'Can I schedule an order for later?',
      answer: 'Yes! Select a time slot during checkout (e.g. 11:30 AM or 12:45 PM). We limit orders per slot so your food is fresh and waiting when you arrive.',
      keywords: ['schedule', 'time slot', 'timing', 'later', 'book in advance']
    },
    {
      id: 'faq-3',
      topic: 'Wallet & Top Up',
      question: 'How do Crave Wallet and Reward Points work?',
      answer: 'You earn 1 Reward Point for every ₹10 spent. You can redeem 10 points for a ₹1 discount. You can top up your wallet instantly via UPI.',
      keywords: ['wallet', 'points', 'rewards', 'top up', 'discount']
    },
    {
      id: 'faq-4',
      topic: 'Refund & Cancellation',
      question: 'Can I cancel my order?',
      answer: 'Orders can be cancelled before the kitchen starts preparing them. Refunds are credited instantly to your Crave Wallet.',
      keywords: ['cancel', 'cancellation', 'refund', 'money back']
    }
  ];

  public query(text: string): CanteenKnowledgeItem | null {
    const normalized = text.toLowerCase();
    for (const faq of this.faqs) {
      if (faq.keywords.some(kw => normalized.includes(kw))) {
        return faq;
      }
    }
    return null;
  }
}
