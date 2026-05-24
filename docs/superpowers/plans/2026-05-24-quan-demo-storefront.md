# QUAN Demo Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Uniqlo-style clothing e-commerce demo on Astro + Cloudflare Pages with guest-only browsing and order submission.

**Architecture:** Astro in `hybrid` output mode with `@astrojs/cloudflare` adapter. Product catalog lives in static JSON (prerendered pages), cart state in `localStorage`, orders stored in CF KV via CF Pages Functions API routes.

**Tech Stack:** Astro, @astrojs/cloudflare, CF KV (`QUAN_STORE`), Vitest + happy-dom, vanilla CSS.

---

## File Map

```
quan-demo/
├── src/
│   ├── data/products.json          # Static product catalog (12 products, 6 categories)
│   ├── types/product.ts            # Product/CartItem interfaces + CATEGORIES constant
│   ├── stores/cart.ts              # localStorage cart helpers
│   ├── stores/cart.test.ts         # Vitest unit tests for cart store
│   ├── styles/global.css           # CSS variables + reset + shared classes
│   ├── layouts/Layout.astro        # Base layout (Nav + slot + Footer)
│   ├── components/
│   │   ├── Nav.astro               # Sticky black navbar, cart count badge
│   │   ├── Footer.astro            # Simple footer
│   │   └── ProductCard.astro       # Product grid card (image + name + price + color dots)
│   ├── pages/
│   │   ├── index.astro             # Homepage: hero + category grid + featured
│   │   ├── products/[category].astro  # Category listing, prerendered
│   │   ├── product/[id].astro      # Product detail, prerendered, client-side cart add
│   │   ├── cart.astro              # Cart page (client-rendered from localStorage)
│   │   ├── checkout.astro          # Checkout form + payment placeholder
│   │   ├── order/[id].astro        # Order confirmation, SSR from KV
│   │   └── api/
│   │       ├── order.ts            # POST /api/order → write to KV
│   │       └── order/[id].ts       # GET /api/order/[id] → read from KV
│   └── env.d.ts                    # CF runtime type declarations
├── astro.config.mjs
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/env.d.ts`
- Create: `src/pages/index.astro` (temporary placeholder)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "quan-demo",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/cloudflare": "^12.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "vitest": "^2.0.0",
    "happy-dom": "^14.0.0"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'hybrid',
  adapter: cloudflare(),
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
});
```

- [ ] **Step 5: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

interface Env {
  QUAN_STORE: import('@cloudflare/workers-types').KVNamespace;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
```

- [ ] **Step 6: Create temporary `src/pages/index.astro`**

```astro
---
---
<html lang="zh">
  <head><meta charset="UTF-8" /><title>QUAN</title></head>
  <body><h1>QUAN</h1></body>
</html>
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 8: Verify build succeeds**

```bash
npm run build
```

Expected: `dist/` directory created, exit 0.

- [ ] **Step 9: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json vitest.config.ts src/
git commit -m "feat: initialize Astro project with Cloudflare Pages adapter"
```

---

## Task 2: Product catalog data and types

**Files:**
- Create: `src/types/product.ts`
- Create: `src/data/products.json`

- [ ] **Step 1: Create `src/types/product.ts`**

```ts
export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'tshirt' | 'hoodie' | 'shorts' | 'pants' | 'shirt' | 'polo';
  price: number;
  colors: ProductColor[];
  sizes: string[];
  description: string;
}

export const CATEGORIES = {
  tshirt: 'T恤',
  hoodie: '卫衣',
  shorts: '短裤',
  pants: '长裤',
  shirt: '衬衣',
  polo: 'Polo衫',
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
```

- [ ] **Step 2: Create `src/data/products.json`**

```json
[
  {
    "id": "tshirt-001",
    "name": "圆领短袖T恤",
    "category": "tshirt",
    "price": 99,
    "colors": [
      { "name": "白色", "hex": "#f5f5f5" },
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "蓝灰", "hex": "#6B7D8F" }
    ],
    "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
    "description": "100% 纯棉圆领短袖，轻薄透气，日常百搭。"
  },
  {
    "id": "tshirt-002",
    "name": "V领短袖T恤",
    "category": "tshirt",
    "price": 99,
    "colors": [
      { "name": "白色", "hex": "#f5f5f5" },
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "米色", "hex": "#E8DCC8" }
    ],
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "description": "V领修身设计，简约百搭，适合日常通勤。"
  },
  {
    "id": "hoodie-001",
    "name": "连帽卫衣",
    "category": "hoodie",
    "price": 199,
    "colors": [
      { "name": "灰色", "hex": "#9CA3AF" },
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "奶白", "hex": "#F9F6F0" }
    ],
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "description": "宽松版型连帽卫衣，柔软亲肤，秋冬必备。"
  },
  {
    "id": "hoodie-002",
    "name": "圆领卫衣",
    "category": "hoodie",
    "price": 179,
    "colors": [
      { "name": "米白", "hex": "#F5F0E8" },
      { "name": "深蓝", "hex": "#1E3A5F" }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "description": "极简圆领卫衣，经典版型，多色可选。"
  },
  {
    "id": "shorts-001",
    "name": "休闲短裤",
    "category": "shorts",
    "price": 129,
    "colors": [
      { "name": "卡其", "hex": "#C4A882" },
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "灰色", "hex": "#9CA3AF" }
    ],
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "description": "轻薄速干休闲短裤，弹性腰带，舒适透气。"
  },
  {
    "id": "shorts-002",
    "name": "运动短裤",
    "category": "shorts",
    "price": 99,
    "colors": [
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "深灰", "hex": "#4B5563" }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "description": "弹力运动短裤，适合健身跑步及日常休闲。"
  },
  {
    "id": "pants-001",
    "name": "直筒休闲裤",
    "category": "pants",
    "price": 199,
    "colors": [
      { "name": "卡其", "hex": "#C4A882" },
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "深蓝", "hex": "#1E3A5F" }
    ],
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "description": "直筒版型休闲裤，简约百搭，春秋两季皆宜。"
  },
  {
    "id": "pants-002",
    "name": "修身西裤",
    "category": "pants",
    "price": 229,
    "colors": [
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "深灰", "hex": "#374151" }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "description": "修身剪裁西裤，通勤商务两相宜。"
  },
  {
    "id": "shirt-001",
    "name": "纯棉牛津衬衣",
    "category": "shirt",
    "price": 149,
    "colors": [
      { "name": "白色", "hex": "#f5f5f5" },
      { "name": "淡蓝", "hex": "#BFDBFE" },
      { "name": "粉色", "hex": "#FBCFE8" }
    ],
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "description": "经典牛津纺衬衣，柔软亲肤，商务休闲均适宜。"
  },
  {
    "id": "shirt-002",
    "name": "亚麻短袖衬衣",
    "category": "shirt",
    "price": 149,
    "colors": [
      { "name": "米白", "hex": "#F5F0E8" },
      { "name": "浅绿", "hex": "#BBF7D0" }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "description": "天然亚麻短袖衬衣，清爽透气，夏季首选。"
  },
  {
    "id": "polo-001",
    "name": "经典短袖Polo衫",
    "category": "polo",
    "price": 149,
    "colors": [
      { "name": "白色", "hex": "#f5f5f5" },
      { "name": "黑色", "hex": "#1a1a1a" },
      { "name": "藏蓝", "hex": "#1E3A5F" },
      { "name": "红色", "hex": "#DC2626" }
    ],
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "description": "经典款Polo衫，修身版型，商务休闲皆宜。"
  },
  {
    "id": "polo-002",
    "name": "条纹Polo衫",
    "category": "polo",
    "price": 159,
    "colors": [
      { "name": "白/蓝", "hex": "#BFDBFE" },
      { "name": "白/红", "hex": "#FECACA" }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "description": "经典条纹设计，夏季清爽必备。"
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add src/types/product.ts src/data/products.json
git commit -m "feat: add product catalog (12 products, 6 categories) and types"
```

---

## Task 3: Global styles, layout, Nav, Footer

**Files:**
- Create: `src/styles/global.css`
- Create: `src/components/Nav.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/Layout.astro`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
:root {
  --black: #1a1a1a;
  --white: #ffffff;
  --gray-100: #f5f5f5;
  --gray-200: #e8e8e8;
  --gray-400: #9ca3af;
  --gray-600: #4b5563;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--black);
  background: var(--white);
  line-height: 1.5;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; border: none; background: none; font-family: inherit; font-size: inherit; }
img { display: block; max-width: 100%; }

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.btn-primary {
  display: block;
  width: 100%;
  padding: 14px;
  background: var(--black);
  color: var(--white);
  font-size: 14px;
  letter-spacing: 1px;
  text-align: center;
  cursor: pointer;
  border: 2px solid var(--black);
  transition: background 0.2s, color 0.2s;
}
.btn-primary:hover { background: var(--white); color: var(--black); }

.btn-secondary {
  display: block;
  width: 100%;
  padding: 14px;
  background: var(--white);
  color: var(--black);
  font-size: 14px;
  letter-spacing: 1px;
  text-align: center;
  cursor: pointer;
  border: 2px solid var(--black);
  transition: background 0.2s, color 0.2s;
}
.btn-secondary:hover { background: var(--black); color: var(--white); }
```

- [ ] **Step 2: Create `src/components/Nav.astro`**

```astro
---
import { CATEGORIES } from '../types/product';
---

<nav class="nav">
  <div class="nav-inner container">
    <a href="/" class="nav-brand">QUAN</a>
    <ul class="nav-links">
      {Object.entries(CATEGORIES).map(([key, label]) => (
        <li><a href={`/products/${key}`}>{label}</a></li>
      ))}
    </ul>
    <a href="/cart" class="nav-cart">
      购物车&nbsp;<span id="cart-count" class="cart-badge">0</span>
    </a>
  </div>
</nav>

<script>
  import { getCart, getCartCount } from '../stores/cart';
  const el = document.getElementById('cart-count');
  if (el) el.textContent = String(getCartCount(getCart()));
</script>

<style>
.nav {
  position: sticky; top: 0; z-index: 100;
  background: var(--black); color: var(--white);
}
.nav-inner {
  display: flex; align-items: center; height: 56px; gap: 32px;
}
.nav-brand {
  font-size: 20px; font-weight: 700; letter-spacing: 4px;
  color: var(--white); flex-shrink: 0;
}
.nav-links {
  display: flex; list-style: none; gap: 24px; flex: 1;
}
.nav-links a {
  font-size: 13px; color: rgba(255,255,255,0.75); transition: color 0.2s;
}
.nav-links a:hover { color: var(--white); }
.nav-cart {
  font-size: 13px; color: rgba(255,255,255,0.75); flex-shrink: 0;
  display: flex; align-items: center; transition: color 0.2s;
}
.nav-cart:hover { color: var(--white); }
.cart-badge {
  background: var(--white); color: var(--black);
  font-size: 11px; font-weight: 700;
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
}
</style>
```

- [ ] **Step 3: Create `src/components/Footer.astro`**

```astro
<footer class="footer">
  <div class="container">
    <p class="footer-brand">QUAN</p>
    <p class="footer-copy">© 2026 QUAN. All rights reserved.</p>
  </div>
</footer>

<style>
.footer {
  border-top: 1px solid var(--gray-200);
  padding: 40px 0; margin-top: 80px;
}
.footer .container { text-align: center; }
.footer-brand { font-size: 18px; font-weight: 700; letter-spacing: 4px; margin-bottom: 8px; }
.footer-copy { font-size: 12px; color: var(--gray-400); }
</style>
```

- [ ] **Step 4: Create `src/layouts/Layout.astro`**

```astro
---
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props { title: string; }
const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | QUAN</title>
  </head>
  <body>
    <Nav />
    <main><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add src/styles/ src/layouts/ src/components/
git commit -m "feat: add global layout, nav, and footer"
```

---

## Task 4: Cart store (TDD)

**Files:**
- Create: `src/stores/cart.test.ts`
- Create: `src/stores/cart.ts`

- [ ] **Step 1: Write failing tests in `src/stores/cart.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './cart'`

- [ ] **Step 3: Implement `src/stores/cart.ts`**

```ts
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
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/
git commit -m "feat: add cart store with localStorage persistence (TDD)"
```

---

## Task 5: Homepage

**Files:**
- Modify: `src/pages/index.astro` (replace placeholder)

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import products from '../data/products.json';
import { CATEGORIES } from '../types/product';

const featured = products.slice(0, 4);
---

<Layout title="首页">
  <section class="hero">
    <div class="hero-content">
      <p class="hero-season">2026 SUMMER</p>
      <h1 class="hero-title">SIMPLE MADE BETTER</h1>
      <a href="/products/tshirt" class="hero-btn">立即选购</a>
    </div>
  </section>

  <section class="container">
    <h2 class="section-title">品类</h2>
    <div class="category-grid">
      {Object.entries(CATEGORIES).map(([key, label]) => (
        <a href={`/products/${key}`} class="category-card">
          <div class="category-bg"></div>
          <span class="category-label">{label}</span>
        </a>
      ))}
    </div>
  </section>

  <section class="container">
    <h2 class="section-title">本周推荐</h2>
    <div class="featured-grid">
      {featured.map(product => (
        <a href={`/product/${product.id}`} class="featured-card">
          <div class="featured-img" style={`background: ${product.colors[0].hex}`}></div>
          <p class="featured-name">{product.name}</p>
          <p class="featured-price">¥{product.price}</p>
          <div class="featured-colors">
            {product.colors.map(c => (
              <span class="color-dot" style={`background: ${c.hex}; border: 1px solid ${c.hex === '#f5f5f5' || c.hex === '#F5F0E8' || c.hex === '#F9F6F0' ? '#ddd' : c.hex}`}></span>
            ))}
          </div>
        </a>
      ))}
    </div>
  </section>
</Layout>

<style>
.hero {
  background: var(--black); color: var(--white);
  height: 480px; display: flex; align-items: center; justify-content: center; text-align: center;
}
.hero-season { font-size: 12px; letter-spacing: 4px; margin-bottom: 16px; opacity: 0.7; }
.hero-title { font-size: 48px; font-weight: 700; letter-spacing: 6px; margin-bottom: 32px; }
.hero-btn {
  display: inline-block; padding: 14px 40px;
  border: 2px solid var(--white); color: var(--white); font-size: 14px; letter-spacing: 1px;
  transition: background 0.2s, color 0.2s;
}
.hero-btn:hover { background: var(--white); color: var(--black); }

.section-title {
  font-size: 13px; letter-spacing: 3px; text-transform: uppercase;
  margin: 60px 0 24px; padding-bottom: 12px; border-bottom: 2px solid var(--black);
}

.category-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.category-card { position: relative; aspect-ratio: 2/3; overflow: hidden; display: block; }
.category-bg { width: 100%; height: 100%; background: var(--gray-200); transition: transform 0.3s; }
.category-card:hover .category-bg { transform: scale(1.04); }
.category-label {
  position: absolute; bottom: 12px; left: 0; right: 0;
  text-align: center; font-size: 13px; font-weight: 600; letter-spacing: 1px;
}

.featured-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 60px; }
.featured-card { display: block; }
.featured-img { aspect-ratio: 3/4; margin-bottom: 12px; transition: opacity 0.2s; }
.featured-card:hover .featured-img { opacity: 0.85; }
.featured-name { font-size: 14px; margin-bottom: 4px; }
.featured-price { font-size: 14px; color: var(--gray-600); margin-bottom: 8px; }
.featured-colors { display: flex; gap: 6px; }
.color-dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
</style>
```

- [ ] **Step 2: Verify in dev server**

```bash
npm run dev
```

Open `http://localhost:4321`. Verify: black hero, 6 category cards, 4 featured products visible.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: add homepage with hero, category grid, and featured products"
```

---

## Task 6: ProductCard component + category listing page

**Files:**
- Create: `src/components/ProductCard.astro`
- Create: `src/pages/products/[category].astro`

- [ ] **Step 1: Create `src/components/ProductCard.astro`**

```astro
---
import type { Product } from '../types/product';

interface Props { product: Product; }
const { product } = Astro.props;
const LIGHT = ['#f5f5f5','#f5f0e8','#f9f6f0','#ffffff','#fbcfe8','#bfdbfe','#bbf7d0','#fecaca','#e8dcc8'];
---

<a href={`/product/${product.id}`} class="product-card">
  <div class="product-img" style={`background: ${product.colors[0].hex}`}></div>
  <div class="product-info">
    <p class="product-name">{product.name}</p>
    <p class="product-price">¥{product.price}</p>
    <div class="product-colors">
      {product.colors.map(c => (
        <span
          class="color-dot"
          style={`background: ${c.hex}; border: 1px solid ${LIGHT.includes(c.hex.toLowerCase()) ? '#ddd' : c.hex}`}
          title={c.name}
        ></span>
      ))}
    </div>
  </div>
</a>

<style>
.product-card { display: block; }
.product-img { aspect-ratio: 3/4; margin-bottom: 12px; transition: opacity 0.2s; }
.product-card:hover .product-img { opacity: 0.85; }
.product-name { font-size: 14px; margin-bottom: 4px; }
.product-price { font-size: 14px; color: var(--gray-600); margin-bottom: 8px; }
.product-colors { display: flex; gap: 6px; }
.color-dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
</style>
```

- [ ] **Step 2: Create `src/pages/products/[category].astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import ProductCard from '../../components/ProductCard.astro';
import products from '../../data/products.json';
import { CATEGORIES, type CategoryKey } from '../../types/product';

export function getStaticPaths() {
  return Object.keys(CATEGORIES).map(category => ({ params: { category } }));
}

const { category } = Astro.params as { category: CategoryKey };
const label = CATEGORIES[category];
const categoryProducts = products.filter(p => p.category === category);
---

<Layout title={label}>
  <div class="container">
    <nav class="breadcrumb">
      <a href="/">首页</a><span>›</span><span>{label}</span>
    </nav>
    <h1 class="page-title">{label}</h1>
    <p class="product-count">{categoryProducts.length} 件商品</p>
    <div class="product-grid">
      {categoryProducts.map(product => <ProductCard product={product} />)}
    </div>
  </div>
</Layout>

<style>
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-400); margin: 24px 0 32px; }
.breadcrumb a:hover { color: var(--black); }
.page-title { font-size: 24px; font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; }
.product-count { font-size: 13px; color: var(--gray-400); margin-bottom: 32px; }
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px 16px; margin-bottom: 80px; }
</style>
```

- [ ] **Step 3: Verify in dev server**

Navigate to `http://localhost:4321/products/tshirt` — verify 2 products in grid. Try `/products/polo`, `/products/hoodie`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProductCard.astro src/pages/products/
git commit -m "feat: add category listing page and ProductCard component"
```

---

## Task 7: Product detail page

**Files:**
- Create: `src/pages/product/[id].astro`

- [ ] **Step 1: Create `src/pages/product/[id].astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import products from '../../data/products.json';
import { CATEGORIES, type CategoryKey } from '../../types/product';

export function getStaticPaths() {
  return products.map(product => ({ params: { id: product.id }, props: { product } }));
}

const { product } = Astro.props;
const label = CATEGORIES[product.category as CategoryKey];
---

<Layout title={product.name}>
  <div class="container">
    <nav class="breadcrumb">
      <a href="/">首页</a><span>›</span>
      <a href={`/products/${product.category}`}>{label}</a><span>›</span>
      <span>{product.name}</span>
    </nav>

    <div id="__product" data-json={JSON.stringify(product)} hidden></div>

    <div class="detail-layout">
      <div>
        <div id="main-image" class="main-img" style={`background: ${product.colors[0].hex}`}></div>
      </div>

      <div class="detail-info">
        <h1 class="detail-name">{product.name}</h1>
        <p class="detail-price">¥{product.price}</p>
        <p class="detail-desc">{product.description}</p>

        <div class="selector-group">
          <p class="selector-label">颜色：<span id="selected-color">{product.colors[0].name}</span></p>
          <div class="color-options">
            {product.colors.map((color, i) => (
              <button
                class={`color-btn${i === 0 ? ' selected' : ''}`}
                data-color={color.name}
                data-hex={color.hex}
                style={`background: ${color.hex}`}
                title={color.name}
              ></button>
            ))}
          </div>
        </div>

        <div class="selector-group">
          <p class="selector-label">尺码：<span id="selected-size">请选择</span></p>
          <div class="size-options">
            {product.sizes.map(size => (
              <button class="size-btn" data-size={size}>{size}</button>
            ))}
          </div>
        </div>

        <button id="add-to-cart" class="btn-primary" disabled>加入购物车</button>
        <p id="add-message" class="add-message"></p>
      </div>
    </div>
  </div>
</Layout>

<script>
  import { addToCart, getCart, getCartCount } from '../../stores/cart';

  const productEl = document.getElementById('__product') as HTMLElement;
  const product = JSON.parse(productEl.dataset.json!);

  let selectedColor = { name: product.colors[0].name, hex: product.colors[0].hex };
  let selectedSize: string | null = null;

  const mainImg = document.getElementById('main-image') as HTMLElement;
  const selectedColorEl = document.getElementById('selected-color') as HTMLElement;
  const selectedSizeEl = document.getElementById('selected-size') as HTMLElement;
  const addBtn = document.getElementById('add-to-cart') as HTMLButtonElement;
  const addMessage = document.getElementById('add-message') as HTMLElement;

  const LIGHT = ['#f5f5f5','#ffffff','#f5f0e8','#f9f6f0','#fbcfe8','#bfdbfe','#bbf7d0','#fecaca','#e8dcc8'];

  function refreshColorBtns() {
    document.querySelectorAll<HTMLButtonElement>('.color-btn').forEach(btn => {
      const hex = btn.dataset.hex!;
      btn.style.border = `1px solid ${LIGHT.includes(hex.toLowerCase()) ? '#ddd' : hex}`;
      btn.style.outline = btn.dataset.color === selectedColor.name ? '2px solid #1a1a1a' : 'none';
      btn.style.outlineOffset = '2px';
    });
  }

  refreshColorBtns();

  document.querySelectorAll<HTMLButtonElement>('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedColor = { name: btn.dataset.color!, hex: btn.dataset.hex! };
      selectedColorEl.textContent = selectedColor.name;
      mainImg.style.background = selectedColor.hex;
      refreshColorBtns();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.dataset.size!;
      selectedSizeEl.textContent = selectedSize;
      addBtn.disabled = false;
    });
  });

  addBtn.addEventListener('click', () => {
    addToCart({
      productId: product.id,
      name: product.name,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      size: selectedSize!,
      quantity: 1,
      price: product.price,
    });

    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = String(getCartCount(getCart()));

    addMessage.textContent = '✓ 已加入购物车';
    setTimeout(() => { addMessage.textContent = ''; }, 2000);
  });
</script>

<style>
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-400); margin: 24px 0 40px; }
.breadcrumb a:hover { color: var(--black); }
.detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 80px; }
.main-img { width: 100%; aspect-ratio: 3/4; }
.detail-name { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
.detail-price { font-size: 22px; margin-bottom: 16px; }
.detail-desc { font-size: 14px; color: var(--gray-600); line-height: 1.7; margin-bottom: 32px; }
.selector-group { margin-bottom: 24px; }
.selector-label { font-size: 13px; margin-bottom: 12px; }
.color-options { display: flex; gap: 10px; }
.color-btn { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; transition: transform 0.1s; }
.color-btn:hover { transform: scale(1.15); }
.size-options { display: flex; gap: 8px; flex-wrap: wrap; }
.size-btn { width: 48px; height: 48px; border: 1px solid var(--gray-200); font-size: 13px; transition: border-color 0.15s; }
.size-btn:hover { border-color: var(--black); }
.size-btn.selected { border: 2px solid var(--black); font-weight: 600; }
#add-to-cart:disabled { opacity: 0.4; cursor: not-allowed; }
#add-to-cart:disabled:hover { background: var(--black); color: var(--white); }
.add-message { font-size: 13px; color: var(--gray-600); margin-top: 12px; min-height: 20px; }
</style>
```

- [ ] **Step 2: Verify in dev server**

Open `http://localhost:4321/product/tshirt-001`. Verify: image area changes color when clicking color buttons, size buttons highlight on click, "加入购物车" enables after size is selected, cart badge updates after adding.

- [ ] **Step 3: Commit**

```bash
git add src/pages/product/
git commit -m "feat: add product detail page with color/size selection and cart"
```

---

## Task 8: Cart page

**Files:**
- Create: `src/pages/cart.astro`

- [ ] **Step 1: Create `src/pages/cart.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="购物车">
  <div class="container">
    <h1 class="page-title">购物车</h1>

    <div id="cart-empty" class="cart-empty" hidden>
      <p>购物车是空的</p>
      <a href="/" class="btn-secondary" style="display:inline-block;width:auto;padding:12px 32px;margin-top:16px">继续购物</a>
    </div>

    <div id="cart-content" hidden>
      <div class="cart-layout">
        <div id="cart-items"></div>
        <div class="cart-summary">
          <h2 class="summary-title">订单摘要</h2>
          <div class="summary-row"><span>商品合计</span><span id="cart-total">¥0</span></div>
          <div class="summary-row summary-grand"><span>应付金额</span><span id="cart-grand">¥0</span></div>
          <a href="/checkout" class="btn-primary" style="margin-top:20px">去结算</a>
        </div>
      </div>
    </div>
  </div>
</Layout>

<script>
  import { getCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } from '../stores/cart';

  function render() {
    const cart = getCart();
    const emptyEl = document.getElementById('cart-empty')!;
    const contentEl = document.getElementById('cart-content')!;
    const itemsEl = document.getElementById('cart-items')!;
    const totalEl = document.getElementById('cart-total')!;
    const grandEl = document.getElementById('cart-grand')!;
    const countEl = document.getElementById('cart-count');

    if (cart.length === 0) {
      emptyEl.hidden = false;
      contentEl.hidden = true;
      if (countEl) countEl.textContent = '0';
      return;
    }

    emptyEl.hidden = true;
    contentEl.hidden = false;

    const total = getCartTotal(cart);
    totalEl.textContent = `¥${total}`;
    grandEl.textContent = `¥${total}`;
    if (countEl) countEl.textContent = String(getCartCount(cart));

    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="item-img" style="background: ${item.colorHex}"></div>
        <div class="item-details">
          <p class="item-name">${item.name}</p>
          <p class="item-meta">${item.color} · ${item.size}</p>
          <p class="item-price">¥${item.price}</p>
        </div>
        <div class="item-actions">
          <div class="qty-control">
            <button class="qty-btn" data-action="minus" data-id="${item.productId}" data-color="${item.color}" data-size="${item.size}" data-qty="${item.quantity}">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" data-action="plus" data-id="${item.productId}" data-color="${item.color}" data-size="${item.size}" data-qty="${item.quantity}">+</button>
          </div>
          <button class="remove-btn" data-id="${item.productId}" data-color="${item.color}" data-size="${item.size}">移除</button>
        </div>
      </div>
    `).join('');

    itemsEl.querySelectorAll<HTMLButtonElement>('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qty = parseInt(btn.dataset.qty!) + (btn.dataset.action === 'plus' ? 1 : -1);
        if (qty <= 0) {
          removeFromCart(btn.dataset.id!, btn.dataset.color!, btn.dataset.size!);
        } else {
          updateQuantity(btn.dataset.id!, btn.dataset.color!, btn.dataset.size!, qty);
        }
        render();
      });
    });

    itemsEl.querySelectorAll<HTMLButtonElement>('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(btn.dataset.id!, btn.dataset.color!, btn.dataset.size!);
        render();
      });
    });
  }

  render();
</script>

<style>
.page-title { font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 32px 0; }
.cart-empty { text-align: center; padding: 80px 0; color: var(--gray-600); }
.cart-layout { display: grid; grid-template-columns: 1fr 320px; gap: 40px; align-items: start; margin-bottom: 80px; }
.cart-item { display: grid; grid-template-columns: 80px 1fr auto; gap: 16px; padding: 20px 0; border-bottom: 1px solid var(--gray-200); align-items: start; }
.item-img { width: 80px; height: 100px; }
.item-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.item-meta { font-size: 13px; color: var(--gray-400); margin-bottom: 8px; }
.item-price { font-size: 14px; }
.qty-control { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.qty-btn { width: 28px; height: 28px; border: 1px solid var(--gray-200); font-size: 16px; display: flex; align-items: center; justify-content: center; transition: border-color 0.15s; }
.qty-btn:hover { border-color: var(--black); }
.remove-btn { font-size: 12px; color: var(--gray-400); text-decoration: underline; }
.remove-btn:hover { color: var(--black); }
.cart-summary { border: 1px solid var(--gray-200); padding: 24px; }
.summary-title { font-size: 16px; font-weight: 700; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--gray-600); margin-bottom: 12px; }
.summary-grand { font-size: 16px; font-weight: 700; color: var(--black); border-top: 1px solid var(--gray-200); padding-top: 16px; margin-top: 4px; }
</style>
```

- [ ] **Step 2: Verify in dev server**

Add items from product detail, then go to `http://localhost:4321/cart`. Verify: items listed, quantity +/− works, remove works, empty state shows when all items removed.

- [ ] **Step 3: Commit**

```bash
git add src/pages/cart.astro
git commit -m "feat: add cart page with quantity controls and remove"
```

---

## Task 9: Checkout page

**Files:**
- Create: `src/pages/checkout.astro`

- [ ] **Step 1: Create `src/pages/checkout.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="结算">
  <div class="container">
    <h1 class="page-title">填写订单</h1>

    <div class="checkout-layout">
      <div>
        <h2 class="section-title">收货信息</h2>
        <form id="checkout-form">
          <div class="form-group">
            <label for="name">姓名 *</label>
            <input type="text" id="name" name="name" required placeholder="请输入收货人姓名" />
          </div>
          <div class="form-group">
            <label for="phone">手机号 *</label>
            <input type="tel" id="phone" name="phone" required placeholder="请输入11位手机号" pattern="[0-9]{11}" />
          </div>
          <div class="form-group">
            <label for="address">收货地址 *</label>
            <textarea id="address" name="address" required placeholder="省市区 + 详细地址" rows="3"></textarea>
          </div>

          <h2 class="section-title" style="margin-top:32px">支付方式</h2>
          <div class="payment-placeholder">
            <span>💳</span>
            <span>货到付款（Demo 占位）</span>
          </div>

          <button type="submit" id="submit-btn" class="btn-primary" style="margin-top:24px">提交订单</button>
          <p id="submit-error" class="submit-error"></p>
        </form>
      </div>

      <div class="order-summary">
        <h2 class="summary-title">订单摘要</h2>
        <div id="summary-items"></div>
        <div class="summary-divider"></div>
        <div class="summary-total-row">
          <span>应付金额</span>
          <span id="summary-total">¥0</span>
        </div>
      </div>
    </div>
  </div>
</Layout>

<script>
  import { getCart, getCartTotal, clearCart } from '../stores/cart';

  const cart = getCart();
  const total = getCartTotal(cart);

  const summaryItems = document.getElementById('summary-items')!;
  document.getElementById('summary-total')!.textContent = `¥${total}`;
  summaryItems.innerHTML = cart.map(item => `
    <div class="summary-item">
      <div>
        <p class="summary-item-name">${item.name}</p>
        <p class="summary-item-meta">${item.color} · ${item.size} × ${item.quantity}</p>
      </div>
      <p>¥${item.price * item.quantity}</p>
    </div>
  `).join('');

  const form = document.getElementById('checkout-form') as HTMLFormElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const submitError = document.getElementById('submit-error')!;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      submitError.textContent = '购物车为空，请先添加商品。';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    submitError.textContent = '';

    const data = new FormData(form);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: {
            name: data.get('name') as string,
            phone: data.get('phone') as string,
            address: data.get('address') as string,
          },
          items: cart,
        }),
      });

      if (!res.ok) throw new Error();
      const { orderId } = await res.json();
      clearCart();
      window.location.href = `/order/${orderId}`;
    } catch {
      submitError.textContent = '提交失败，请稍后重试。';
      submitBtn.disabled = false;
      submitBtn.textContent = '提交订单';
    }
  });
</script>

<style>
.page-title { font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 32px 0; }
.section-title { font-size: 15px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; }
.checkout-layout { display: grid; grid-template-columns: 1fr 360px; gap: 60px; align-items: start; margin-bottom: 80px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; margin-bottom: 6px; color: var(--gray-600); }
.form-group input,
.form-group textarea { width: 100%; padding: 12px; border: 1px solid var(--gray-200); font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.15s; resize: vertical; }
.form-group input:focus,
.form-group textarea:focus { border-color: var(--black); }
.payment-placeholder { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px solid var(--gray-200); font-size: 14px; }
.submit-error { font-size: 13px; color: #dc2626; margin-top: 12px; min-height: 20px; }
.order-summary { border: 1px solid var(--gray-200); padding: 24px; position: sticky; top: 72px; }
.summary-title { font-size: 16px; font-weight: 700; margin-bottom: 20px; }
.summary-item { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; font-size: 14px; }
.summary-item-name { margin-bottom: 2px; }
.summary-item-meta { font-size: 12px; color: var(--gray-400); }
.summary-divider { height: 1px; background: var(--gray-200); margin: 16px 0; }
.summary-total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; }
</style>
```

- [ ] **Step 2: Verify in dev server**

Go to `/checkout`. Verify: summary shows items from cart, form validation fires on empty fields, submit button changes to "提交中..." when clicked. (Submit will fail in local dev since KV isn't available — that's expected.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/checkout.astro
git commit -m "feat: add checkout page with contact form and payment placeholder"
```

---

## Task 10: Order API (CF Pages Functions)

**Files:**
- Create: `src/pages/api/order.ts`
- Create: `src/pages/api/order/[id].ts`

- [ ] **Step 1: Create `src/pages/api/order.ts`**

```ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as {
      contact: { name: string; phone: string; address: string };
      items: Array<{ productId: string; name: string; color: string; colorHex: string; size: string; quantity: number; price: number }>;
    };

    const { contact, items } = body;

    if (!contact?.name || !contact?.phone || !contact?.address || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: '请求参数不完整' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orderId = `ORD-${Date.now()}`;
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
      orderId,
      contact,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const kv = locals.runtime.env.QUAN_STORE;
    await kv.put(`order:${orderId}`, JSON.stringify(order), {
      expirationTtl: 60 * 60 * 24 * 90,
    });

    return new Response(JSON.stringify({ orderId, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2: Create `src/pages/api/order/[id].ts`**

```ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const kv = locals.runtime.env.QUAN_STORE;
    const raw = await kv.get(`order:${params.id}`);

    if (!raw) {
      return new Response(JSON.stringify({ error: '订单不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(raw, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 3: Verify build still succeeds**

```bash
npm run build
```

Expected: exit 0, `dist/` updated with `_worker.js`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/
git commit -m "feat: add order API endpoints (POST create, GET fetch) via CF Pages Functions"
```

---

## Task 11: Order confirmation page (SSR)

**Files:**
- Create: `src/pages/order/[id].astro`

- [ ] **Step 1: Create `src/pages/order/[id].astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';

export const prerender = false;

const { id } = Astro.params;
const kv = Astro.locals.runtime.env.QUAN_STORE;

let order: any = null;
let errorMsg = '';

try {
  const raw = await kv.get(`order:${id}`);
  if (raw) {
    order = JSON.parse(raw);
  } else {
    errorMsg = '订单不存在';
  }
} catch {
  errorMsg = '加载订单失败，请稍后重试。';
}
---

<Layout title={order ? `订单 ${order.orderId}` : '订单详情'}>
  <div class="container">
    {errorMsg ? (
      <div class="error-state">
        <p>{errorMsg}</p>
        <a href="/" class="btn-secondary" style="display:inline-block;width:auto;padding:12px 32px;margin-top:20px">返回首页</a>
      </div>
    ) : (
      <div class="confirmation">
        <div class="confirmation-header">
          <div class="check-icon">✓</div>
          <h1 class="confirmation-title">订单已提交</h1>
          <p class="order-id">订单号：{order.orderId}</p>
        </div>

        <div class="confirmation-layout">
          <div class="order-section">
            <h2 class="section-title">商品清单</h2>
            {order.items.map((item: any) => (
              <div class="order-item">
                <div class="item-img" style={`background: ${item.colorHex}`}></div>
                <div class="item-details">
                  <p class="item-name">{item.name}</p>
                  <p class="item-meta">{item.color} · {item.size} × {item.quantity}</p>
                </div>
                <p class="item-subtotal">¥{item.price * item.quantity}</p>
              </div>
            ))}
            <div class="order-total">
              <span>合计</span>
              <span class="total-amount">¥{order.total}</span>
            </div>
          </div>

          <div class="order-section">
            <h2 class="section-title">收货信息</h2>
            <div class="info-row"><span class="info-label">收货人</span><span>{order.contact.name}</span></div>
            <div class="info-row"><span class="info-label">手机号</span><span>{order.contact.phone}</span></div>
            <div class="info-row"><span class="info-label">收货地址</span><span>{order.contact.address}</span></div>
            <div class="info-row">
              <span class="info-label">下单时间</span>
              <span>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        </div>

        <div class="confirmation-footer">
          <a href="/" class="btn-primary" style="display:inline-block;width:auto;padding:14px 48px">继续购物</a>
        </div>
      </div>
    )}
  </div>
</Layout>

<style>
.error-state { text-align: center; padding: 80px 0; color: var(--gray-600); }
.confirmation { padding: 40px 0 80px; }
.confirmation-header { text-align: center; margin-bottom: 48px; }
.check-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--black); color: var(--white); font-size: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.confirmation-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.order-id { font-size: 14px; color: var(--gray-400); }
.confirmation-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 48px; }
.section-title { font-size: 15px; font-weight: 700; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 2px solid var(--black); margin-bottom: 20px; }
.order-item { display: grid; grid-template-columns: 60px 1fr auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--gray-200); }
.item-img { width: 60px; height: 75px; }
.item-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.item-meta { font-size: 12px; color: var(--gray-400); }
.item-subtotal { font-size: 14px; }
.order-total { display: flex; justify-content: space-between; padding: 16px 0; font-size: 15px; font-weight: 700; }
.info-row { display: flex; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--gray-200); font-size: 14px; }
.info-label { color: var(--gray-400); flex-shrink: 0; width: 80px; }
.confirmation-footer { text-align: center; }
</style>
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/pages/order/
git commit -m "feat: add SSR order confirmation page reading from CF KV"
```

---

## Task 12: CF Pages deployment setup

This task involves manual steps in the Cloudflare dashboard. No code changes.

- [ ] **Step 1: Push all commits to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Create KV namespace in CF dashboard**

1. Go to Cloudflare dashboard → **Workers & Pages** → **KV**
2. Click **Create namespace**, name it `QUAN_STORE`
3. Copy the namespace ID for reference

- [ ] **Step 3: Connect GitHub repo to CF Pages**

1. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `quan-demo` repository, branch `main`
3. Framework preset: **Astro**
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Click **Save and Deploy** — first deploy will run

- [ ] **Step 4: Bind KV namespace to Pages project**

1. Go to the Pages project → **Settings** → **Functions**
2. Under **KV namespace bindings**, click **Add binding**
3. Variable name: `QUAN_STORE`
4. Select the `QUAN_STORE` namespace created in Step 2
5. Click **Save**
6. Trigger a new deployment: go to **Deployments** → **Retry deployment** (or push a new commit)

- [ ] **Step 5: Verify full order flow on deployed site**

1. Browse to a product → select color + size → 加入购物车
2. Go to `/cart` → verify item appears
3. Go to `/checkout` → fill in name, phone, address → 提交订单
4. Verify redirect to `/order/ORD-{timestamp}` → order details displayed correctly

---

## Update CLAUDE.md

After Task 1 completes, update `CLAUDE.md` to add the real commands:

```markdown
## Commands

- `npm run dev` — start local dev server at http://localhost:4321
- `npm run build` — build for production (output: `dist/`)
- `npm test` — run unit tests (vitest)
- `npm run test:watch` — run tests in watch mode

## Architecture

Astro hybrid site deployed to Cloudflare Pages via GitHub integration. Product pages are prerendered at build time from `src/data/products.json`. Cart state is in `localStorage`. Order submission hits `/api/order` (CF Pages Function) which writes to CF KV namespace `QUAN_STORE`. The order confirmation page (`/order/[id]`) is SSR, reading from KV at request time.

## CF Pages local dev note

API routes (`/api/order`) require CF KV which is not available in local dev. The UI and all prerendered pages work fully at `npm run dev`. Test the full order flow after deploying to CF Pages.
```
