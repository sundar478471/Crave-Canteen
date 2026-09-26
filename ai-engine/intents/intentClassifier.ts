import intentsData from '../training-data/intents.json';
import synonymsData from '../training-data/synonyms.json';

export interface ClassifiedIntent {
  intent: string;
  confidence: number;
  matchedKeywords: string[];
}

export class LocalIntentClassifier {
  private intents = intentsData.intents;
  private synonyms: Record<string, string[]> = synonymsData.synonyms;

  public classify(text: string): ClassifiedIntent {
    const normalized = text.toLowerCase().trim();
    let bestIntent = 'GENERAL_HELP';
    let maxScore = 0;
    let bestMatched: string[] = [];

    for (const intentObj of this.intents) {
      let score = 0;
      const matched: string[] = [];

      for (const kw of intentObj.keywords) {
        if (normalized.includes(kw.toLowerCase())) {
          score += 2;
          matched.push(kw);
        }
      }

      // Synonym expansion matching
      for (const [key, synList] of Object.entries(this.synonyms)) {
        for (const syn of synList) {
          if (normalized.includes(syn) && intentObj.keywords.some(k => k.toLowerCase().includes(key))) {
            score += 1;
            matched.push(syn);
          }
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestIntent = intentObj.id;
        bestMatched = matched;
      }
    }

    const confidence = Math.min(1.0, maxScore / 4);
    return {
      intent: maxScore > 0 ? bestIntent : 'GENERAL_HELP',
      confidence,
      matchedKeywords: bestMatched
    };
  }
}
