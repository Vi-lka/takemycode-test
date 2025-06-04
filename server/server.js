const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


let data = {
  items: Array.from({ length: 1000000 }, (_, i) => ({
    id: i + 1,
    value: `Item ${i + 1}`,
    selected: false,
    index: i
  })),
  selectedItems: new Set()
};

app.get('/api/items', (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    useCustomOrder = false 
  } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  let filteredItems;
  
  let baseItems = [...data.items];
  if (useCustomOrder === 'true') {
    baseItems.sort((a, b) => a.index - b.index);
  }
  
  if (search) {
    filteredItems = baseItems.filter(item => 
      item.value.toLowerCase().includes(search.toLowerCase())
    );
  } else {
    filteredItems = baseItems;
  }
  
  filteredItems.forEach(item => {
    item.selected = data.selectedItems.has(item.id);
  });
  
  const paginatedItems = filteredItems.slice(offset, offset + limitNum);
  const totalPages = Math.ceil(filteredItems.length / limitNum);
  
  res.json({
    items: paginatedItems,
    totalItems: filteredItems.length,
    totalPages,
    currentPage: pageNum,
    hasMore: pageNum < totalPages
  });
});

app.post('/api/items/selection', (req, res) => {
  const { selectedIds, unSelectedIds } = req.body;

  unSelectedIds.forEach(id =>data.selectedItems.delete(id));
  selectedIds.forEach(id => data.selectedItems.add(id));
  
  res.json({ success: true, selectedCount: data.selectedItems.size });
});

app.get('/api/items/selected', (req, res) => {
  const selectedItems = data.items
    .filter(item => data.selectedItems.has(item.id))
    .map(item => ({ ...item, selected: true }));
    
  res.json({ selectedItems, count: selectedItems.length });
});

app.post('/api/items/order', (req, res) => {
  const { orderedItems } = req.body;
  
  if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order data' });
  }

  const invalidItems = orderedItems.filter(item => !item.id || typeof item.index !== 'number');
  if (invalidItems.length > 0) {
    return res.status(400).json({ success: false, message: 'Invalid item format: id and index required' });
  }
  
  const notFoundIds = [];
  orderedItems.forEach((orderedItem) => {
    const item = data.items.find(item => item.id === orderedItem.id);
    if (item) {
      item.index = orderedItem.index;
    } else {
      notFoundIds.push(orderedItem.id);
    }
  });

  if (notFoundIds.length > 0) {
    return res.status(400).json({ success: false, message: `Items not found: ${notFoundIds.join(', ')}` });
  }

  res.json({ 
    success: true, 
    message: 'Order updated successfully'
  });
});

app.delete('/api/items/order', (req, res) => {
  data.items.forEach(item => {
    item.index = item.id - 1;
  });
  
  res.json({ success: true, message: 'Custom order reset' });
});

app.get('/api/stats', (req, res) => {
const reorderedItems = data.items
    .filter(item => item.index !== item.id - 1)
    .map(item => ({ id: item.id, value: item.value, index: item.index }));

  res.json({
    totalItems: data.items.length,
    selectedItems: data.selectedItems,
    reorderedItems: reorderedItems,
    reorderedCount: reorderedItems.length
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;