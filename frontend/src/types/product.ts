export type Product = {
  id: number;
  name: string;
  description: string;
  category: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
