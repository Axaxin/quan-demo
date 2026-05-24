export interface CartItem {
  productId: string;
  name: string;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  price: number;
}

const CART_KEY = 'quan-cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(item: CartItem): void {
  const cart = getCart();
  const existing = cart.find(
    i => i.productId === item.productId && i.color === item.color && i.size === item.size
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

export function removeFromCart(productId: string, color: string, size: string): void {
  saveCart(getCart().filter(
    i => !(i.productId === productId && i.color === color && i.size === size)
  ));
}

export function updateQuantity(productId: string, color: string, size: string, quantity: number): void {
  saveCart(getCart().map(i =>
    i.productId === productId && i.color === color && i.size === size
      ? { ...i, quantity }
      : i
  ));
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
