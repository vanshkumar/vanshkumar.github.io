import { describe, it, expect } from 'vitest';

// Simplified version of the sorting logic for testing
function simulateBubbleSort(items, userChoices) {
  let hasSwapped = true;
  let passes = 0;
  const maxPasses = items.length - 1;
  const result = [...items];
  
  while (hasSwapped && passes < maxPasses) {
    hasSwapped = false;
    
    // For each pass, we need to compare all adjacent pairs
    for (let i = 0; i < items.length - 1; i++) {
      const leftIndex = i;
      const rightIndex = i + 1;
      
      // Simulate user choice - in real app this would be interactive
      const userPreferredRight = userChoices[passes]?.[i] ?? false;
      
      if (userPreferredRight) {
        // Swap if user prefers right item
        [result[leftIndex], result[rightIndex]] = [result[rightIndex], result[leftIndex]];
        hasSwapped = true;
      }
    }
    passes++;
  }
  
  return result;
}

describe('Bubble Sort Logic', () => {
  it('should correctly sort items based on user preferences', () => {
    const items = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' }
    ];
    
    // Simulate user choices for each pass
    // userChoices[pass][comparison] = true means user preferred right item
    const userChoices = [
      [true, false, true],  // First pass: swap A-B, keep B-C, swap C-D
      [false, true, false], // Second pass: keep B-A, swap C-B, keep D-C
      [false, false, false] // Third pass: no swaps (sorted)
    ];
    
    const result = simulateBubbleSort(items, userChoices);
    
    // Expected order after user choices: B, A, C, D
    expect(result.map(item => item.name)).toEqual(['B', 'A', 'C', 'D']);
  });

  it('should handle already sorted items', () => {
    const items = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' }
    ];
    
    // User never prefers right item over left
    const userChoices = [
      [false, false],
      [false, false]
    ];
    
    const result = simulateBubbleSort(items, userChoices);
    expect(result).toEqual(items);
  });

  it('should handle reverse sorted items', () => {
    const items = [
      { id: '3', name: 'C' },
      { id: '2', name: 'B' },
      { id: '1', name: 'A' }
    ];
    
    // User always prefers right item over left
    const userChoices = [
      [true, true],
      [true, false],
      [false, false]
    ];
    
    const result = simulateBubbleSort(items, userChoices);
    expect(result.map(item => item.name)).toEqual(['A', 'B', 'C']);
  });
}); 