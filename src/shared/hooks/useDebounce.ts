import { useEffect, useState } from 'react';

/**
 * Hook that debounces a value, delaying updates until after the specified delay
 * Useful for preventing excessive API calls or state updates while user is typing
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before updating the debounced value
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that debounces a callback function, preventing it from being called too frequently
 * Useful for auto-save functionality or preventing button spam
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds before allowing the callback to be called again
 * @returns The debounced callback function
 * 
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback((text: string) => {
 *   saveToDatabase(text);
 * }, 1000);
 * 
 * const handleTextChange = (text: string) => {
 *   debouncedSave(text); // Will only save after user stops typing for 1 second
 * };
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setTimeoutId(newTimeoutId);
  }) as T;

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return debouncedCallback;
}
