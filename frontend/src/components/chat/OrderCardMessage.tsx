import React from 'react';
import { OrderCardData } from './types';

interface OrderCardMessageProps {
  data: OrderCardData;
}

export default function OrderCardMessage({ data }: OrderCardMessageProps) {
  return (
    <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4 w-64 shadow-sm">
      <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
        <span className="text-xs text-gray-500">Order ID</span>
        <span className="text-sm font-bold text-gray-800">#{data.orderId}</span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Status</span>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700">
            {data.status}
          </span>
        </div>
        {data.date && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Est. Delivery</span>
            <span className="text-xs font-medium text-gray-700">{data.date}</span>
          </div>
        )}
        {data.total !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">৳{data.total.toLocaleString()}</span>
          </div>
        )}
      </div>
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-md text-xs font-semibold transition-colors">
        Track Order
      </button>
    </div>
  );
}