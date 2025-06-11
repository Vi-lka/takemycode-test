const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

const app = express();
const PORT = 3001;

// API key middleware
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY || 'your-secret-api-key';

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or missing API key' 
    });
  }
  next();
};

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(requireApiKey);

function formatMemoryUsage(memoryUsage) {
  const units = ['B', 'KB', 'MB', 'GB'];
  
  function formatBytes(bytes) {
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }
  
  return {
    RSS: formatBytes(memoryUsage.rss),
    HeapTotal: formatBytes(memoryUsage.heapTotal),
    HeapUsed: formatBytes(memoryUsage.heapUsed),
    External: formatBytes(memoryUsage.external),
    ArrayBuffers: formatBytes(memoryUsage.arrayBuffers)
  };
}

class DataStore {
  constructor() {
    this.items = [];
    this.selectedItems = new Set();
    
    this.initializeData();
  }
  
  initializeData() {
    console.log('Initializing data store...');
    const startTime = Date.now();
    
    for (let i = 0; i < 1000000; i++) {
      const item = {
        id: i + 1,
        value: `Item ${i + 1}`,
        selected: false,
        defaultIndex: i,
        reorderedIndex: null
      };
      
      this.items.push(item);
    }
    
    console.log(`Data initialization completed in ${Date.now() - startTime}ms`);
  }


  getSelectedItems() {
    const selectedItemsIds = [...this.selectedItems];
    const selectedItems = this.items.filter(item => selectedItemsIds.includes(item.id));
    return selectedItems;
  }

  getReorderedItems() {
    const reorderedItems = this.items.filter(item => item.reorderedIndex !== null);
    return reorderedItems;
  }
  
  updateSelection(selectedIds, unSelectedIds) {
    unSelectedIds.forEach(id => this.selectedItems.delete(id));
    selectedIds.forEach(id => this.selectedItems.add(id));

    this.items.forEach(item => {
      item.selected = this.selectedItems.has(item.id);
    });
  }
  
  searchItems(searchTerm) {
    if (!searchTerm) return this.items;
    
    const lowerSearch = searchTerm.toLowerCase();
    
    return this.items.filter(item => 
      item.value.toLowerCase().includes(lowerSearch)
    );
  }

  reorderItems({ fromIndex, toIndex }) {
    if (fromIndex < 0 || fromIndex >= this.items.length) {
      throw new Error(`Invalid from index: ${fromIndex}`);
    }
    if (toIndex < 0 || toIndex >= this.items.length) {
      throw new Error(`Invalid target index: ${toIndex}`);
    }

    const movedItem = this.items[fromIndex];
    const targetItem = this.items[toIndex];

    const movedItemNewIndex = targetItem.reorderedIndex ?? targetItem.defaultIndex;;

    const isMovingUp = fromIndex > toIndex;
    const startIdx = Math.min(fromIndex, toIndex);
    const endIdx = Math.max(fromIndex, toIndex);

    const moves = []; // { itemId: number; toIndex: number }[]

    // Perform the move in the array
    const [moved] = this.items.splice(fromIndex, 1);
    this.items.splice(toIndex, 0, moved);

    // Update indices for affected items based on their index
    for (let i = startIdx; i <= endIdx; i++) {
      const item = this.items[i];
    
      const itemId = item.id;
      let toIndex
    
      if (itemId === movedItem.id) {
        // moved item gets the target item's original index
        toIndex = movedItemNewIndex;
      } else if (isMovingUp) {
        // shift down
        toIndex = (item.reorderedIndex ?? item.defaultIndex) + 1;
      } else {
        // shift up
        toIndex = (item.reorderedIndex ?? item.defaultIndex) - 1;
      }
    
      moves.push({
        itemId,
        toIndex,
      });
    }

    moves.forEach(move => {
      const item = this.items[move.toIndex];
      if (item) item.reorderedIndex = move.toIndex;
    });
  }

  resetOrder() {
    this.items.sort((a, b) => a.defaultIndex - b.defaultIndex)
    .forEach(item => {
      item.reorderedIndex = null
    })
  }
  
  getPaginatedItems(page, limit, searchTerm = '') {
    const startTime = Date.now();
    
    let filteredItems;
    if (searchTerm) {
      filteredItems = this.searchItems(searchTerm);
    } else {
      filteredItems = this.items;
    }
    
    const offset = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    const totalPages = Math.ceil(filteredItems.length / limit);
    
    console.log(`Query completed in ${Date.now() - startTime}ms`);
    
    return {
      items: paginatedItems,
      totalItems: filteredItems.length,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages
    };
  }
  
  getStats() {
    const memoryUsage = process.memoryUsage();
    const formattedUsage = formatMemoryUsage(memoryUsage);
    return {
      totalItems: this.items.length,
      selectedItems: this.getSelectedItems(),
      reorderedItems: this.getReorderedItems(),
      memoryUsage: formattedUsage
    };
  }
}

const dataStore = new DataStore();

app.get('/api/items', (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const result = dataStore.getPaginatedItems(pageNum, limitNum, search);
    res.json(result);
    
  } catch (error) {
    console.error('Error in /api/items:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.patch('/api/items/selection', (req, res) => {
  try {
    const { selectedIds = [], unSelectedIds = [] } = req.body;
    
    if (!Array.isArray(selectedIds) || !Array.isArray(unSelectedIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'selectedIds and unSelectedIds must be arrays' 
      });
    }
    
    dataStore.updateSelection(selectedIds, unSelectedIds);
    
    res.json({ 
      success: true, 
      selectedCount: dataStore.selectedItems.size 
    });
    
  } catch (error) {
    console.error('Error in /api/items/selection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.patch('/api/items/order', (req, res) => {
  try {
    const { fromIndex, toIndex } = req.body;
    
    if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Each move must have fromIndex and toIndex as numbers' 
      });
    }
    
    dataStore.reorderItems({ fromIndex, toIndex });
    
    res.json({
      success: true,
      message: 'Order updated successfully',
    });
    
  } catch (error) {
    console.error('Error in /api/items/order:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.patch('/api/items/order/reset', (req, res) => {
  try {
    dataStore.resetOrder();
    res.json({ success: true, message: 'Custom order reset' });
    
  } catch (error) {
    console.error('Error in /api/items/order/reset:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = dataStore.getStats();
    res.json(stats);
    
  } catch (error) {
    console.error('Error in /api/stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const formattedUsage = formatMemoryUsage(memoryUsage);

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: formattedUsage
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Memory usage: ${JSON.stringify(formatMemoryUsage(process.memoryUsage()), null, 2)}`);
});

module.exports = app;