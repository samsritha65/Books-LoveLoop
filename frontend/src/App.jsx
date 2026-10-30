import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Phone, User, Tag, Sparkles, X } from 'lucide-react';

const API_URL = 'http://localhost:8001/api/books';

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state matching your SQLite database columns
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

  // 1. Fetch all books from backend
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

  useEffect(() => {
    fetchBooks();
  }, []);

  // 2. Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Submit a new book (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          original_price: parseFloat(formData.original_price) || 0,
          selling_price: parseFloat(formData.selling_price),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          author: '',
          original_price: '',
          selling_price: '',
          condition: 'Like New',
          description: '',
          seller_name: '',
          seller_phone: '',
        });
        fetchBooks(); // Refresh book list
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to list book');
      }
    } catch (err) {
      console.error('Error adding book:', err);
    }
  };

  // 4. Delete a book (DELETE)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure this book is sold or you want to delete it?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Optimistic UI update: remove from state immediately
        setBooks(books.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans selection:bg-amber-200">
      {/* --- Top Navbar --- */}
      <header className="sticky top-0 z-30 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2.5 rounded-2xl shadow-sm">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 block leading-tight">
                Books<span className="text-amber-600">Loop</span>
              </span>
              <span className="text-xs text-stone-500 font-medium tracking-wide uppercase">
                Read • Pass • Loop
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-full font-medium shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
          >
            <Plus size={18} />
            <span>List a Book</span>
          </button>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
          Give pre-loved books a <span className="text-amber-600 underline decoration-amber-300">second life</span>.
        </h1>
        <p className="mt-3 text-lg text-stone-600 max-w-2xl">
          Buy and sell gently used books locally. Save money, reduce waste, and find your next favorite story.
        </p>
      </section>

      {/* --- Book Grid --- */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-20 text-stone-400">Loading your bookshelf...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 bg-stone-100 rounded-3xl border border-dashed border-stone-300 p-8">
            <Sparkles className="mx-auto text-amber-500 mb-3" size={36} />
            <p className="text-lg font-semibold text-stone-700">No books listed yet</p>
            <p className="text-sm text-stone-500 mt-1">Be the first to list a pre-loved book in the loop!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const discount = book.original_price > book.selling_price
                ? Math.round(((book.original_price - book.selling_price) / book.original_price) * 100)
                : 0;

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-stone-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <div>
                    {/* Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full">
                        {book.condition}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Book Info */}
                    <h3 className="text-xl font-bold text-stone-900 leading-snug line-clamp-1">{book.title}</h3>
                    <p className="text-sm font-medium text-stone-500 mb-3">by {book.author}</p>

                    {book.description && (
                      <p className="text-sm text-stone-600 line-clamp-2 mb-4 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        "{book.description}"
                      </p>
                    )}

                    {/* Price Section */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black text-stone-900">${book.selling_price}</span>
                      {book.original_price > 0 && (
                        <span className="text-sm text-stone-400 line-through">
                          ${book.original_price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seller & Action Footer */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-stone-700">
                        <User size={13} className="text-stone-400" />
                        <span>{book.seller_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-amber-600">
                        <Phone size={13} />
                        <span>{book.seller_phone}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(book.id)}
                      title="Delete / Mark as Sold"
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- Add Book Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-stone-900 mb-1">List a Book</h2>
            <p className="text-xs text-stone-500 mb-6">Enter book and contact details to list it immediately.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Title *</label>
                <input
                  required
                  type="text"
                  name="title"
                  placeholder="e.g. Sapiens"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Author *</label>
                <input
                  required
                  type="text"
                  name="author"
                  placeholder="e.g. Yuval Noah Harari"
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Original Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="original_price"
                    placeholder="25.00"
                    value={formData.original_price}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Selling Price ($) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="selling_price"
                    placeholder="10.00"
                    value={formData.selling_price}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option>Brand New</option>
                  <option>Like New</option>
                  <option>Good</option>
                  <option>Fair / Acceptable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Notes / Description</label>
                <textarea
                  rows="2"
                  name="description"
                  placeholder="Has slight highlight on chapter 2, paperback..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Your Name *</label>
                  <input
                    required
                    type="text"
                    name="seller_name"
                    placeholder="Sarah"
                    value={formData.seller_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Phone / WhatsApp *</label>
                  <input
                    required
                    type="text"
                    name="seller_phone"
                    placeholder="+1 555-0199"
                    value={formData.seller_phone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition duration-150 cursor-pointer shadow-sm text-sm"
              >
                Publish Book Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}