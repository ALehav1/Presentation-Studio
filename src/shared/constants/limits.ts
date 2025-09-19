// Input validation and size limits for script processing
// These prevent memory exhaustion and infinite processing

export const SCRIPT_LIMITS = {
  MAX_SCRIPT_SIZE: 100000,      // ~100KB - reasonable for presentations
  MAX_SLIDES: 100,              // More than enough for any presentation
  MAX_SECTIONS: 200,            // Prevents excessive parsing
  MIN_SLIDE_COUNT: 1,           // Must have at least one slide
  MAX_SLIDE_SCRIPT_LENGTH: 5000, // ~5KB per slide is very generous
  MIN_SECTION_LENGTH: 10,       // Minimum meaningful content
} as const;

export const UI_LIMITS = {
  MAX_FILENAME_LENGTH: 255,     // Standard filesystem limit
  MAX_SEARCH_QUERY_LENGTH: 500, // Reasonable search query size
  MAX_ERROR_MESSAGE_LENGTH: 1000, // Error display limit
} as const;

export const PERFORMANCE_LIMITS = {
  DEBOUNCE_DELAY: 500,          // Standard debounce for user input
  LONG_DEBOUNCE_DELAY: 1000,    // For expensive operations
  MAX_PROCESSING_TIME: 30000,   // 30 seconds max for any operation
  MAX_CONCURRENT_REQUESTS: 3,   // Limit parallel API calls
} as const;

// Error messages for limit violations
export const LIMIT_ERRORS = {
  SCRIPT_TOO_LARGE: `Script is too large (max ${SCRIPT_LIMITS.MAX_SCRIPT_SIZE.toLocaleString()} characters). Please split into smaller presentations.`,
  TOO_MANY_SLIDES: `Too many slides (max ${SCRIPT_LIMITS.MAX_SLIDES}). Consider breaking into multiple presentations.`,
  TOO_MANY_SECTIONS: `Script has too many sections (max ${SCRIPT_LIMITS.MAX_SECTIONS}). Please simplify the structure.`,
  SLIDE_SCRIPT_TOO_LONG: `Individual slide script is too long (max ${SCRIPT_LIMITS.MAX_SLIDE_SCRIPT_LENGTH.toLocaleString()} characters).`,
  PROCESSING_TIMEOUT: `Processing took too long (max ${PERFORMANCE_LIMITS.MAX_PROCESSING_TIME / 1000} seconds). Please try with a shorter script.`,
} as const;

// Validation functions
export function validateScriptLength(script: string): void {
  if (script.length > SCRIPT_LIMITS.MAX_SCRIPT_SIZE) {
    throw new Error(LIMIT_ERRORS.SCRIPT_TOO_LARGE);
  }
}

export function validateSlideCount(slideCount: number): void {
  if (slideCount < SCRIPT_LIMITS.MIN_SLIDE_COUNT) {
    throw new Error('Must have at least one slide.');
  }
  if (slideCount > SCRIPT_LIMITS.MAX_SLIDES) {
    throw new Error(LIMIT_ERRORS.TOO_MANY_SLIDES);
  }
}

export function validateSectionCount(sectionCount: number): void {
  if (sectionCount > SCRIPT_LIMITS.MAX_SECTIONS) {
    throw new Error(LIMIT_ERRORS.TOO_MANY_SECTIONS);
  }
}

export function validateSlideScript(script: string): void {
  if (script.length > SCRIPT_LIMITS.MAX_SLIDE_SCRIPT_LENGTH) {
    throw new Error(LIMIT_ERRORS.SLIDE_SCRIPT_TOO_LONG);
  }
}

// Safe processing wrapper with timeout
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = PERFORMANCE_LIMITS.MAX_PROCESSING_TIME,
  errorMessage: string = LIMIT_ERRORS.PROCESSING_TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
}
