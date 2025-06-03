const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const ITEMS_PER_PAGE = 20;

export const fetchItems = async ({ page = 1, limit = ITEMS_PER_PAGE, search = '', useCustomOrder = true }) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    useCustomOrder: useCustomOrder.toString()
  });
  
  const response = await fetch(`${API_BASE}/items?${params}`);
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
};

export const fetchStats = async () => {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export const updateSelection = async (selectedIds: string[]) => {
  const response = await fetch(`${API_BASE}/items/selection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedIds })
  });
  if (!response.ok) throw new Error('Failed to update selection');
  return response.json();
};

export const updateOrder = async ({ orderedIds = [], isPartialUpdate = false }) => {
  const response = await fetch(`${API_BASE}/items/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds, isPartialUpdate })
  });
  if (!response.ok) throw new Error('Failed to update order');
  return response.json();
};

export const resetOrder = async () => {
  const response = await fetch(`${API_BASE}/items/order`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to reset order');
  return response.json();
};