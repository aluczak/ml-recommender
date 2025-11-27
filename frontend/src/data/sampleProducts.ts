export type SampleProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
};

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 1,
    name: "Aurora Desk Lamp",
    price: 59,
    category: "Lighting",
    image: "https://placehold.co/300x200?text=Lamp",
    description: "Minimalist LED desk lamp with touch brightness controls.",
  },
  {
    id: 2,
    name: "Nordic Lounge Chair",
    price: 320,
    category: "Furniture",
    image: "https://placehold.co/300x200?text=Chair",
    description: "Soft fabric lounge chair inspired by Scandinavian design.",
  },
  {
    id: 3,
    name: "Ceramic Pour Over Set",
    price: 75,
    category: "Kitchen",
    image: "https://placehold.co/300x200?text=Coffee",
    description: "Everything you need for a slow coffee ritual at home.",
  },
];
