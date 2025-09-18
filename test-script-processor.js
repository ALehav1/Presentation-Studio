// Test script processor directly
import { processScript } from './src/features/practice/utils/script-processor.ts';

const testScript = `
Welcome everyone. This is an important presentation about our key findings.
Remember to emphasize the growth metrics here.
Moving on to the next section, we'll examine the data.
Pause here for questions before clicking to continue.
`;

console.log('🧪 TESTING SCRIPT PROCESSOR');
console.log('Test Script:', testScript);

try {
  const result = processScript(testScript);
  
  console.log('✅ SCRIPT PROCESSOR RESULTS:');
  console.log('Key Points:', result.keyPoints);
  console.log('Transition Phrases:', result.transitionPhrases);
  console.log('Timing Cues:', result.timingCues);
  console.log('Word Count:', result.wordCount);
  console.log('Has Highlighted Script:', result.highlightedScript.length > testScript.length);
  
  // Validate expected results
  const checks = {
    'Has key points': result.keyPoints.length > 0,
    'Detected "important"': result.keyPoints.some(point => point.toLowerCase().includes('important')),
    'Detected "remember"': result.keyPoints.some(point => point.toLowerCase().includes('remember')),
    'Detected transition': result.transitionPhrases.some(phrase => phrase.toLowerCase().includes('moving on')),
    'Detected timing cue': result.timingCues.some(cue => cue.toLowerCase().includes('pause')),
    'Word count correct': result.wordCount > 0,
    'Script highlighted': result.highlightedScript.includes('**')
  };
  
  console.log('🔍 VALIDATION CHECKS:');
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  });
  
} catch (error) {
  console.error('❌ SCRIPT PROCESSOR FAILED:', error);
}
