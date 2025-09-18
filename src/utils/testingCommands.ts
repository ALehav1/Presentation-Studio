/**
 * Console testing commands for verifying script allocation and mobile functionality
 * Use these in browser console for debugging
 */

declare global {
  interface Window {
    testScriptDistribution: () => void;
    testMobileBreakpoints: () => void;
    testTouchTargets: () => void;
    testBidirectionalSync: () => void;
  }
}

// Test 1: Check script distribution
window.testScriptDistribution = function() {
  console.log('📊 SCRIPT DISTRIBUTION TEST');
  console.log('===========================');
  
  // Try to access the store (this might need to be called from React context)
  try {
    const storageKey = Object.keys(localStorage).find(k => k.includes('presentation') || k.includes('studio'));
    if (storageKey) {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const slides = data.state?.currentPresentation?.slides || [];
      
      console.table(slides.map((slide: any, i: number) => ({
        slide: i + 1,
        words: slide.script ? slide.script.split(/\s+/).length : 0,
        chars: slide.script?.length || 0,
        preview: slide.script?.substring(0, 50) || 'NO SCRIPT',
        hasScript: !!slide.script
      })));
      
      const wordCounts = slides.map((s: any) => s.script ? s.script.split(/\s+/).length : 0);
      const total = wordCounts.reduce((a: number, b: number) => a + b, 0);
      const average = total / wordCounts.length;
      const variance = Math.max(...wordCounts) - Math.min(...wordCounts);
      
      console.log(`📈 SUMMARY:`);
      console.log(`Total words: ${total}`);
      console.log(`Average per slide: ${Math.round(average)}`);
      console.log(`Variance: ${variance} words`);
      console.log(`Distribution quality: ${variance < 100 ? '✅ Good' : '⚠️ Uneven'}`);
    } else {
      console.log('❌ No presentation data found');
    }
  } catch (error) {
    console.error('Error testing distribution:', error);
  }
};

// Test 2: Mobile breakpoint simulation
window.testMobileBreakpoints = function() {
  console.log('📱 MOBILE BREAKPOINT TEST');
  console.log('=========================');
  
  const breakpoints = [
    { name: 'iPhone SE', width: '375px' },
    { name: 'iPhone 14', width: '390px' }, 
    { name: 'iPhone Pro Max', width: '430px' },
    { name: 'iPad Mini', width: '768px' }
  ];
  
  let currentIndex = 0;
  
  function testNextBreakpoint() {
    if (currentIndex < breakpoints.length) {
      const bp = breakpoints[currentIndex];
      document.body.style.maxWidth = bp.width;
      document.body.style.margin = '0 auto';
      document.body.style.border = '2px solid red';
      document.body.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)';
      
      console.log(`📱 Testing ${bp.name} (${bp.width})`);
      currentIndex++;
      
      setTimeout(testNextBreakpoint, 3000);
    } else {
      // Reset
      document.body.style.maxWidth = 'none';
      document.body.style.border = 'none';
      document.body.style.boxShadow = 'none';
      console.log('✅ Breakpoint testing complete');
    }
  }
  
  testNextBreakpoint();
};

// Test 3: Touch target verification
window.testTouchTargets = function() {
  console.log('👆 TOUCH TARGET TEST');
  console.log('====================');
  
  const buttons = document.querySelectorAll('button');
  const issues: any[] = [];
  
  buttons.forEach((btn, i) => {
    const rect = btn.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    if (width > 0 && height > 0) { // Only test visible buttons
      if (width < 44 || height < 44) {
        issues.push({
          index: i,
          text: btn.textContent?.slice(0, 30) || 'No text',
          size: `${Math.round(width)}x${Math.round(height)}px`,
          element: btn
        });
      }
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ All buttons meet minimum 44x44px touch target size');
  } else {
    console.log(`❌ Found ${issues.length} buttons too small for mobile:`);
    console.table(issues);
  }
  
  // Test font sizes
  const textElements = document.querySelectorAll('p, div, span, textarea');
  let smallTextCount = 0;
  
  textElements.forEach(el => {
    const style = getComputedStyle(el);
    const fontSize = parseInt(style.fontSize);
    if (fontSize < 16 && el.textContent && el.textContent.trim().length > 10) {
      smallTextCount++;
    }
  });
  
  if (smallTextCount === 0) {
    console.log('✅ All text meets minimum 16px size for mobile');
  } else {
    console.log(`⚠️ Found ${smallTextCount} text elements smaller than 16px`);
  }
};

// Test 4: Bidirectional sync verification
window.testBidirectionalSync = function() {
  console.log('🔄 BIDIRECTIONAL SYNC TEST');
  console.log('==========================');
  
  try {
    // This test would need to be run from within React context
    // For now, we'll test localStorage sync
    const storageKey = Object.keys(localStorage).find(k => k.includes('presentation') || k.includes('studio'));
    if (storageKey) {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const currentSlideIndex = data.state?.currentSlideIndex || 0;
      const slides = data.state?.currentPresentation?.slides || [];
      const currentSlide = slides[currentSlideIndex];
      const lastEditLocation = data.state?.lastEditLocation;
      
      console.log('Current slide:', currentSlideIndex + 1);
      console.log('Last edited from:', lastEditLocation || 'none');
      console.log('Current slide script length:', currentSlide?.script?.length || 0);
      console.log('✅ Store data accessible - sync should work');
      
      // Test would involve:
      // 1. Edit script in Setup mode
      // 2. Switch to Practice mode  
      // 3. Verify same script appears
      // 4. Edit in Practice mode
      // 5. Switch back to Setup
      // 6. Verify changes appear
      
    } else {
      console.log('❌ No presentation data for sync testing');
    }
  } catch (error) {
    console.error('Error testing sync:', error);
  }
};

// Auto-expose testing functions
console.log('🧪 Testing commands loaded! Available functions:');
console.log('📊 testScriptDistribution() - Check word distribution across slides');
console.log('📱 testMobileBreakpoints() - Simulate different screen sizes');
console.log('👆 testTouchTargets() - Verify buttons are touch-friendly');  
console.log('🔄 testBidirectionalSync() - Check Setup/Practice sync');

export {};
