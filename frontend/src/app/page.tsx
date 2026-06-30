'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { Search, ShieldCheck, Truck, Sprout, ArrowRight, UserCheck, Star, Sparkles, CheckCircle2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  unit: string;
  imageUrl: string;
  farmerName: string;
  certification: string;
  inventory?: { stockLevel: number } | null;
}

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  const heroDishes = [
    {
      name: 'Fresh Organic Spinach',
      image: '/produce1.png',
    },
    {
      name: 'Sun-Ripened Desi Tomatoes',
      image: '/produce2.png',
    },
    {
      name: 'Vibrant Bell Peppers',
      image: '/produce3.png',
    },
    {
      name: 'Crunchy Sinnar Carrots',
      image: '/produce4.png',
    },
    {
      name: 'Farm-Fresh Citrus Fruits',
      image: '/produce5.png',
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDishIndex((prev) => (prev + 1) % heroDishes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [heroDishes.length]);

  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const phrases = [
    'Delivered to Nashik',
    'Krishna Organic & Exotic Farming',
    '100% Pesticide-Free Sourced',
    'Direct from Certified Farmers',
    'Harvested Daily at Dawn'
  ];

  useEffect(() => {
    const handleTyping = () => {
      const currentIdx = loopNum % phrases.length;
      const fullText = phrases[currentIdx];

      if (isDeleting) {
        setTypedText(fullText.substring(0, typedText.length - 1));
        setTypingSpeed(45);
      } else {
        setTypedText(fullText.substring(0, typedText.length + 1));
        setTypingSpeed(85);
      }

      if (!isDeleting && typedText === fullText) {
        setIsDeleting(true);
        setTypingSpeed(2000); // Pause on complete word
      } else if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setLoopNum((prev) => prev + 1);
        setTypingSpeed(300); // Pause before next word
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [typedText, isDeleting, loopNum, typingSpeed]);


  // Fetch live featured products from API; fall back to static data if offline
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products/featured');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const mapped: Product[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description,
              price: p.price,
              discountPrice: p.discountPrice,
              unit: p.unit,
              imageUrl: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
              farmerName: p.farmer?.user?.name || p.farmer?.farmName || 'Local Farmer',
              certification: p.farmer?.certifications?.[0]?.name || 'Organic',
              inventory: p.inventory,
            }));
            setFeaturedProducts(mapped);
            return;
          }
        }
      } catch (_) {
        // API offline — use static fallback below
      }
      setFeaturedProducts(staticFeaturedProducts);
    };

    const fetchBanners = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/promotions/banners');
        if (res.ok) setBanners(await res.json());
      } catch (err) {}
    };

    loadFeatured();
    fetchBanners();
  }, []);

  // Banner Auto-rotation
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Core fallback landing page data
  const categories: Category[] = [
    {
      id: '1',
      name: 'Leafy Greens',
      slug: 'leafy-greens',
      description: 'Spinach, methi, coriander, and native greens.',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: '2',
      name: 'Root Vegetables',
      slug: 'root-vegetables',
      description: 'Pesticide-free potatoes, carrots, onions, and beets.',
      imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: '3',
      name: 'Exotic Vegetables',
      slug: 'exotic-veggies',
      description: 'Zucchini, colored peppers, cherry tomatoes, broccoli.',
      imageUrl: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: '4',
      name: 'Daily Essentials',
      slug: 'daily-essentials',
      description: 'Tomatoes, ladies finger, green chillies, and ginger.',
      imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=300&auto=format&fit=crop',
    },
  ];

  // Static fallback featured products (used if API is offline)
  const staticFeaturedProducts: Product[] = [
    {
      id: 'p1',
      name: 'Organic Palak (Spinach)',
      slug: 'organic-palak',
      description: 'Fresh baby spinach bundles grown in mineral-rich soil of Niphad, Nashik. Triple-washed.',
      price: 45.0,
      discountPrice: 35.0,
      unit: 'bunch',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop',
      farmerName: 'Ramesh Patil',
      certification: 'NPOP Certified',
    },
    {
      id: 'p2',
      name: 'Orange Carrots (Gajar)',
      slug: 'orange-carrots',
      description: 'Sweet, crunchy, and vitamin-A packed organic carrots grown without synthetic pesticides.',
      price: 60.0,
      discountPrice: 48.0,
      unit: 'kg',
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop',
      farmerName: 'Suresh Deshmukh',
      certification: 'PGS-India Organic',
    },
    {
      id: 'p3',
      name: 'Broccoli Premium',
      slug: 'broccoli-premium',
      description: 'Fresh dense heads of organic broccoli, loaded with antioxidants. Sourced from Sinnar.',
      price: 180.0,
      discountPrice: 140.0,
      unit: 'kg',
      imageUrl: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=600&auto=format&fit=crop',
      farmerName: 'Suresh Deshmukh',
      certification: 'PGS-India Organic',
    },
    {
      id: 'p4',
      name: 'Nashik Desi Tomatoes',
      slug: 'nashik-desi-tomatoes',
      description: 'Juicy, sour, and vine-ripened heirloom tomatoes perfect for daily curries and salads.',
      price: 40.0,
      discountPrice: 28.0,
      unit: 'kg',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=600&auto=format&fit=crop',
      farmerName: 'Ramesh Patil',
      certification: 'NPOP Certified',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAddToCart = (product: Product) => {
    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        imageUrl: product.imageUrl,
        quantity: 1,
        unit: product.unit,
      })
    );
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-organic-200">
      
      {/* Promotional Banners */}
      {banners.length > 0 && (
        <div className="w-full bg-organic-700 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between text-white text-xs sm:text-sm font-bold h-6">
              <div className="animate-fade-in truncate flex-grow">
                <Sparkles className="h-4 w-4 inline-block mr-2 text-organic-200" />
                {banners[currentBanner]?.title}
              </div>
              {banners[currentBanner]?.linkUrl && (
                <Link href={banners[currentBanner].linkUrl} className="shrink-0 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider transition-colors ml-4">
                  Shop Now
                </Link>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 w-full">
            <div className="h-full bg-organic-300 transition-all duration-[4000ms] ease-linear w-full origin-left" style={{ transform: 'scaleX(1)', animation: 'progress 4s linear infinite' }} />
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
          `}} />
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-organic-50 via-cream-200 to-organic-100/50 dark:from-slate-950 dark:via-organic-900/10 dark:to-slate-950 py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-organic-200 dark:bg-organic-850/20 blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-organic-300/40 dark:bg-organic-800/10 blur-3xl"></div>
          
          {/* Floating Sprout elements */}
          <div className="absolute top-[20%] left-[8%] text-organic-400/30 dark:text-organic-600/10 animate-float-leaf-1">
            <Sprout className="h-10 w-10 rotate-12" />
          </div>
          <div className="absolute bottom-[35%] left-[22%] text-organic-500/25 dark:text-organic-500/10 animate-float-leaf-2">
            <Sprout className="h-12 w-12 -rotate-12" />
          </div>
          <div className="absolute top-[18%] right-[18%] text-organic-450/25 dark:text-organic-600/10 animate-float-leaf-3">
            <Sprout className="h-8 w-8 rotate-45" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left animate-slide-up">
            <div className="inline-flex items-center gap-1.5 bg-organic-100 dark:bg-organic-900/50 text-organic-700 dark:text-organic-300 px-4 py-1.5 rounded-full text-xs font-bold border border-organic-200 dark:border-organic-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>100% Pesticide-Free Sourcing from Nashik Farms</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight">
              Fresh Organic Vegetables <br />
              <span className="text-organic-600 dark:text-organic-400 font-serif italic font-normal inline-flex items-center min-h-[1.2em]">
                {typedText}
                <span className="ml-1.5 inline-block w-1.5 h-[0.85em] bg-organic-550 dark:bg-organic-400 animate-blink rounded-sm shrink-0"></span>
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Harvested at dawn, delivered by noon. Experience the true taste of natural, nutrient-dense greens sourced from verified growers in Niphad, Sinnar & Dindori.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mt-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search fresh spinach, organic tomatoes, carrots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-organic-400 dark:focus:ring-organic-500 text-sm font-medium dark:text-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-organic-500 hover:bg-organic-600 dark:bg-organic-600 dark:hover:bg-organic-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all text-sm shrink-0"
              >
                Search Now
              </button>
            </form>

            <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-organic-500 dark:text-organic-400" /> Free Delivery above ₹300
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-organic-500 dark:text-organic-400" /> Next-Day Slots
              </span>
            </div>
          </div>

          {/* Hero Graphics */}
          <div className="lg:col-span-5 relative flex justify-center animate-fade-in">
            <div className="animate-float">
              <div 
                className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-organic-500 overflow-hidden shadow-2xl border-8 hover:border-[16px] border-white dark:border-slate-900 cursor-pointer transition-all duration-500 ease-out hover:scale-110 hover:animate-[spin_20s_linear_infinite]"
              >
                {heroDishes.map((dish, idx) => (
                  <img
                    key={idx}
                    src={dish.image}
                    alt={dish.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                      idx === currentDishIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0'
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Overlay Badges */}
            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-3 z-20">
              <div className="bg-organic-50 dark:bg-organic-950/50 p-2 rounded-xl text-organic-600 dark:text-organic-400">
                <Sprout className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Certified</span>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">100% Organic</span>
              </div>
            </div>
            {/* Active Dish Name Badge */}
            <div className="absolute -top-4 right-2 sm:right-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2 z-20 transition-all duration-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-organic-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-organic-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 font-sans tracking-wide">
                {heroDishes[currentDishIndex].name}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Brand Sourcing Story */}
      <section id="about" className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-organic-600 dark:text-organic-400 font-bold text-xs uppercase tracking-wider">Our Sourcing Philosophy</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Bridging the Gap Between Nashik Farmers and Your Dining Table
            </h2>
            <div className="h-1 w-20 bg-organic-500 dark:bg-organic-400 mx-auto rounded"></div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We work directly with certified marginal organic growers across Nashik talukas. By removing commission agents, we pay farmers a fair premium wage while ensuring you receive vegetables harvested less than 12 hours before arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-cream-200/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-organic-100/50 dark:border-slate-800/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left animate-fade-in">
              <div className="bg-organic-500 dark:bg-organic-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6">
                <Sprout className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-3">Pesticide-Free Soil</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Vegetables are grown utilizing organic fertilizers, neem oil sprays, and natural predatory insect control. Absolutely zero chemical runoff.
              </p>
            </div>

            <div className="bg-cream-200/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-organic-100/50 dark:border-slate-800/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left animate-fade-in">
              <div className="bg-organic-500 dark:bg-organic-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-3">Verified Certifications</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every vendor/farmer upload NPOP or PGS-India verification parameters checked by administrative bodies before listings go public.
              </p>
            </div>

            <div className="bg-cream-200/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-organic-100/50 dark:border-slate-800/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left animate-fade-in">
              <div className="bg-organic-500 dark:bg-organic-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-3">Insulated Fresh Delivery</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Transported in climate-stable crates using short delivery runs to lock in leafy hydration without chemical preservatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Categories */}
      <section className="py-20 bg-organic-50/40 dark:bg-organic-900/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="text-left space-y-2">
              <span className="text-organic-600 dark:text-organic-400 font-bold text-xs uppercase tracking-wider">Fresh Assortment</span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-serif">Explore By Category</h2>
            </div>
            <Link
              href="/catalog"
              className="group flex items-center gap-1 text-sm font-bold text-organic-600 dark:text-organic-400 hover:text-organic-700 dark:hover:text-organic-300"
            >
              View All Catalog <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.slug}`}
                className="group relative h-72 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-6 border-4 border-white dark:border-slate-900 card-shine animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent z-10"></div>
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="relative z-20 text-left space-y-1">
                  <h3 className="text-lg font-bold text-white font-serif">{cat.name}</h3>
                  <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>      {/* 4. Featured Products Grid */}
      <section className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <span className="text-organic-600 dark:text-organic-400 font-bold text-xs uppercase tracking-wider">Today's Harvest</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-serif">Featured Organic Vegetables</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((prod, idx) => (
              <div
                key={prod.id}
                className="group bg-cream-50 dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-800 hover:border-organic-200/50 dark:hover:border-organic-500/50 transition-all duration-300 flex flex-col justify-between animate-slide-up"
                style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
              >
                {/* Image */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-850 overflow-hidden card-shine">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-organic-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {prod.certification}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-grow flex flex-col justify-between text-left">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-earth-500 dark:text-earth-400 font-bold block uppercase tracking-wider">
                      By {prod.farmerName}
                    </span>
                    <Link
                      href={`/catalog/${prod.slug}`}
                      className="font-serif text-lg font-bold text-slate-800 dark:text-slate-150 hover:text-organic-600 dark:hover:text-organic-400 block line-clamp-1 transition-colors"
                    >
                      {prod.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100/80 dark:border-slate-800/80">
                    <div>
                      {prod.discountPrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-organic-700 dark:text-organic-400 font-sans">₹{prod.discountPrice}</span>
                          <span className="text-xs text-slate-400 line-through">₹{prod.price}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">₹{prod.price}</span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">per {prod.unit}</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(prod)}
                      disabled={!!(prod.inventory && prod.inventory.stockLevel <= 0)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        prod.inventory && prod.inventory.stockLevel <= 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                          : addedItem === prod.id
                          ? 'bg-organic-600 text-white'
                          : 'bg-organic-100 hover:bg-organic-500 text-organic-700 hover:text-white border border-organic-200 dark:bg-organic-900/50 dark:hover:bg-organic-600 dark:text-organic-300 dark:border-organic-800'
                      }`}
                    >
                      {prod.inventory && prod.inventory.stockLevel <= 0 ? 'Out of Stock' : addedItem === prod.id ? 'Added!' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="py-20 bg-organic-50/20 dark:bg-organic-900/5 border-t border-b border-organic-100/30 dark:border-organic-900/20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-organic-600 dark:text-organic-400 font-bold text-xs uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-serif">What Nashik Foodies Say</h2>
            <div className="h-1 w-12 bg-organic-500 dark:bg-organic-400 mx-auto rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative animate-slide-up" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
              <div className="flex justify-center gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed mb-6">
                "The palak and carrots are exceptionally sweet and fresh. They don't spoil quickly in the fridge like market veggies, proving they aren't pumped with chemicals."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-organic-100 dark:bg-organic-900/50 text-organic-700 dark:text-organic-300 font-bold flex items-center justify-center text-sm">
                  NK
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Neha Kulkarni</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase">Gangapur Road</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
              <div className="flex justify-center gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed mb-6">
                "Knowing that Ramesh Patil from Niphad grows my tomatoes gives so much peace of mind. Excellent initiative to support local Nashik farmers directly!"
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-organic-100 dark:bg-organic-900/50 text-organic-700 dark:text-organic-300 font-bold flex items-center justify-center text-sm">
                  SS
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Sanjay Shinde</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase">College Road</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
              <div className="flex justify-center gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed mb-6">
                "Amazing next-day morning delivery service. Subscribed to the Weekly Greens Basket and the variety of fresh native vegetables is outstanding."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-organic-100 dark:bg-organic-900/50 text-organic-700 dark:text-organic-300 font-bold flex items-center justify-center text-sm">
                  AJ
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Ananya Joshi</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase">Indira Nagar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
