class PriorityQueue {
    constructor() {
      this.items = [];
    }
  
    enqueue(page, priority) {
      const newItem = { page, priority };
      this.items.push(newItem);
      this.items.sort((a, b) => a.priority - b.priority); // Sort by priority
    }
  
    dequeue() {
      return this.items.shift(); // Remove and return the item with the highest priority (lowest value)
    }
  
    peek() {
      return this.items[0]; // Return the item with the highest priority without removing it
    }
  
    isEmpty() {
      return this.items.length === 0;
    }
  
    clear() {
      this.items = [];
    }
  }
  
  
  
  class BookReader {
    constructor(totalPages) {
      this.fetchQueue = new PriorityQueue();
      this.windowSize = 2; // Initial window size
      this.totalPages = totalPages; // Total number of pages in the book
      this.fetchedPages = new Set(); // Set to track fetched pages
    }
  
    updateFetchQueue(currentPage) {
      const startPage = Math.max(0, currentPage - this.windowSize);
      const endPage = Math.min(this.totalPages - 1, currentPage + this.windowSize);
  
      // Enqueue pages within the sliding window
      for (let i = startPage; i <= endPage; i++) {
        if (!this.fetchedPages.has(i)) {
          this.fetchQueue.enqueue(i, Math.abs(currentPage - i)); // Priority based on distance from current page
        }
      }
  
      // Remove pages outside the sliding window
      this.fetchQueue.items = this.fetchQueue.items.filter(item => {
        const withinWindow = item.page >= startPage && item.page <= endPage;
        if (withinWindow) {
          this.fetchedPages.add(item.page);
        }
        return withinWindow;
      });
  
      // Expand the window if certain conditions are met
      if (this.shouldExpandWindow(startPage, endPage)) {
        this.windowSize = Math.min(this.windowSize + 1, Math.floor(this.totalPages / 2)); // Limit window size to half the total pages
      }
    }
  
    shouldExpandWindow(startPage, endPage) {
      // Check if all pages in the window are fetched
      for (let i = startPage; i <= endPage; i++) {
        if (!this.fetchedPages.has(i)) {
          return false;
        }
      }
      return true;
    }
  
    isBookFetched() {
      return this.fetchedPages.size === this.totalPages;
    }
  }