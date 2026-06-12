'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { Search, SlidersHorizontal, Leaf, Sparkles, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  unit: string;
  categoryId: string;
  category: { name: string; slug: string };
  farmer: { farmName: string; location: string; user: { name: string } };
  images: Array<{ url: string }>;
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  // URL State Parameters
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  // Local Component Filters State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchText, setSearchText] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<number>(250);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  // Sync category query changes
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // Sync search query changes
  useEffect(() => {
    setSearchText(searchParams.get('search') || '');
  }, [searchParams]);

  // Load products & categories from API
  useEffect(() => {
    const loadCatalogData = async () => {
      setLoading(true);
      try {
        // Categories
        const catRes = await fetch('http://localhost:5000/api/products/categories');
        const catData = await catRes.json();
        if (catRes.ok) setCategories(catData);

        // Products with query strings
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (searchText) queryParams.append('search', searchText);
        queryParams.append('sortBy', sortBy);
        queryParams.append('maxPrice', priceRange.toString());

        const prodRes = await fetch(`http://localhost:5000/api/products?${queryParams.toString()}`);
        const prodData = await prodRes.json();
        if (prodRes.ok) {
          setProducts(prodData);
        } else {
          // Fallback static data if API server error
          setProducts(getStaticFallbackProducts().filter(p => {
            const matchesCat = !selectedCategory || p.category.slug === selectedCategory;
            const matchesSearch = !searchText || p.name.toLowerCase().includes(searchText.toLowerCase());
            const matchesPrice = (p.discountPrice || p.price) <= priceRange;
            return matchesCat && matchesSearch && matchesPrice;
          }));
        }
      } catch (err) {
        console.warn('API Offline. Using fallback mock catalog details.');
        // Fallback static data if fetch completely fails (offline dev mode)
        const mockProds = getStaticFallbackProducts().filter(p => {
          const matchesCat = !selectedCategory || p.category.slug === selectedCategory;
          const matchesSearch = !searchText || p.name.toLowerCase().includes(searchText.toLowerCase());
          const matchesPrice = (p.discountPrice || p.price) <= priceRange;
          return matchesCat && matchesSearch && matchesPrice;
        });

        // Mock categories
        setCategories([
          { id: '1', name: 'Leafy Greens', slug: 'leafy-greens' },
          { id: '2', name: 'Root Vegetables', slug: 'root-vegetables' },
          { id: '3', name: 'Exotic Vegetables', slug: 'exotic-veggies' },
          { id: '4', name: 'Daily Essentials', slug: 'daily-essentials' }
        ]);
        setProducts(mockProds);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogData();
  }, [selectedCategory, searchText, sortBy, priceRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchText) {
      params.set('search', searchText);
    } else {
      params.delete('search');
    }
    router.push(`/catalog?${params.toString()}`);
  };

  const handleCategorySelect = (slug: string) => {
    const newSlug = selectedCategory === slug ? '' : slug;
    setSelectedCategory(newSlug);
    const params = new URLSearchParams(searchParams.toString());
    if (newSlug) {
      params.set('category', newSlug);
    } else {
      params.delete('category');
    }
    router.push(`/catalog?${params.toString()}`);
  };

  const handleAddToCart = (product: Product) => {
    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        imageUrl: product.images[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        quantity: 1,
        unit: product.unit,
      })
    );
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-organic-700 to-organic-800 rounded-3xl p-8 md:p-12 text-white mb-10 text-left relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Leaf className="w-80 h-80 rotate-12 translate-x-20 translate-y-20 text-white" />
        </div>
        <div className="max-w-xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1 bg-organic-600 text-organic-100 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            <Sparkles className="h-3 w-3" /> Harvested Fresh Daily
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif">Nashik Veggie Catalog</h1>
          <p className="text-sm text-organic-200 leading-relaxed">
            Browse our wide collection of certified organic, chemical-free greens and farm produce grown right in Niphad and Sinnar fields.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-8 text-left bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="h-4.5 w-4.5 text-organic-550" /> Filters
            </h3>
            {(selectedCategory || searchText || priceRange < 250) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchText('');
                  setPriceRange(250);
                  router.push('/catalog');
                }}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Keywords</h4>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Spinach, Carrot..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-organic-400"
              />
              <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-organic-600">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vegetable Categories</h4>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                    selectedCategory === cat.slug
                      ? 'bg-organic-500 text-white'
                      : 'bg-slate-50 hover:bg-organic-50 text-slate-700 hover:text-organic-700'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-400">Max Price</h4>
              <span className="font-bold text-organic-700">₹{priceRange}</span>
            </div>
            <input
              type="range"
              min="20"
              max="250"
              step="5"
              value={priceRange}
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
              className="w-full accent-organic-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>₹20</span>
              <span>₹250</span>
            </div>
          </div>
        </div>

        {/* Catalog List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting Bar */}
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
            <p className="text-slate-600 text-left">
              Showing <span className="text-organic-700 font-bold">{products.length}</span> vegetables
            </p>
            <div className="flex items-center gap-2">
              <span>Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-organic-500 text-slate-750 font-bold"
              >
                <option value="newest">Newest Harvest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
              <AlertCircle className="h-12 w-12 text-slate-350 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-slate-800">No Vegetables Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any organic products matching your filters. Try clearing your filters or widening search keywords.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-100 hover:border-organic-200/50 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.images[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-organic-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {prod.category.name}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-grow flex flex-col justify-between text-left">
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-earth-500 font-bold block uppercase tracking-wider">
                        By {prod.farmer.farmName}
                      </span>
                      <Link
                        href={`/catalog/${prod.slug}`}
                        className="font-serif text-base font-bold text-slate-800 hover:text-organic-600 block line-clamp-1 transition-colors"
                      >
                        {prod.name}
                      </Link>
                      <p className="text-xs text-slate-550 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        {prod.discountPrice ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-organic-700">₹{prod.discountPrice}</span>
                            <span className="text-xs text-slate-400 line-through">₹{prod.price}</span>
                          </div>
                        ) : (
                          <span className="text-base font-bold text-slate-800">₹{prod.price}</span>
                        )}
                        <span className="text-[9px] text-slate-400 font-semibold block">per {prod.unit}</span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(prod)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                          addedItem === prod.id
                            ? 'bg-organic-600 text-white'
                            : 'bg-organic-50 hover:bg-organic-500 text-organic-700 hover:text-white border border-organic-100'
                        }`}
                      >
                        {addedItem === prod.id ? 'Added!' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Static Fallback Data
function getStaticFallbackProducts(): Product[] {
  return [
    {
      id: 'p1',
      name: 'Organic Palak (Spinach)',
      slug: 'organic-palak',
      description: 'Iron-rich farm-fresh baby spinach bunches grown in Niphad, Nashik. Triple-washed and ready to cook.',
      price: 45.0,
      discountPrice: 35.0,
      unit: 'bunch',
      categoryId: '1',
      category: { name: 'Leafy Greens', slug: 'leafy-greens' },
      farmer: { farmName: 'Patil Bio-Farms', location: 'Niphad, Nashik', user: { name: 'Ramesh Patil' } },
      images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop' }],
    },
    {
      id: 'p2',
      name: 'Orange Carrots (Gajar)',
      slug: 'orange-carrots',
      description: 'Sweet, crunchy, and vitamin-A packed organic carrots grown without synthetic pesticides.',
      price: 60.0,
      discountPrice: 48.0,
      unit: 'kg',
      categoryId: '2',
      category: { name: 'Root Vegetables', slug: 'root-vegetables' },
      farmer: { farmName: 'Deshmukh Natural Gardens', location: 'Sinnar, Nashik', user: { name: 'Suresh Deshmukh' } },
      images: [{ url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop' }],
    },
    {
      id: 'p3',
      name: 'Broccoli Premium',
      slug: 'broccoli-premium',
      description: 'Fresh dense heads of organic broccoli, loaded with antioxidants. Sourced from Sinnar.',
      price: 180.0,
      discountPrice: 140.0,
      unit: 'kg',
      categoryId: '3',
      category: { name: 'Exotic Vegetables', slug: 'exotic-veggies' },
      farmer: { farmName: 'Deshmukh Natural Gardens', location: 'Sinnar, Nashik', user: { name: 'Suresh Deshmukh' } },
      images: [{ url: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=600&auto=format&fit=crop' }],
    },
    {
      id: 'p4',
      name: 'Nashik Desi Tomatoes',
      slug: 'nashik-desi-tomatoes',
      description: 'Juicy, sour, and vine-ripened tomatoes perfect for daily curries and salads.',
      price: 40.0,
      discountPrice: 28.0,
      unit: 'kg',
      categoryId: '4',
      category: { name: 'Daily Essentials', slug: 'daily-essentials' },
      farmer: { farmName: 'Patil Bio-Farms', location: 'Niphad, Nashik', user: { name: 'Ramesh Patil' } },
      images: [{ url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=600&auto=format&fit=crop' }],
    },
    {
      id: 'p5',
      name: 'Yellow Bell Pepper',
      slug: 'yellow-bell-pepper',
      description: 'Crispy, vibrant yellow bell pepper cultivated in protected shadehouses. Sweet flavor.',
      price: 220.0,
      discountPrice: 190.0,
      unit: 'kg',
      categoryId: '3',
      category: { name: 'Exotic Vegetables', slug: 'exotic-veggies' },
      farmer: { farmName: 'Patil Bio-Farms', location: 'Niphad, Nashik', user: { name: 'Ramesh Patil' } },
      images: [{ url: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=600&auto=format&fit=crop' }],
    }
  ];
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-bold text-organic-700">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
