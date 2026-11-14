import React, { useState, useEffect } from 'react';
import { BookOpen, Mail, Lock, User, ArrowRight, Sparkles, Feather, Heart, CheckCircle2, AlertCircle } from 'lucide-react';

const LITERARY_QUOTES = [
  { quote: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
  { quote: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { quote: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
];

export default function LoginPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Quote rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LITERARY_QUOTES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Validation rules
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordLongEnough = password.length >= 8;
  const hasPasswordNumber = /\d/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Pre-flight frontend checks
    if (!isEmailValid) {
      setErrorMsg('Please enter a valid email format (e.g., reader@bookloop.org).');
      return;
    }

    if (isSignUp && (!isPasswordLongEnough || !hasPasswordNumber)) {
      setErrorMsg('Password must be at least 8 characters and contain at least one number.');
      return;
    }

    setLoading(true);
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
    const payload = isSignUp ? { name, email, password } : { email, password };

    try {
       const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
       const response = await fetch (`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });


      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Request failed. Please check your details.');
      } else {
        if (isSignUp) {
          setSuccessMsg(`Library card issued for ${data.user.name}! Entering the bookshelf...`);
        }
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Cannot reach backend server. Make sure "node server.js" is running in your terminal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1A1615] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans selection:bg-amber-800 selection:text-white">
      <div className="w-full max-w-5xl bg-[#FDFBF7] rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] border border-amber-900/20">
        
        {/* LEFT PANE: Book Haven Ambience */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#27211E] via-[#1E1917] to-[#120F0E] text-stone-200 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-700/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                <BookOpen size={22} />
              </div>
              <span className="text-xl font-bold tracking-tight text-amber-50 font-serif">
                Books<span className="text-amber-400">Loop</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-2 font-mono tracking-wider">LITERARY HAVEN & BOOK EXCHANGE</p>
          </div>

          <div className="my-10 relative z-10">
            <div className="flex items-center gap-2 text-amber-400/80 mb-3 text-xs tracking-wider uppercase font-semibold">
              <Feather size={14} />
              <span>Whispers of the Library</span>
            </div>
            
            <p className="font-serif italic text-lg sm:text-xl text-stone-100 leading-relaxed min-h-[90px] transition-all duration-700">
              "{LITERARY_QUOTES[quoteIndex].quote}"
            </p>
            <p className="text-xs text-amber-300/80 font-medium tracking-wide mt-2">
              — {LITERARY_QUOTES[quoteIndex].author}
            </p>

            <div className="flex gap-1.5 mt-6">
              {LITERARY_QUOTES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === quoteIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-stone-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-stone-800 flex items-center gap-3 text-xs text-stone-400">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-amber-700 border-2 border-stone-900 flex items-center justify-center text-[10px] text-white font-bold">A</div>
              <div className="w-7 h-7 rounded-full bg-stone-600 border-2 border-stone-900 flex items-center justify-center text-[10px] text-white font-bold">M</div>
              <div className="w-7 h-7 rounded-full bg-amber-900 border-2 border-stone-900 flex items-center justify-center text-[10px] text-white font-bold"><Heart size={10} /></div>
            </div>
            <span>Every book deserves another reader.</span>
          </div>
        </div>

        {/* RIGHT PANE: The Card-Catalog Entry Gate */}
        <div className="lg:col-span-7 p-8 sm:p-14 flex flex-col justify-center bg-[#FDFBF7]">
          <div className="max-w-md mx-auto w-full">
            
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/70 text-amber-800 text-xs font-semibold rounded-full mb-3">
                <Sparkles size={13} />
                <span>Readers Sanctuary</span>
              </div>
              <h2 className="text-3xl font-extrabold text-stone-900 font-serif tracking-tight">
                {isSignUp ? 'Issue your library card' : 'Welcome back, reader'}
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {isSignUp
                  ? 'Sign up once to join the loop and exchange books.'
                  : 'Enter your credentials to enter your library shelf.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-stone-400" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Jane Austen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-stone-400" size={18} />
                  <input
                    required
                    type="email"
                    placeholder="reader@bookloop.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-stone-400" size={18} />
                  <input
                    required
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm"
                  />
                </div>

                {/* Password Live Requirement Badges (shown when signing up) */}
                {isSignUp && password.length > 0 && (
                  <div className="flex gap-2 pt-1 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${isPasswordLongEnough ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                      {isPasswordLongEnough ? '✓' : '•'} 8+ chars
                    </span>
                    <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${hasPasswordNumber ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                      {hasPasswordNumber ? '✓' : '•'} 1 number
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-500 text-amber-50 py-3 rounded-xl font-medium tracking-wide shadow-md transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm"
              >
                <span>{loading ? 'Consulting the Records...' : isSignUp ? 'Issue My Library Card' : 'Open the Bookshelf'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="mt-6 text-center text-xs text-stone-600">
              {isSignUp ? (
                <>
                  Already hold a library card?{' '}
                  <button
                    onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    Sign in with your card
                  </button>
                </>
              ) : (
                <>
                  New to the world of BooksLoop?{' '}
                  <button
                    onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    Issue a library card
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}