import React from 'react';
import { MessageType } from './types';
import TextMessage from './TextMessage';
import ButtonsMessage from './ButtonsMessage';
import ProductCardMessage from './ProductCardMessage';
import ProductListMessage from './ProductListMessage';
import CartItemMessage from './CartItemMessage';
import OrderCardMessage from './OrderCardMessage';
import PolicyCardMessage from './PolicyCardMessage';

export const componentRegistry: Record<MessageType, React.FC<any>> = {
  text: TextMessage,
  buttons: ButtonsMessage,
  product_card: ProductCardMessage,
  product_list: ProductListMessage,
  cart_item: CartItemMessage,
  order_card: OrderCardMessage,
  policy_card: PolicyCardMessage,
};