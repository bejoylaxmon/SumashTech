import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const isFeatured = searchParams.get('isFeatured');
  const isNew = searchParams.get('isNew');

  let url = `${API_URL}/api/products?`;
  if (category) url += `category=${category}&`;
  if (isFeatured) url += `isFeatured=true&`;
  if (isNew) url += `isNew=true&`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    const products = await res.json();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
