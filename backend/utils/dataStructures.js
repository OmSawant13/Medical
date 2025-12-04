// DSA Implementations for Healthcare System

/**
 * Binary Search for Patient/Drug Lookup - O(log n)
 * Used for searching in sorted arrays of patients, drugs, or medical codes
 */
class BinarySearch {
  static search(sortedArray, target, key = 'id') {
    let left = 0;
    let right = sortedArray.length - 1;
    let comparisons = 0;

    while (left <= right) {
      comparisons++;
      const mid = Math.floor((left + right) / 2);
      const midValue = typeof sortedArray[mid] === 'object' 
        ? sortedArray[mid][key] 
        : sortedArray[mid];

      if (midValue === target) {
        return { found: true, index: mid, data: sortedArray[mid], comparisons };
      }

      if (midValue < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return { found: false, index: -1, data: null, comparisons };
  }

  static searchPatientById(patients, patientId) {
    // Sort by roleSpecificId if not already sorted
    const sorted = [...patients].sort((a, b) => 
      a.roleSpecificId.localeCompare(b.roleSpecificId)
    );
    return this.search(sorted, patientId, 'roleSpecificId');
  }
}

/**
 * Priority Queue (Min-Heap) for ER Triage and Surgery Scheduling
 * Lower priority number = higher urgency
 */
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  enqueue(item, priority) {
    const node = { item, priority, timestamp: Date.now() };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      if (this.heap[index].priority >= this.heap[parentIndex].priority) break;
      
      [this.heap[index], this.heap[parentIndex]] = 
        [this.heap[parentIndex], this.heap[index]];
      
      index = parentIndex;
    }
  }

  bubbleDown(index) {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < this.heap.length && 
          this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }

      if (rightChild < this.heap.length && 
          this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = 
        [this.heap[smallest], this.heap[index]];
      
      index = smallest;
    }
  }

  size() {
    return this.heap.length;
  }

  toArray() {
    return [...this.heap].sort((a, b) => a.priority - b.priority);
  }
}

/**
 * Hash Map for O(1) Lookups
 * Used for patient records, drug interactions, insurance validation
 */
class FastLookupCache {
  constructor() {
    this.cache = new Map();
    this.accessCount = new Map();
  }

  set(key, value) {
    this.cache.set(key, value);
    this.accessCount.set(key, 0);
  }

  get(key) {
    if (this.cache.has(key)) {
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
      return { found: true, data: this.cache.get(key), accessTime: 'O(1)' };
    }
    return { found: false, data: null, accessTime: 'O(1)' };
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.accessCount.delete(key);
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessCount.clear();
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    return {
      totalEntries: this.cache.size,
      mostAccessed: this.getMostAccessed(),
      cacheHitRate: this.calculateHitRate()
    };
  }

  getMostAccessed() {
    let maxKey = null;
    let maxCount = 0;
    
    for (const [key, count] of this.accessCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxKey = key;
      }
    }
    
    return { key: maxKey, accessCount: maxCount };
  }

  calculateHitRate() {
    const totalAccess = Array.from(this.accessCount.values())
      .reduce((sum, count) => sum + count, 0);
    return totalAccess > 0 ? (totalAccess / this.cache.size).toFixed(2) : 0;
  }
}

/**
 * Dynamic Programming for OR Scheduling Optimization
 */
class ORScheduler {
  static optimizeSchedule(surgeries) {
    if (!surgeries || surgeries.length === 0) {
      return { maxRevenue: 0, schedule: [], utilizationRate: 0 };
    }

    // Sort by end time
    const sorted = [...surgeries].sort((a, b) => a.endTime - b.endTime);
    
    const n = sorted.length;
    const dp = new Array(n).fill(0);
    const schedules = new Array(n).fill(null);

    dp[0] = sorted[0].revenue || 0;
    schedules[0] = [sorted[0]];

    for (let i = 1; i < n; i++) {
      const latest = this.findLatestNonConflicting(sorted, i);
      const include = (sorted[i].revenue || 0) + (latest !== -1 ? dp[latest] : 0);
      const exclude = dp[i - 1];

      if (include > exclude) {
        dp[i] = include;
        schedules[i] = latest !== -1 
          ? [...schedules[latest], sorted[i]] 
          : [sorted[i]];
      } else {
        dp[i] = exclude;
        schedules[i] = schedules[i - 1];
      }
    }

    const optimalSchedule = schedules[n - 1];
    const totalTime = optimalSchedule.reduce((sum, s) => 
      sum + (s.endTime - s.startTime), 0
    );

    return {
      maxRevenue: dp[n - 1],
      schedule: optimalSchedule,
      totalSurgeries: optimalSchedule.length,
      totalTime,
      utilizationRate: ((totalTime / 24) * 100).toFixed(2)
    };
  }

  static findLatestNonConflicting(surgeries, index) {
    for (let i = index - 1; i >= 0; i--) {
      if (surgeries[i].endTime <= surgeries[index].startTime) {
        return i;
      }
    }
    return -1;
  }
}

// Global instances for caching
const patientCache = new FastLookupCache();
const drugCache = new FastLookupCache();
const erTriageQueue = new PriorityQueue();

module.exports = {
  BinarySearch,
  PriorityQueue,
  FastLookupCache,
  ORScheduler,
  // Global instances
  patientCache,
  drugCache,
  erTriageQueue
};
