'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { logout } from '@/store/slices/authSlice';
import { ShoppingBag, User, Leaf, Menu, X, LogOut, Settings } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Catalog', href: '/catalog' },
    { name: 'Farmers', href: '/#farmers' },
    { name: 'About', href: '/#about' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glassmorphism shadow-md py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-organic-500 p-2 rounded-xl text-white group-hover:scale-105 transition-transform duration-300">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold text-organic-700 tracking-tight">Nashik Organic</span>
              <span className="block text-[10px] tracking-widest text-earth-500 uppercase font-sans font-bold -mt-1">Express</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-sans text-sm font-semibold tracking-wide transition-colors duration-200 ${
                  pathname === link.href
                    ? 'text-organic-600 font-bold border-b-2 border-organic-500 pb-1'
                    : 'text-slate-600 hover:text-organic-500'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Action Icons */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/cart"
              className="relative p-2 text-slate-700 hover:text-organic-500 transition-colors duration-200"
            >
              <ShoppingBag className="h-6 w-6" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-organic-500 text-[10px] font-bold text-white ring-2 ring-cream-100 animate-pulse">
                  {totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1)}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-organic-50 text-organic-700 px-4 py-2 rounded-full border border-organic-200 hover:bg-organic-100 transition-all duration-200 text-sm font-semibold"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.name || 'Profile'}</span>
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="p-2 text-slate-700 hover:text-earth-500 transition-colors duration-200"
                    title="Admin Dashboard"
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-organic-500 hover:bg-organic-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-slate-700">
              <ShoppingBag className="h-6 w-6" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-organic-500 text-[9px] font-bold text-white">
                  {totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1)}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-700 hover:text-organic-500 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glassmorphism border-t border-organic-100 animate-fade-in">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 text-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-organic-500 hover:bg-organic-50"
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="pt-4 border-t border-organic-100 mt-4 space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-semibold text-organic-700 hover:bg-organic-50"
                >
                  My Profile ({user?.name})
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-3 rounded-md text-base font-semibold text-earth-600 hover:bg-organic-50"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-center px-3 py-3 rounded-md text-base font-medium text-red-500 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-organic-100 mt-4 px-3">
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-organic-500 text-white text-center py-3 rounded-full font-bold shadow"
                >
                  Login / Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
