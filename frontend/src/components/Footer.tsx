import React from 'react';
import Link from 'next/link';
import { Leaf, Phone, Mail, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  const deliveryZones = [
    'College Road',
    'Gangapur Road',
    'Indira Nagar',
    'Pathardi Phata',
    'Nashik Road',
    'Panchavati',
    'Govind Nagar',
    'Cidco'
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 border-t-4 border-organic-500 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="bg-organic-500 p-2 rounded-xl text-white">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-white tracking-tight">Krishna Organic</span>
                <span className="block text-[10px] tracking-widest text-organic-400 uppercase font-sans font-bold -mt-1">& Exotic Farming</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Sourcing freshest organic vegetables directly from standard-certified bio-farms in Niphad, Sinnar, and surrounding Nashik talukas. Pesticide-free, nutrient-dense, and delivered right to your doorstep.
            </p>
            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-organic-400" />
                +91 98230 12345
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-organic-400" />
                info@krishnaorganic.com
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/catalog" className="hover:text-organic-400 transition-colors">
                  Shop Vegetables
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-organic-400 transition-colors">
                  Our Brand Story
                </Link>
              </li>
              <li>
                <Link href="/#farmers" className="hover:text-organic-400 transition-colors">
                  Meet the Farmers
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-organic-400 transition-colors">
                  Create Customer Account
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-organic-400 transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Local Delivery Zones */}
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-4">Nashik Delivery Zones</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-400">
              {deliveryZones.map((zone) => (
                <div key={zone} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-organic-500"></span>
                  <span>{zone}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-4 leading-normal flex items-start gap-1">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-earth-500" />
              <span>Orders placed before 8 PM are dispatched for next-day morning delivery slot.</span>
            </p>
          </div>

          {/* Newsletter / Download App teaser */}
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-4">Download App</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Order on the go! Scan the QR or click below to install the Krishna Organic & Exotic Farming Android/iOS app (Coming soon).
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer hover:bg-slate-750 transition-colors">
                <span className="text-[10px] text-slate-400 block font-sans">GET IT ON</span>
                <span className="text-xs font-bold block text-white -mt-0.5">Google Play</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer hover:bg-slate-750 transition-colors">
                <span className="text-[10px] text-slate-400 block font-sans">Download on</span>
                <span className="text-xs font-bold block text-white -mt-0.5">App Store</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Krishna Organic & Exotic Farming. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Grown with <Heart className="h-3.5 w-3.5 text-organic-500 fill-organic-500" /> in Nashik fields
          </p>
        </div>
      </div>
    </footer>
  );
}
