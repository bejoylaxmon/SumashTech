'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function Footer() {
  const [phone, setPhone] = useState('+88 01234 567890');
  const [address, setAddress] = useState('Dhaka, Bangladesh');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/home-settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.phone) setPhone(data.phone);
        if (data.address) setAddress(data.address);
      } catch (err) {
        console.error('Failed to fetch footer settings:', err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white text-lg font-bold mb-4">SumashTech</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your one-stop shop for the latest electronics and gadgets in Bangladesh.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shipping" className="hover:text-primary">Shipping Policy</Link></li>
              <li><Link href="/return-policy" className="hover:text-primary">Return Policy</Link></li>
              <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="/support" className="hover:text-primary">Support</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>{address}</li>
              <li>support@sumashtech.com</li>
              <li>{phone}</li>
              <li>Sat - Thu: 9:00 AM - 9:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SumashTech. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
