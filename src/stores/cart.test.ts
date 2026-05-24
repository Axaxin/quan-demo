import { describe, it, expect, beforeEach } from 'vitest';
import { addToCart, getCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } from './cart';

describe('cart store', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(getCart()).toEqual([]);
  });

  it('adds item to cart', () => {
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 1, price: 99 });
    expect(getCart()).toHaveLength(1);
  });

  it('merges duplicate items', () => {
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 1, price: 99 });
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 2, price: 99 });
    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it('treats different color as separate item', () => {
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 1, price: 99 });
    addToCart({ productId: 'p1', name: 'T恤', color: '白色', colorHex: '#fff', size: 'M', quantity: 1, price: 99 });
    expect(getCart()).toHaveLength(2);
  });

  it('treats different size as separate item', () => {
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 1, price: 99 });
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'L', quantity: 1, price: 99 });
    expect(getCart()).toHaveLength(2);
  });

  it('removes item', () => {
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 1, price: 99 });
    removeFromCart('p1', '黑色', 'M');
    expect(getCart()).toHaveLength(0);
  });

  it('updates quantity', () => {
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 1, price: 99 });
    updateQuantity('p1', '黑色', 'M', 5);
    expect(getCart()[0].quantity).toBe(5);
  });

  it('clears cart', () => {
    addToCart({ productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 1, price: 99 });
    clearCart();
    expect(getCart()).toHaveLength(0);
  });

  it('calculates total', () => {
    const cart = [
      { productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 2, price: 99 },
      { productId: 'p2', name: '卫衣', color: '白色', colorHex: '#fff', size: 'L', quantity: 1, price: 199 },
    ];
    expect(getCartTotal(cart)).toBe(397);
  });

  it('counts total quantity across items', () => {
    const cart = [
      { productId: 'p1', name: 'T恤', color: '黑色', colorHex: '#000', size: 'M', quantity: 2, price: 99 },
      { productId: 'p2', name: '卫衣', color: '白色', colorHex: '#fff', size: 'L', quantity: 1, price: 199 },
    ];
    expect(getCartCount(cart)).toBe(3);
  });
});
