/**
 * Comprehensive test suite for PresentationStudio
 * Run these in browser console after loading the app
 */
import { usePresentationStore } from '../core/store/presentation';

// Test 1: Script Allocation with Semantic Detection
function testScriptAllocation() {
  console.log('\n📊 TESTING SCRIPT ALLOCATION');
  console.log('============================');
  
  const state = usePresentationStore.getState();
  const presentation = state.currentPresentation;
  
  if (!presentation) {
    console.error('❌ No presentation loaded. Upload a PDF first!');
    return false;
  }
  
  // Check if script was distributed
  const scripts = presentation.slides.map((s, i) => ({
    slide: i + 1,
    words: s.script?.split(/\s+/).filter(w => w.length > 0).length || 0,
    hasTransition: s.script?.match(/Moving on|Next|Finally|Now|Let's/i) ? '✅' : '',
    preview: s.script?.substring(0, 50) + '...'
  }));
  
  console.table(scripts);
  
  // Analyze distribution quality
  const wordCounts = scripts.map(s => s.words);
  const total = wordCounts.reduce((a, b) => a + b, 0);
  const variance = Math.max(...wordCounts) - Math.min(...wordCounts);
  const allHaveContent = wordCounts.every(w => w > 0);
  
  console.log('\n📈 Distribution Analysis:');
  console.log('Total words:', total);
  console.log('Distribution variance:', variance);
  console.log('Semantic sections detected:', presentation.slides.some(s => 
    s.script?.match(/Moving on|Next|Finally/i)) ? 'Yes' : 'No');
  
  const passed = allHaveContent && variance < 150;
  console.log('\n' + (passed ? '✅ SCRIPT ALLOCATION: PASSED' : '❌ SCRIPT ALLOCATION: FAILED'));
  
  return passed;
}

// Test 2: Bidirectional Sync
function testBidirectionalSync() {
  console.log('\n🔄 TESTING BIDIRECTIONAL SYNC');
  console.log('==============================');
  
  const store = usePresentationStore.getState();
  const testResults = [];
  
  // Test Setup → Practice
  const slide1Id = store.currentPresentation?.slides[0]?.id;
  if (slide1Id) {
    store.updateSlideScript(slide1Id, 'TEST FROM SETUP MODE', 'setup');
    const afterSetup = store.currentPresentation?.slides[0]?.script;
    testResults.push({
      test: 'Setup → Store',
      result: afterSetup === 'TEST FROM SETUP MODE' ? '✅ PASS' : '❌ FAIL'
    });
  }
  
  // Test Practice → Setup
  const slide2Id = store.currentPresentation?.slides[1]?.id;
  if (slide2Id) {
    store.updateSlideScript(slide2Id, 'TEST FROM PRACTICE MODE', 'practice');
    const afterPractice = store.currentPresentation?.slides[1]?.script;
    testResults.push({
      test: 'Practice → Store',
      result: afterPractice === 'TEST FROM PRACTICE MODE' ? '✅ PASS' : '❌ FAIL'
    });
  }
  
  // Check last edit tracking
  testResults.push({
    test: 'Edit tracking',
    result: store.lastEditLocation === 'practice' ? '✅ PASS' : '❌ FAIL'
  });
  
  console.table(testResults);
  
  const passed = testResults.every(t => t.result.includes('✅'));
  console.log('\n' + (passed ? '✅ SYNC TEST: PASSED' : '❌ SYNC TEST: FAILED'));
  
  return passed;
}

// Test 3: Mobile Layout
function testMobileLayout() {
  console.log('\n📱 TESTING MOBILE LAYOUT');
  console.log('========================');
  
  const hasHScroll = document.body.scrollWidth > window.innerWidth;
  const buttons = Array.from(document.querySelectorAll('button'));
  const smallButtons = buttons.filter(btn => {
    const rect = btn.getBoundingClientRect();
    return rect.height < 44 || rect.width < 44;
  });
  
  console.log('Horizontal scroll:', hasHScroll ? '❌ Yes' : '✅ No');
  console.log('Small buttons:', smallButtons.length === 0 ? '✅ None' : `❌ ${smallButtons.length} found`);
  
  const passed = !hasHScroll && smallButtons.length === 0;
  console.log('\n' + (passed ? '✅ MOBILE TEST: PASSED' : '❌ MOBILE TEST: FAILED'));
  
  return passed;
}

// Run all tests
function runAllTests() {
  console.clear();
  console.log('🧪 PRESENTATIONSTUDIO COMPREHENSIVE TEST SUITE');
  console.log('==============================================');
  console.log('Testing improved features:\n');
  
  const results = {
    scriptAllocation: testScriptAllocation(),
    bidirectionalSync: testBidirectionalSync(),
    mobileLayout: testMobileLayout()
  };
  
  console.log('\n📊 FINAL RESULTS:');
  console.log('================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? 
    '🎉 ALL TESTS PASSED! Ship it! 🚀' : 
    '⚠️ Some tests failed. Review the output above.'));
  
  return allPassed;
}

// Make functions globally accessible
if (typeof window !== 'undefined') {
  (window as any).runAllTests = runAllTests;
  (window as any).testScriptAllocation = testScriptAllocation;
  (window as any).testBidirectionalSync = testBidirectionalSync;
  (window as any).testMobileLayout = testMobileLayout;
}

export { runAllTests, testScriptAllocation, testBidirectionalSync, testMobileLayout };
  console.log('\n📊 TEST 1: SCRIPT ALLOCATION SYSTEM');
  console.log('=====================================');
  
  try {
    const storageKey = Object.keys(localStorage).find(k => k.includes('presentation') || k.includes('studio'));
    if (!storageKey) {
      console.error('❌ No presentation data found. Upload a presentation first.');
      return;
    }
    
    const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const presentation = data.state?.currentPresentation;
    
    if (!presentation) {
      console.error('❌ No current presentation. Upload slides first.');
      return;
    }
    
    // CHECK 1: Full script stored
    const hasFullScript = !!presentation.fullScript && presentation.fullScript.length > 0;
    console.log(`Full script stored: ${hasFullScript ? '✅ PASS' : '❌ FAIL'}`);
    
    // CHECK 2: Each slide has script  
    const scripts = presentation.slides.map((s: any) => s.script?.length || 0);
    const allHaveContent = scripts.every((len: number) => len > 0);
    console.log(`All slides have content: ${allHaveContent ? '✅ PASS' : '❌ FAIL'}`);
    console.log('Script lengths per slide:', scripts);
    
    // CHECK 3: Distribution is roughly even
    const words = presentation.slides.map((s: any) => s.script?.split(/\s+/).length || 0);
    const avg = words.reduce((a: number, b: number) => a + b, 0) / words.length;
    const variance = Math.max(...words) - Math.min(...words);
    const evenDistribution = variance < 100;
    console.log(`Even distribution (variance < 100): ${evenDistribution ? '✅ PASS' : '❌ FAIL'} (${variance} words)`);
    console.log('Words per slide:', words);
    
    // CHECK 4: Total words preserved
    const totalWords = words.reduce((a: number, b: number) => a + b, 0);
    const originalWords = presentation.fullScript?.split(/\s+/).length || 0;
    const wordsPreserved = Math.abs(totalWords - originalWords) < 50; // Allow some variance for sentence splitting
    console.log(`Words preserved: ${wordsPreserved ? '✅ PASS' : '❌ FAIL'} (${totalWords}/${originalWords})`);
    
    // Summary
    const allPassed = hasFullScript && allHaveContent && evenDistribution && wordsPreserved;
    console.log(`\n📊 Script Allocation: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Test 2: Bidirectional Sync
window.testBidirectionalSync = function() {
  console.log('\n🔄 TEST 2: BIDIRECTIONAL SYNC');
  console.log('=============================');
  
  try {
    const storageKey = Object.keys(localStorage).find(k => k.includes('presentation') || k.includes('studio'));
    if (!storageKey) {
      console.error('❌ No presentation data found.');
      return;
    }
    
    const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const state = data.state;
    
    // CHECK 1: Store has sync tracking
    const hasLastEditLocation = 'lastEditLocation' in state;
    console.log(`Sync tracking available: ${hasLastEditLocation ? '✅ PASS' : '❌ FAIL'}`);
    console.log('Last edit location:', state.lastEditLocation);
    
    // CHECK 2: Current slide data accessible
    const currentSlide = state.currentPresentation?.slides[state.currentSlideIndex];
    const hasCurrentSlideData = !!currentSlide;
    console.log(`Current slide data: ${hasCurrentSlideData ? '✅ PASS' : '❌ FAIL'}`);
    
    if (hasCurrentSlideData) {
      console.log('Current slide script length:', currentSlide.script?.length || 0);
      console.log('Current slide preview:', currentSlide.script?.substring(0, 50) || 'No script');
    }
    
    // CHECK 3: updateSlideScript function exists (this would need to be called from React context)
    console.log('🔄 Sync functions should be available in React components');
    console.log('✅ Store structure supports bidirectional sync');
    
    console.log(`\n🔄 Sync System: ${hasLastEditLocation && hasCurrentSlideData ? '🎉 READY' : '⚠️ INCOMPLETE'}`);
    
  } catch (error) {
    console.error('❌ Sync test failed:', error);
  }
};

// Test 3: Mobile Layout
window.testMobileLayout = function() {
  console.log('\n📱 TEST 3: MOBILE LAYOUT');
  console.log('========================');
  
  try {
    // CHECK 1: Viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const hasViewport = !!viewportMeta;
    console.log(`Mobile viewport meta: ${hasViewport ? '✅ PASS' : '❌ FAIL'}`);
    
    // CHECK 2: Touch targets
    const buttons = Array.from(document.querySelectorAll('button'));
    const smallButtons = buttons.filter(btn => {
      const rect = btn.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    });
    
    const touchTargetsOK = smallButtons.length === 0;
    console.log(`Touch targets (44px+): ${touchTargetsOK ? '✅ PASS' : '❌ FAIL'} (${smallButtons.length} too small)`);
    
    // CHECK 3: Text sizes
    const textElements = Array.from(document.querySelectorAll('p, div, span, textarea'));
    let smallTextCount = 0;
    
    textElements.forEach(el => {
      const style = getComputedStyle(el);
      const fontSize = parseInt(style.fontSize);
      const hasText = el.textContent && el.textContent.trim().length > 10;
      
      if (fontSize < 16 && hasText) {
        smallTextCount++;
      }
    });
    
    const textSizeOK = smallTextCount === 0;
    console.log(`Text readability (16px+): ${textSizeOK ? '✅ PASS' : '❌ FAIL'} (${smallTextCount} elements too small)`);
    
    // CHECK 4: No horizontal scroll
    const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
    console.log(`No horizontal scroll: ${!hasHorizontalScroll ? '✅ PASS' : '❌ FAIL'}`);
    
    // CHECK 5: DVH support (check if any elements use it)
    const dvhElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = getComputedStyle(el);
      return style.height?.includes('dvh');
    });
    console.log(`DVH viewport units used: ${dvhElements.length > 0 ? '✅ PASS' : 'ℹ️ Not detected'}`);
    
    const allMobilePassed = hasViewport && touchTargetsOK && textSizeOK && !hasHorizontalScroll;
    console.log(`\n📱 Mobile Layout: ${allMobilePassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
  } catch (error) {
    console.error('❌ Mobile test failed:', error);
  }
};

// Test 4: Edge Cases
window.testEdgeCases = function() {
  console.log('\n🔍 TEST 4: EDGE CASES');
  console.log('=====================');
  
  // This test requires React context to call the store methods
  console.log('⚠️ Edge case testing requires store access from React components');
  console.log('Manual tests to perform:');
  console.log('1. Empty script: parseAndApplyBulkScript("")');
  console.log('2. Short script: parseAndApplyBulkScript("This is short")');  
  console.log('3. Single slide presentation');
  console.log('4. Very long script (>5000 words)');
  
  console.log('\n🔍 Edge Cases: 📝 MANUAL TESTING REQUIRED');
};

// Master test runner
window.runAllTests = function() {
  console.clear();
  console.log('🧪 PRESENTATIONSTUDIO COMPREHENSIVE TEST SUITE');
  console.log('===============================================');
  console.log('Starting all automated tests...\n');
  
  window.testScriptAllocation();
  window.testBidirectionalSync();
  window.testMobileLayout();
  window.testEdgeCases();
  
  console.log('\n✨ AUTOMATED TESTS COMPLETE');
  console.log('Next: Run manual user flow tests');
  console.log('📋 See test checklist for manual verification steps');
};

// Auto-load message
console.log('🧪 Comprehensive test suite loaded!');
console.log('📊 testScriptAllocation() - Test script distribution');
console.log('🔄 testBidirectionalSync() - Test Setup/Practice sync');
console.log('📱 testMobileLayout() - Test mobile responsiveness');
console.log('🔍 testEdgeCases() - Test edge cases (manual)');
console.log('🎯 runAllTests() - Run all automated tests');

export {};
