import React, { useState, useEffect, createContext, useContext } from 'react';

// Mini E‑Commerce Frontend (Single-file React App)
// - Tailwind CSS utility classes assumed available
// - Default export is the App component
// - Fetches products from /api/products (fallback to mock data)
// - Cart persisted to localStorage

/*******************
 * Cart Context
 *******************/
const CartContext = createContext();
const useCart = () => useContext(CartContext);

function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mini_ecom_cart') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('mini_ecom_cart', JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1) => {
    setItems(prev => {
      const found = prev.find(p => p.id === product.id);
      if (found) return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + qty } : p);
      return [...prev, { ...product, qty }];
    });
  };

  const remove = id => setItems(prev => prev.filter(p => p.id !== id));
  const updateQty = (id, qty) => setItems(prev => prev.map(p => p.id === id ? { ...p, qty } : p));
  const clear = () => setItems([]);
  const total = items.reduce((s, p) => s + p.price * p.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

/*******************
 * Mock / Utils
 *******************/
const MOCK_PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', brand: 'Acme', price: 2499, category: 'Electronics', image: '', available: true },
  { id: 2, name: 'Running Shoes', brand: 'Stride', price: 3499, category: 'Footwear', image: '', available: true },
  { id: 3, name: 'Classic Watch', brand: 'Tempo', price: 4999, category: 'Accessories', image: '', available: false },
  // add more as needed
];

const formatCurrency = (n) => `₹${n.toFixed(2)}`;

/*******************
 * UI Components
 *******************/
function Header({ onOpenCart }) {
  const { items } = useCart();
  const qty = items.reduce((s, p) => s + p.qty, 0);
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-gray-800">MiniShop</div>
        <nav className="hidden md:flex gap-4 text-sm text-gray-600">
          <a className="hover:underline" href="#">Home</a>
          <a className="hover:underline" href="#">Shop</a>
          <a className="hover:underline" href="#">Contact</a>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <SearchBar />
        <button
          onClick={onOpenCart}
          className="relative px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          🛒
          {qty > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{qty}</span>
          )}
        </button>
      </div>
    </header>
  );
}

function SearchBar() {
  const [q, setQ] = useState('');
  // expose event so parent can hook if needed via custom event. Simpler to leave local.
  return (
    <input
      placeholder="Search products..."
      value={q}
      onChange={e => setQ(e.target.value)}
      className="border rounded-md px-3 py-1 text-sm w-48 md:w-64"
      onKeyDown={(e) => { if (e.key === 'Enter') window.dispatchEvent(new CustomEvent('mini_ecom_search', { detail: q })); }}
    />
  );
}

function ProductCard({ p, onAdd }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col">
      <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
        {p.image ? <img src={p.image} alt={p.name} className="h-full object-contain" /> : <div className="text-gray-400">No Image</div>}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-800">{p.name}</div>
        <div className="text-xs text-gray-500">{p.brand} • {p.category}</div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-lg font-bold">{formatCurrency(p.price)}</div>
        <button
          disabled={!p.available}
          onClick={() => onAdd(p)}
          className="px-3 py-1 rounded-lg bg-blue-600 text-white disabled:opacity-50"
        >Add</button>
      </div>
    </div>
  );
}

function ProductGrid({ products, onAdd }) {
  if (!products.length) return <div className="p-8 text-center text-gray-500">No products found</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} />)}
    </div>
  );
}

function CartDrawer({ open, onClose }) {
  const { items, remove, updateQty, total, clear } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="w-full md:w-96 bg-white shadow-xl p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Your Cart</div>
          <button onClick={onClose} className="text-gray-600">✕</button>
        </div>
        <div className="space-y-4">
          {items.length === 0 && <div className="text-gray-500">Cart is empty</div>}
          {items.map(i => (
            <div key={i.id} className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-50 rounded flex items-center justify-center text-xs">img</div>
              <div className="flex-1">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-gray-500">{formatCurrency(i.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(i.id, Math.max(1, i.qty - 1))} className="px-2">-</button>
                <div>{i.qty}</div>
                <button onClick={() => updateQty(i.id, i.qty + 1)} className="px-2">+</button>
              </div>
              <button onClick={() => remove(i.id)} className="ml-2 text-sm text-red-500">Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">Total</div>
            <div className="font-bold text-lg">{formatCurrency(total)}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => { /* Minimal checkout stub */ alert('Checkout flow - connect backend'); }} className="flex-1 py-2 rounded-lg bg-green-600 text-white">Checkout</button>
            <button onClick={clear} className="py-2 px-3 rounded-lg border">Clear</button>
          </div>
        </div>
      </div>
      <div onClick={onClose} className="flex-1 bg-black bg-opacity-30" />
    </div>
  );
}

/*******************
 * Main App
 *******************/
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCart, setOpenCart] = useState(false);
  const { add } = useCart() ?? {};

  useEffect(() => {
    let mounted = true;
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('bad');
        const data = await res.json();
        if (mounted) setProducts(data);
      } catch (e) {
        // fallback to mock data
        if (mounted) setProducts(MOCK_PRODUCTS);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProducts();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const q = e.detail.trim().toLowerCase();
      if (!q) return setProducts(prev => prev.length ? prev : MOCK_PRODUCTS);
      setProducts(prev => (prev || MOCK_PRODUCTS).filter(p => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)));
    };
    window.addEventListener('mini_ecom_search', handler);
    return () => window.removeEventListener('mini_ecom_search', handler);
  }, []);

  const handleAdd = (p) => {
    // If CartProvider not mounted above, use a quick local add that posts to localStorage
    try {
      const ctx = useCart(); // eslint-disable-line
      if (ctx?.add) ctx.add(p);
    } catch (e) {
      // fallback: store minimal cart
      const cart = JSON.parse(localStorage.getItem('mini_ecom_cart') || '[]');
      const found = cart.find(x => x.id === p.id);
      if (found) found.qty += 1; else cart.push({ ...p, qty: 1 });
      localStorage.setItem('mini_ecom_cart', JSON.stringify(cart));
    }
    setOpenCart(true);
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header onOpenCart={() => setOpenCart(true)} />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Shop</h1>
            <div className="text-sm text-gray-500">Free delivery on orders over ₹3,000</div>
          </div>

          <section>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl p-4 h-56" />
                ))}
              </div>
            ) : (
              <ProductGrid products={products} onAdd={(p) => { const ctx = { add }; if (ctx.add) ctx.add(p); setOpenCart(true); }} />
            )}
          </section>
        </main>

        <CartDrawer open={openCart} onClose={() => setOpenCart(false)} />

        <footer className="text-center py-6 text-sm text-gray-500">© MiniShop — built with React & Tailwind</footer>
      </div>
    </CartProvider>
  );
}
