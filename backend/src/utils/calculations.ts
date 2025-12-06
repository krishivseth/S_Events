/**
 * Utility functions for statistical calculations
 */

export class Calculations {
  /**
   * Calculate median of number array
   */
  static median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate percentile
   */
  static percentile(numbers: number[], p: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate overlap between two arrays
   */
  static arrayOverlap<T>(arr1: T[], arr2: T[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    return intersection.size / Math.max(set1.size, set2.size, 1);
  }

  /**
   * Calculate weighted average
   */
  static weightedAverage(values: number[], weights: number[]): number {
    if (values.length !== weights.length || values.length === 0) return 0;
    const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    return weightSum > 0 ? weightedSum / weightSum : 0;
  }

  /**
   * Normalize value to 0-1 range
   */
  static normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }
}

