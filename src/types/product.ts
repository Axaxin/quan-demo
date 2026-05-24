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
