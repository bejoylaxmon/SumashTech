import React from 'react';
import { ProductListData } from './types';
import ProductCardMessage from './ProductCardMessage';

interface ProductListMessageProps {
  data: ProductListData;
}

export default function ProductListMessage({ data }: ProductListMessageProps) {
  return (
    <div className="mt-2 text-sm bg-white p-2 rounded-lg border border-gray-200">
      <p className="font-medium mb-3 text-gray-700">Recommended Products:</p>
      <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
        {data.products.map((product, idx) => (
          <div key={idx} className="min-w-[160px] max-w-[160px] snap-start flex-shrink-0">
            <ProductCardMessage data={product} />
          </div>
        ))}
      </div>
    </div>
  );
}