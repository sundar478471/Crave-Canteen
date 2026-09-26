import { LocalIntentClassifier } from '../intents/intentClassifier';
import trainingExamples from '../training-data/training_examples.json';

export class LocalAIEvaluator {
  private classifier = new LocalIntentClassifier();

  public evaluateDataset(): { total: number; passed: number; accuracy: number; fallbackRate: number } {
    let passed = 0;
    const total = trainingExamples.length;
    let fallbackCount = 0;

    for (const example of trainingExamples) {
      const result = this.classifier.classify(example.input);
      if (result.intent === example.intent) {
        passed++;
      }
      if (result.intent === 'GENERAL_HELP') {
        fallbackCount++;
      }
    }

    return {
      total,
      passed,
      accuracy: total > 0 ? (passed / total) * 100 : 100,
      fallbackRate: total > 0 ? (fallbackCount / total) * 100 : 0
    };
  }
}
