'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { ShieldCheck, UserCheck, Star, ShoppingBag, Plus, Minus, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface Certification {
  name: string;
  agency: string;
  expiryDate: string;
}

interface Farmer {
  farmName: string;
  location: string;
  bio: string | null;
  user: { name: string };
  certifications: Certification[];
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  unit: string;
  category: { name: string; slug: string };
  farmer: Farmer;
  images: Array<{ url: string }>;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const dispatch = useDispatch();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${slug}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts);
        } else {
          // Fallback static detail matching slug
          const mockDetail = getStaticProductDetails(slug);
          if (mockDetail) {
            setProduct(mockDetail.product);
            setRelatedProducts(mockDetail.related);
          }
        }
      } catch (err) {
        console.warn('API Offline. Loading fallback product details.');
        const mockDetail = getStaticProductDetails(slug);
        if (mockDetail) {
          setProduct(mockDetail.product);
          setRelatedProducts(mockDetail.related);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  const handleQtyChange = (val: number) => {
    if (val >= 1 && val <= 10) {
      setQuantity(val);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        imageUrl: product.images[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
        quantity: quantity,
        unit: product.unit,
      })
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-organic-700 font-bold">
        Loading vegetable details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif text-slate-800">Vegetable Not Found</h2>
        <p className="text-xs text-slate-500">The product you are trying to view does not exist or has been unlisted.</p>
        <Link href="/catalog" className="inline-flex items-center gap-1.5 text-xs text-organic-600 font-bold hover:underline">
          <ArrowLeft className="h-4.5 w-4.5" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const activePrice = product.discountPrice !== null ? product.discountPrice : product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-8">
        <Link href="/catalog" className="hover:text-organic-600">Catalog</Link>
        <span>/</span>
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-organic-600">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-slate-650 font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-16">
        {/* Left: Images */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-6 flex items-center justify-center border-4 border-white">
          <img
            src={product.images[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999'}
            alt={product.name}
            className="rounded-2xl max-h-96 object-cover w-full shadow-inner"
          />
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-earth-500 font-bold uppercase tracking-wider block">
              Direct from {product.farmer.farmName}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif leading-tight">
              {product.name}
            </h1>
            <div className="inline-flex items-center gap-1.5 bg-organic-100 text-organic-850 px-3 py-1 rounded-full text-[10px] font-bold border border-organic-200">
              <ShieldCheck className="h-3.5 w-3.5 text-organic-600" />
              <span>{product.farmer.certifications[0]?.name || 'NPOP Certified'}</span>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Pricing & Quantity */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              {product.discountPrice ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-organic-700">₹{product.discountPrice}</span>
                  <span className="text-sm text-slate-400 line-through">₹{product.price}</span>
                </div>
              ) : (
                <span className="text-3xl font-black text-slate-800">₹{product.price}</span>
              )}
              <span className="text-xs text-slate-400 font-semibold block">Price per {product.unit}</span>
            </div>

            {/* Qty Manager */}
            <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
              <button
                onClick={() => handleQtyChange(quantity - 1)}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/40 text-slate-600 hover:text-slate-800"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold text-sm text-slate-800 w-8 text-center">
                {quantity} {product.unit}
              </span>
              <button
                onClick={() => handleQtyChange(quantity + 1)}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/40 text-slate-600 hover:text-slate-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          <button
            onClick={handleAddToCart}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all ${
              added
                ? 'bg-organic-600 text-white'
                : 'bg-organic-500 hover:bg-organic-600 text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="h-5 w-5" /> Added to Delivery Basket!
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" /> Add to Delivery Basket (₹{activePrice * quantity})
              </>
            )}
          </button>

          <div className="h-px bg-slate-100"></div>

          {/* Farmer Bio Details */}
          <div className="bg-cream-200/50 p-6 rounded-2xl border border-organic-100/50 space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-1.5">
              <UserCheck className="h-5 w-5 text-organic-600" /> Sourcing Farmer Details
            </h3>
            <div className="space-y-2">
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">{product.farmer.user.name}</span>
                <span className="text-slate-400">{product.farmer.location}</span>
              </div>
              <p className="text-xs text-slate-550 leading-relaxed italic">
                "{product.farmer.bio || 'Dedicated to offering high quality chemical-free fresh vegetable harvests directly to Nashik households.'}"
              </p>
            </div>

            {/* Certifications lists */}
            <div className="border-t border-slate-200/50 pt-3 mt-3 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Verifiable Organic Certifications
              </span>
              <div className="flex flex-col gap-1.5">
                {product.farmer.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-650">
                    <span className="font-semibold">{cert.name}</span>
                    <span className="text-[10px] bg-white border border-slate-200/60 px-2 py-0.5 rounded-full text-slate-450">
                      Agency: {cert.agency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-slate-100 pt-16">
          <h2 className="text-2xl font-extrabold text-slate-900 font-serif mb-8 text-left">Related Vegetables</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:border-organic-200/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-40 bg-slate-100">
                  <img
                    src={p.images[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999'}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 text-left space-y-1">
                  <Link
                    href={`/catalog/${p.slug}`}
                    className="font-serif text-sm font-bold text-slate-800 hover:text-organic-600 block line-clamp-1 transition-colors"
                  >
                    {p.name}
                  </Link>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-organic-700">
                      ₹{p.discountPrice || p.price}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ {p.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback Mock Details
function getStaticProductDetails(slug: string) {
  const items = [
    {
      id: 'p1',
      name: 'Organic Palak (Spinach)',
      slug: 'organic-palak',
      description: 'Iron-rich farm-fresh baby spinach bunches grown in mineral-rich soil of Niphad, Nashik. Triple-washed, crispy green texture, absolute zero pesticide usage, and ready to cook directly.',
      price: 45.0,
      discountPrice: 35.0,
      unit: 'bunch',
      category: { name: 'Leafy Greens', slug: 'leafy-greens' },
      images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=600&auto=format&fit=crop' }],
      farmer: {
        farmName: 'Patil Bio-Farms, Niphad',
        location: 'Niphad, Nashik',
        bio: 'Pioneers in pesticide-free vermicompost cultivation since 2015.',
        user: { name: 'Ramesh Patil' },
        certifications: [
          { name: 'NPOP Certified Organic', agency: 'OneCert Asia', expiryDate: '2027-12-31' }
        ]
      }
    },
    {
      id: 'p2',
      name: 'Orange Carrots (Gajar)',
      slug: 'orange-carrots',
      description: 'Sweet, crunchy, and vitamin-A packed organic carrots grown without synthetic pesticides. Sourced from the Sinnar highland fields.',
      price: 60.0,
      discountPrice: 48.0,
      unit: 'kg',
      category: { name: 'Root Vegetables', slug: 'root-vegetables' },
      images: [{ url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop' }],
      farmer: {
        farmName: 'Deshmukh Natural Gardens, Sinnar',
        location: 'Sinnar, Nashik',
        bio: 'Sourced directly from rain-fed highlands utilizing natural spring irrigation and multi-cropping techniques.',
        user: { name: 'Suresh Deshmukh' },
        certifications: [
          { name: 'PGS-India Organic Green', agency: 'Regional Council, Nashik', expiryDate: '2028-06-30' }
        ]
      }
    },
    {
      id: 'p3',
      name: 'Broccoli Premium',
      slug: 'broccoli-premium',
      description: 'Fresh dense heads of organic broccoli, loaded with antioxidants. Excellent for salads, stir-fries, and healthy side dishes. Raised with compost.',
      price: 180.0,
      discountPrice: 140.0,
      unit: 'kg',
      category: { name: 'Exotic Vegetables', slug: 'exotic-veggies' },
      images: [{ url: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=600&auto=format&fit=crop' }],
      farmer: {
        farmName: 'Deshmukh Natural Gardens, Sinnar',
        location: 'Sinnar, Nashik',
        bio: 'Sourced directly from rain-fed highlands utilizing natural spring irrigation and multi-cropping techniques.',
        user: { name: 'Suresh Deshmukh' },
        certifications: [
          { name: 'PGS-India Organic Green', agency: 'Regional Council, Nashik', expiryDate: '2028-06-30' }
        ]
      }
    },
    {
      id: 'p4',
      name: 'Nashik Desi Tomatoes',
      slug: 'nashik-desi-tomatoes',
      description: 'Vibrant, juicy, and sour heirloom tomatoes harvested at peak ripeness. Perfect for curries, soups, and raw salads.',
      price: 40.0,
      discountPrice: 28.0,
      unit: 'kg',
      category: { name: 'Daily Essentials', slug: 'daily-essentials' },
      images: [{ url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=600&auto=format&fit=crop' }],
      farmer: {
        farmName: 'Patil Bio-Farms, Niphad',
        location: 'Niphad, Nashik',
        bio: 'Pioneers in pesticide-free vermicompost cultivation since 2015.',
        user: { name: 'Ramesh Patil' },
        certifications: [
          { name: 'NPOP Certified Organic', agency: 'OneCert Asia', expiryDate: '2027-12-31' }
        ]
      }
    }
  ];

  const product = items.find(p => p.slug === slug) || null;
  if (!product) return null;

  const related = items.filter(p => p.slug !== slug).slice(0, 4);

  return { product, related };
}
