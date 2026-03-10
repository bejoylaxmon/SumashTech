'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

interface ProductProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    discount?: number;
    images: string[];
    isNew?: boolean;
    isFeatured?: boolean;
    category: { name: string };
    rating?: number;
    stock?: number;
  };
}

export default function ProductCard({ product }: ProductProps) {
  const { addToCart } = useCart();
  const discountPrice = product.discount
    ? product.price - (product.price * product.discount / 100)
    : null;

  const imageUrl = product.images && product.images.length > 0
    ? product.images[0]
    : '/placeholder.png';

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 3;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
  };

  return (
    <Link href={`/product/${product.slug}`} className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full relative overflow-hidden">
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {isOutOfStock && (
          <span className="bg-gray-800 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">Out of Stock</span>
        )}
        {isLowStock && (
          <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">Low Stock ({stock} left)</span>
        )}
        {product.isFeatured && (
          <span className="bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">Featured</span>
        )}
        {product.isNew && (
          <span className="bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">New</span>
        )}
        {product.discount && (
          <span className="bg-red-500 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">-{product.discount}%</span>
        )}
      </div>

      {/* Product Image */}
      <div className={`relative aspect-square mb-4 bg-gray-50 rounded-2xl overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow">
        <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">{product.category.name}</span>
        <h3 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug h-10">
          {product.name}
        </h3>

        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-500 text-xs">★</span>
            <span className="text-gray-500 text-xs">{product.rating}</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-4">
          <div className="flex flex-col">
            {discountPrice ? (
              <>
                <span className="text-primary font-black text-lg">৳{discountPrice.toLocaleString()}</span>
                <span className="text-gray-400 text-xs line-through">৳{product.price.toLocaleString()}</span>
              </>
            ) : (
              <span className="text-primary font-black text-lg">৳{product.price.toLocaleString()}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`rounded-xl p-3 transition-all transform active:scale-95 shadow-sm ${isOutOfStock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 group-hover:bg-primary text-gray-400 group-hover:text-black'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
