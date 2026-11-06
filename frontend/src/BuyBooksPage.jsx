import React, { useState } from 'react';
import { 
  ShoppingBag, Star, Sparkles, Check, Truck, ShieldCheck, 
  ArrowRight, X, Eye, Phone, User, Trash2
} from 'lucide-react';

const STORE_CATALOG = [
  {
    id: 101,
    title: "The Secret History",
    author: "Donna Tartt",
    genre: "Dark Academia",
    price: 18.50,
    original_price: 26.00,
    rating: 4.9,
    reviews: 342,
    format: "Clothbound Hardcover",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80",
    description: "Under the influence of their charismatic classics professor, eccentric students explore a dangerous way of thinking.",
    inStock: 4
  },
  {
    id: 102,
    title: "Dune: Collector's Edition",
    author: "Frank Herbert",
    genre: "Sci-Fi & Fantasy",
    price: 32.00,
    original_price: 45.00,
    rating: 5.0,
    reviews: 512,
    format: "Foil-Stamped Hardcover",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    description: "Set on the desert planet Arrakis, Dune is the story of Paul Atreides and the spice melange.",
    inStock: 2
  },
  {
    id: 103,
    title: "Meditations: Emperor's Edition",
    author: "Marcus Aurelius",
    genre: "Philosophy",
    price: 15.00,
    original_price: 22.00,
    rating: 4.8,
    reviews: 620,
    format: "Gilded Leatherbound",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80",
    description: "Private stoic reflections by the Roman Emperor on discipline, mortality, and tranquility.",
    inStock: 8
  }
];

export default function BuyBooksPage({ communityBooks = [], currentUserId, onAddToCart, onDeleteBook }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [addedId, setAddedId] = useState(null);

  const handleAdd = (book) => {
    onAddToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price || book.selling_price,
      cover: book.cover || null,
      seller_name: book.seller_name || 'BookLoop Store',
    });
    setAddedId(book.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const availableCommunityBooks = communityBooks.map((b) => ({
    ...b,
    price: b.selling_price,
    isCommunity: true,
  }));

  const allDisplayBooks = [
    ...(activeFilter !== 'Community' ? STORE_CATALOG : []),
    ...(activeFilter !== 'Store' ? availableCommunityBooks : []),
  ];

  return (
    <div className="w-full">
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-6">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-[#221B18] via-[#1B1513] to-[#120F0E] border border-amber-900/40 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase mb-4">
              <Sparkles size={14} />
              <span>Reader Marketplace • Buy Curated & Pre-Loved</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-serif text-amber-50 leading-tight">
              Buy books from fellow readers & the <span className="text-amber-400">sanctuary</span>.
            </h1>
            <p className="mt-3 text-stone-300 text-sm leading-relaxed">
              Every book listed by community members appears right here for you to claim, purchase, and read.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-8 flex items-center gap-2">
          {['All Books', 'Community Pre-Loved', 'Curated Store Exclusives'].map((tab) => {
            const key = tab === 'Community Pre-Loved' ? 'Community' : tab === 'Curated Store Exclusives' ? 'Store' : 'All';
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(key)}
                className={`text-xs px-4 py-2 rounded-full font-bold transition cursor-pointer ${
                  activeFilter === key
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-stone-900/80 text-stone-400 border border-stone-800 hover:text-stone-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </section>

      {/* Book Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allDisplayBooks.map((book) => {
            // Check if THIS book was created by the currently logged in user
            const isMine = book.isCommunity && Number(book.user_id) === Number(currentUserId);

            return (
              <div
                key={book.id}
                className="group relative bg-[#1E1816]/90 rounded-3xl border border-amber-900/30 p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl transition hover:-translate-y-1.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      book.isCommunity 
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' 
                        : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                    }`}>
                      {book.isCommunity ? `Pre-Loved • ${book.condition}` : 'Store Exclusive'}
                    </span>

                    {isMine && (
                      <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                        Your Listing
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold font-serif text-amber-50 leading-snug line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs font-serif italic text-stone-400 mb-3">by {book.author}</p>

                  {book.description && (
                    <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed mb-4 bg-stone-900/60 p-3 rounded-xl border border-stone-800 italic">
                      "{book.description}"
                    </p>
                  )}

                  {book.isCommunity && (
                    <div className="mb-4 text-xs space-y-1 text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-amber-500" />
                        <span>Seller: <strong className="text-stone-200">{book.seller_name}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <Phone size={12} />
                        <span>Contact: {book.seller_phone}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-amber-400 font-mono">${book.price.toFixed(2)}</span>
                    {book.original_price > book.price && (
                      <span className="text-xs text-stone-500 line-through font-mono">${book.original_price.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Card Action: If it's my book, I can DELETE IT right here! */}
                <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    {book.isCommunity ? 'Ships from reader' : 'Ready to dispatch'}
                  </span>

                  {isMine ? (
                    <button
                      onClick={() => onDeleteBook(book.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 font-bold text-xs transition cursor-pointer shadow-md"
                      title="Permanently remove your listing from the marketplace"
                    >
                      <Trash2 size={14} />
                      <span>Delete My Listing</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdd(book)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-md ${
                        addedId === book.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                      }`}
                    >
                      {addedId === book.id ? (
                        <>
                          <Check size={14} />
                          <span>In Satchel!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} />
                          <span>Add to Satchel</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}