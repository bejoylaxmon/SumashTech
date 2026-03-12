import React from 'react';
import { CartItemData } from './types';

interface CartItemMessageProps {
  data: CartItemData;
}

export default function CartItemMessage({ data }: CartItemMessageProps) {
  return (
    <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 w-64">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-800 line-clamp-2">{data.name}</h4>
          <p className="text-xs text-gray-500 mt-1">Qty: {data.qty}</p>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Total:</span>
        <span className="text-sm font-bold text-blue-600">৳{data.price.toLocaleString()}</span>
      </div>
      <button className="w-full mt-3 bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
        View Cart
      </button>
    </div>
  );
}