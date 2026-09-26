import { GoogleGenAI } from "@google/genai";
import { FoodItem, Order, OrderStatus } from "@shared/types";


export const getFoodRecommendation = async (preferences: string, menu: FoodItem[]) => {
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) {
    return "I recommend the Classic Chicken Burger for a filling meal!";
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Based on the following canteen menu items:
    ${JSON.stringify(menu.map(m => ({ name: m.name, desc: m.description, cat: m.category })))}
    
    A user has this preference: "${preferences}".
    Recommend the top 2 best items from the menu. Return a friendly short sentence explaining why.
    Output format: Just the text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I recommend the Classic Chicken Burger for a filling meal!";
  }
};

export const analyzeMealNutrition = async (items: FoodItem[]) => {
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) {
    return "This meal looks great! Remember to stay hydrated.";
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Analyze this combination of canteen food items for a single meal:
    ${items.map(i => `${i.name} (${i.description})`).join(', ')}
    
    Provide a "Healthy Score" out of 10 and one unique nutritional fact or pairing insight. 
    Make it fun and encouraging for a college/office canteen environment.
    Limit to 2 short sentences. Output format: Plain text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Nutrition Error:", error);
    return "This meal looks great! Remember to stay hydrated.";
  }
};

export const generateSpendingStatementEmail = async (userName: string, stats: { daily: number, weekly: number, monthly: number, topItems: string[] }) => {
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) {
    return `Hi ${userName}, your monthly total is ₹${stats.monthly}. Thanks for dining with CraveCanteen!`;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `Generate a professional and friendly email "Monthly Spending Statement" for a student named ${userName} who uses our "CraveCanteen" app.
    
    Stats:
    - Today's Spend: ₹${stats.daily}
    - This Week's Spend: ₹${stats.weekly}
    - This Month's Spend: ₹${stats.monthly}
    - Most Ordered Items: ${stats.topItems.join(', ')}
    
    Include a polite opening, a breakdown of the spending, and a tip on how to save money next month.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Email Generation Error:", error);
    return `Hi ${userName}, your monthly total is ₹${stats.monthly}. Thanks for dining with CraveCanteen!`;
  }
};

export const createAssistantChat = (menu: FoodItem[], userName: string, orders: Order[]) => {
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key missing');
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const activeOrdersInfo = orders
    .filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED)
    .map(o => ({
      id: o.id,
      status: o.status,
      items: o.items.map((i: any) => i.name).join(', '),
      eta: new Date(o.estimatedFinishTime).toLocaleTimeString()
    }));

  const systemInstruction = `You are "Crave Assistant", a smart and friendly chatbot for a college canteen system called Crave Canteen.
The current user is ${userName}.

Your role:
- Help students order food
- Guide them through the ordering process
- Explain Bar Code-based preparation system
- Provide nutrition-based food suggestions
- Answer common canteen-related queries

Current Menu Items: ${JSON.stringify(menu.map(m => ({ name: m.name, price: m.price, category: m.category, available: m.isAvailable })))}
User's Active Orders: ${JSON.stringify(activeOrdersInfo)}`;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });
};
