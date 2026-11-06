import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Trash2, Pencil, Phone, User, Sparkles, X, 
  LogOut, ChevronDown, ShieldAlert, ShoppingBag, CheckCircle2, ArrowRight 
} from 'lucide-react';
import LoginPage from './LoginPage';
import BuyBooksPage from './BuyBooksPage';

const API_URL = 'http://localhost:8001/api/books';
const LIBRARY_BG = "https://images.unsplash.com/photo-1507842229451-79b1be886a20?auto=format&fit=crop&w=2400&q=85";

export default function App() {
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);

  // Current logged in user from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('bookloop_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    original_price: '',
    selling_price: '',
    condition: 'Like New',
    description: '',
    seller_name: '',
    seller_phone: '',
  });

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('bookloop_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    localStorage.removeItem('bookloop_user');
    setCurrentUser(null);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ Permanently delete your library card and account?')) return;
    try {
      const res = await fetch(`http://localhost:8001/api/users/${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Account deleted.');
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all books from SQLite
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch books on mount AND whenever user switches tabs
  useEffect(() => {
    if (currentUser) {
      fetchBooks();
    }
  }, [currentUser, activeTab]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCreateModal = () => {
    setEditingBookId(null);
    setFormData({
      title: '',
      author: '',
      original_price: '',
      selling_price: '',
      condition: 'Like New',
      description: '',
      seller_name: currentUser?.name || '',
      seller_phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBookId(book.id);
    setFormData({
      title: book.title,
      author: book.author,
      original_price: book.original_price || '',
      selling_price: book.selling_price || '',
      condition: book.condition || 'Like New',
      description: book.description || '',
      seller_name: book.seller_name || currentUser?.name || '',
      seller_phone: book.seller_phone || '',
    });
    setIsModalOpen(true);
  };

  // Submit book listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isEditing = Boolean(editingBookId);
    const url = isEditing ? `${API_URL}/${editingBookId}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    const parsedPrice = parseFloat(formData.selling_price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid selling price greater than 0.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      user_id: currentUser?.id,
      title: formData.title.trim(),
      author: formData.author.trim(),
      original_price: parseFloat(formData.original_price) || 0,
      selling_price: parsedPrice,
      condition: formData.condition || 'Good',
      description: formData.description || '',
      seller_name: formData.seller_name || currentUser?.name || 'Anonymous',
      seller_phone: formData.seller_phone.trim(),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        setEditingBookId(null);
        await fetchBooks();
        alert(isEditing ? 'Book updated!' : 'Book published to the marketplace!');
      } else {
        alert(`Server error: ${data.error || 'Failed to save book'}`);
      }
    } catch (err) {
      alert('Could not reach backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PERMANENT DELETE (Updates SQLite + Syncs UI)
  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book listing? It will be permanently erased from the marketplace and database.')) return;

    try {
      console.log('Sending DELETE request for book ID:', id);

      const res = await fetch(`http://localhost:8001/api/books/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Immediately remove from local state
        setBooks((prev) => prev.filter((b) => Number(b.id) !== Number(id)));
        setCart((prev) => prev.filter((item) => Number(item.id) !== Number(id)));

        // 2. Fetch fresh data from SQLite
        await fetchBooks();
        alert('Book permanently deleted from the marketplace!');
      } else {
        alert(`Server Error: ${data.error || 'Failed to delete book'}`);
      }
    } catch (err) {
      console.error('Network Error during delete:', err);
      alert('Network Error: Could not connect to backend server at http://localhost:8001.');
    }
  };

  // Cart Handlers
  const handleAddToCart = (book) => setCart((prev) => [...prev, book]);
  const handleRemoveFromCart = (idx) => setCart((prev) => prev.filter((_, i) => i !== idx));
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          customer_name: currentUser.name,
          customer_email: currentUser.email,
          shipping_address: shippingAddress,
          total_amount: cartTotal,
          items: cart,
        }),
      });

      if (res.ok) {
        setOrderComplete(true);
        setCart([]);
        setTimeout(() => {
          setIsCheckoutOpen(false);
          setOrderComplete(false);
          setIsCartOpen(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SELL TAB: ONLY show books that belong to THIS logged-in user!
  const myBooks = books.filter(
    (b) => b.user_id && Number(b.user_id) === Number(currentUser?.id)
  );

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleAuthSuccess} />;
  }

  return (
    <div 
      className="min-h-screen bg-[#110E0D] text-stone-100 font-sans relative bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `url(${LIBRARY_BG})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-[#0F0D0C] backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navbar */}
        <header className="sticky top-0 z-30 bg-[#1A1614]/85 backdrop-blur-md border-b border-amber-900/30 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-2.5 rounded-2xl shadow-md border border-amber-400/30">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-2xl font-black font-serif text-amber-50 leading-tight">
                  Books<span className="text-amber-400">Loop</span>
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono tracking-widest uppercase font-semibold">
                  The Reader's Sanctuary
                </span>
              </div>
            </div>

            {/* PAGE SELECTOR TABS */}
            <div className="flex items-center bg-stone-900/90 p-1 rounded-full border border-stone-800">
              <button
                onClick={() => setActiveTab('buy')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'buy' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <ShoppingBag size={14} />
                <span>Buy Books (Marketplace)</span>
              </button>

              <button
                onClick={() => setActiveTab('sell')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'sell' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen size={14} />
                <span>Sell Books (My Listings: {myBooks.length})</span>
              </button>
            </div>

            {/* Profile & Cart */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full bg-stone-900 border border-amber-500/30 text-amber-300 transition cursor-pointer"
              >
                <ShoppingBag size={18} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Profile Pill */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-stone-900 border border-amber-500/40 text-amber-200 text-xs font-semibold cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{currentUser.name}</span>
                  <ChevronDown size={14} className={`transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                )}

                {/* PROFILE DROPDOWN (USER ID REMOVED) */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#231D1B] rounded-2xl shadow-2xl border border-amber-900/40 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-stone-800">
                      <p className="text-xs font-bold text-amber-100">{currentUser.name}</p>
                      <p className="text-[11px] text-stone-400">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs text-stone-300 hover:bg-stone-800 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldAlert size={15} />
                      <span>Delete Account</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-full font-bold text-xs cursor-pointer shadow-md"
              >
                <Plus size={16} />
                <span>List a Book</span>
              </button>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC VIEWS --- */}
        {activeTab === 'buy' ? (
          <BuyBooksPage
            communityBooks={books}
            currentUserId={currentUser.id}
            onAddToCart={handleAddToCart}
            onDeleteBook={handleDeleteBook}  
          />
        ) : (
          <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black font-serif text-amber-50">
                  My Seller Studio
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                  Books you personally put up for sale. These appear in the Buy section for other readers!
                </p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition cursor-pointer flex items-center gap-2"
              >
                <Plus size={16} />
                <span>List Another Book</span>
              </button>
            </div>

            {myBooks.length === 0 ? (
              <div className="text-center py-24 bg-[#1F1A18]/60 rounded-3xl border border-dashed border-amber-900/40 p-8">
                <Sparkles size={40} className="mx-auto text-amber-400 mb-3" />
                <h3 className="text-xl font-bold font-serif text-stone-200">You haven't listed any books yet</h3>
                <p className="text-xs text-stone-400 mt-1 mb-5">
                  Click "List a Book" to sell your first volume to other readers.
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  List My First Book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-gradient-to-br from-[#2D2522] via-[#241E1C] to-[#1A1514] rounded-2xl border-l-4 border-amber-500 border border-amber-900/40 p-6 flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md">
                          {book.condition}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          YOUR LISTING
                        </span>
                      </div>

                      <h3 className="text-xl font-bold font-serif text-amber-50 leading-snug line-clamp-1">{book.title}</h3>
                      <p className="text-xs font-serif italic text-amber-200/60 mb-3">by {book.author}</p>

                      {book.description && (
                        <p className="text-xs text-stone-300 line-clamp-2 mb-4 bg-[#171312]/70 p-3 rounded-xl italic">
                          "{book.description}"
                        </p>
                      )}

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-black text-amber-400 font-mono">${book.selling_price}</span>
                        {book.original_price > 0 && (
                          <span className="text-xs text-stone-500 line-through font-mono">${book.original_price}</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-xs">
                      <span className="text-stone-400">Owner: You</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(book)}
                          className="p-2 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded-lg cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#1E1917] border-l border-amber-900/40 p-6 flex flex-col justify-between shadow-2xl relative z-10 text-stone-200">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={20} className="text-amber-400" />
                    <h2 className="text-lg font-bold font-serif text-amber-50">Reader's Satchel</h2>
                  </div>
                  <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 text-stone-500 text-xs">
                      Your satchel is empty. Explore the marketplace to acquire books!
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <div key={index} className="flex gap-4 bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold font-serif text-amber-50">{item.title}</h4>
                          <p className="text-xs text-stone-400 italic">by {item.author}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-mono font-bold text-amber-400">${item.price.toFixed(2)}</span>
                            <button onClick={() => handleRemoveFromCart(index)} className="text-[11px] text-red-400 hover:underline cursor-pointer">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {cart.length > 0 && (
                <div className="pt-6 border-t border-stone-800 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-400 uppercase">Subtotal:</span>
                    <span className="text-2xl font-black font-mono text-amber-400">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 py-3.5 rounded-xl font-bold text-sm cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#241E1C] rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-amber-900/40 relative text-stone-200">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 text-stone-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            {orderComplete ? (
              <div className="text-center py-10">
                <CheckCircle2 size={54} className="text-emerald-400 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold font-serif text-amber-100">Order Placed Successfully!</h2>
                <p className="text-xs text-stone-400 mt-2">Your books are being packaged and dispatched.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold font-serif text-amber-100 mb-1">Confirm Purchase</h2>
                <p className="text-xs text-stone-400 mb-6">Enter where your books should be shipped.</p>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Buyer</label>
                    <input disabled value={`${currentUser.name} (${currentUser.email})`} className="w-full px-4 py-2.5 rounded-xl bg-stone-900/50 border border-stone-800 text-stone-400 text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Shipping Address *</label>
                    <textarea
                      required
                      rows="3"
                      placeholder="e.g. 123 Elm Street, City, State..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="p-4 bg-stone-900/80 rounded-xl border border-stone-800 flex justify-between items-center text-xs">
                    <span>Total:</span>
                    <span className="text-lg font-black font-mono text-amber-400">${cartTotal.toFixed(2)}</span>
                  </div>

                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3.5 rounded-xl cursor-pointer text-sm">
                    Place Order (${cartTotal.toFixed(2)})
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Book */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#241E1C] rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-amber-900/40 relative max-h-[90vh] overflow-y-auto text-stone-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-stone-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold font-serif text-amber-100 mb-1">
              {editingBookId ? 'Edit Book Listing' : 'List a Book to Sell'}
            </h2>
            <p className="text-xs text-stone-400 mb-6">
              This will be stamped with your account and visible to other readers in the Buy section.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Title *</label>
                <input required type="text" name="title" placeholder="e.g. Sapiens" value={formData.title} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Author *</label>
                <input required type="text" name="author" placeholder="e.g. Yuval Noah Harari" value={formData.author} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Original Price ($)</label>
                  <input type="number" step="0.01" name="original_price" placeholder="25.00" value={formData.original_price} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Selling Price ($) *</label>
                  <input required type="number" step="0.01" name="selling_price" placeholder="10.00" value={formData.selling_price} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Condition</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500">
                  <option>Brand New</option>
                  <option>Like New</option>
                  <option>Good</option>
                  <option>Fair / Acceptable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Notes / Description</label>
                <textarea rows="2" name="description" placeholder="Paperback, no highlights..." value={formData.description} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Seller Name</label>
                  <input required type="text" name="seller_name" value={formData.seller_name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-amber-300/80 mb-1">Phone / WhatsApp *</label>
                  <input required type="text" name="seller_phone" placeholder="+1 555-0199" value={formData.seller_phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3.5 rounded-xl cursor-pointer text-sm"
              >
                {isSubmitting ? 'Publishing...' : editingBookId ? 'Save Changes' : 'List Book for Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}