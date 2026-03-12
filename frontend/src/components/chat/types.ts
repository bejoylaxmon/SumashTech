export type MessageType =
  | 'text'
  | 'buttons'
  | 'product_card'
  | 'product_list'
  | 'cart_item'
  | 'order_card'
  | 'policy_card';

export interface ComponentMessage<T = any> {
  type: MessageType;
  data: T;
}

export interface TextData {
  message: string;
}

export interface ButtonsData {
  options: string[];
}

export interface ProductCardData {
  id: number | string;
  title: string;
  price: number;
  image?: string;
  rating?: number;
}

export interface ProductListData {
  products: ProductCardData[];
}

export interface CartItemData {
  name: string;
  qty: number;
  price: number;
}

export interface OrderCardData {
  orderId: string | number;
  status: string;
  total?: number;
  date?: string;
}

export interface PolicyCardData {
  title: string;
  summary: string;
}