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
    selected: false
  })),
  customOrder: null,
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
  
  let baseItems;
  if (useCustomOrder === 'true' && data.customOrder) {
    baseItems = data.customOrder
      .map(id => data.items.find(item => item.id === id))
      .filter(Boolean);
    
    const customOrderIds = new Set(data.customOrder);
    const remainingItems = data.items.filter(item => !customOrderIds.has(item.id));
    baseItems = [...baseItems, ...remainingItems];
  } else {
    baseItems = [...data.items];
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
  const { selectedIds } = req.body;
  
  data.selectedItems.clear();
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
  const { orderedIds, isPartialUpdate = false } = req.body;
  
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order data' });
  }
  
  if (isPartialUpdate && data.customOrder) {
    const orderedIdsSet = new Set(orderedIds);
    
    const filteredOrder = data.customOrder.filter(id => !orderedIdsSet.has(id));
    
    const firstOrderedId = orderedIds[0];
    const insertPosition = Math.max(0, data.customOrder.indexOf(firstOrderedId));
    
    const beforeInsert = filteredOrder.slice(0, insertPosition);
    const afterInsert = filteredOrder.slice(insertPosition);
    data.customOrder = [...beforeInsert, ...orderedIds, ...afterInsert];
  } else {
    data.customOrder = [...orderedIds];
    
    const customOrderIds = new Set(orderedIds);
    const remainingIds = data.items
      .filter(item => !customOrderIds.has(item.id))
      .map(item => item.id);
    
    if (remainingIds.length > 0) {
      data.customOrder.push(...remainingIds);
    }
  }
  
  res.json({ 
    success: true, 
    message: 'Order updated successfully',
  });
});

app.get('/api/items/order', (req, res) => {
  res.json({ 
    customOrder: data.customOrder,
  });
});

app.delete('/api/items/order', (req, res) => {
  data.customOrder = null;
  res.json({ success: true, message: 'Custom order reset' });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalItems: data.items.length,
    selectedItems: data.selectedItems.size,
    hasCustomOrder: data.customOrder !== null,
    customOrderLength: data.customOrder ? data.customOrder.length : 0
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;