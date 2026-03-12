import React from 'react';
import { ProductCardData } from './types';
import Image from 'next/image';

interface ProductCardMessageProps {
  data: ProductCardData;
}

export default function ProductCardMessage({ data }: ProductCardMessageProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-2 max-w-[200px]">
      {data.image && (
        <div className="relative w-full h-32 bg-gray-100">
          <Image
            src={data.image}
            alt={data.title}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-gray-800 truncate">{data.title}</h4>
        <p className="text-sm text-blue-600 font-bold mt-1">৳{data.price.toLocaleString()}</p>
        {data.rating && (
          <div className="flex items-center mt-1">
            <span className="text-xs text-yellow-500">★ {data.rating}</span>
          </div>
        )}
        <button className="w-full mt-3 bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 transition">
          View Detail
        </button>
      </div>
    </div>
  );
}