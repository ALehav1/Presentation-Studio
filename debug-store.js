// DEBUG COMMANDS - Run these in browser console
// Copy and paste each command to diagnose the issues

console.log('🔍 DEBUGGING PRACTICE MODE ISSUES');
console.log('================================');

// 1. Check if store exists and has data
const state = window.usePresentationStore?.getState();
if (!state) {
  console.error('❌ Store not found on window object');
} else {
  console.log('✅ Store exists');
  
  // 2. Check presentation data
  const presentation = state.currentPresentation;
  if (!presentation) {
    console.error('❌ No currentPresentation in store');
  } else {
    console.log('✅ Presentation exists:', presentation.title);
    console.log('📊 Total slides:', presentation.slides.length);
    console.log('🎯 Current slide index:', state.currentSlideIndex);
    
    // 3. Check current slide data
    const currentSlide = presentation.slides[state.currentSlideIndex];
    if (!currentSlide) {
      console.error('❌ Current slide not found at index:', state.currentSlideIndex);
    } else {
      console.log('✅ Current slide exists');
      console.log('📝 Has script:', !!currentSlide.script, '(length:', currentSlide.script?.length || 0, ')');
      console.log('🖼️ Has image:', !!currentSlide.imageUrl, '(length:', currentSlide.imageUrl?.length || 0, ')');
      
      if (currentSlide.script) {
        console.log('📄 Script preview:', currentSlide.script.substring(0, 100) + '...');
      } else {
        console.log('❌ Script is empty or undefined');
      }
      
      if (currentSlide.imageUrl) {
        console.log('🖼️ Image URL preview:', currentSlide.imageUrl.substring(0, 50) + '...');
      } else {
        console.log('❌ Image URL is empty (expected due to localStorage clearing)');
      }
    }
    
    // 4. Check all slides for scripts
    console.log('\n📋 ALL SLIDES SCRIPT STATUS:');
    presentation.slides.forEach((slide, index) => {
      console.log(`Slide ${index + 1}:`, {
        hasScript: !!slide.script,
        scriptLength: slide.script?.length || 0,
        hasImage: !!slide.imageUrl,
        imageLength: slide.imageUrl?.length || 0
      });
    });
  }
}

// 5. Check DOM elements in Practice Mode
console.log('\n🔍 DOM INSPECTION:');
const practiceElements = {
  'Practice button': !!document.querySelector('button')?.textContent?.includes('Practice'),
  'Script panes': document.querySelectorAll('[data-testid*="script"], .script-pane, textarea').length,
  'Image elements': document.querySelectorAll('img').length,
  'Three-column grid': !!document.querySelector('.lg\\:grid-cols-3'),
  'Mobile stack': !!document.querySelector('.lg\\:hidden')
};

console.table(practiceElements);

// 6. Check for React errors
console.log('\n⚠️ REACT ERRORS CHECK:');
const reactErrors = [];
const originalError = console.error;
console.error = function(...args) {
  if (args.some(arg => typeof arg === 'string' && (arg.includes('React') || arg.includes('Hook')))) {
    reactErrors.push(args.join(' '));
  }
  originalError.apply(console, args);
};

setTimeout(() => {
  if (reactErrors.length > 0) {
    console.log('❌ React errors found:', reactErrors);
  } else {
    console.log('✅ No React errors detected');
  }
}, 1000);

console.log('\n📋 SUMMARY:');
console.log('- Run this script in browser console while in Practice Mode');
console.log('- Check each section for ❌ errors');
console.log('- The script should show you exactly what data is available');
console.log('- Focus on the "Current slide" section - that shows what Practice Mode should display');
