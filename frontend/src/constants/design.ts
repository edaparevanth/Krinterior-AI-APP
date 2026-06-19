export const ROOM_TYPES = [
  {
    id: "Living Room",
    label: "Living Room",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=70",
  },
  {
    id: "Bedroom",
    label: "Bedroom",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=70",
  },
  {
    id: "Kitchen",
    label: "Kitchen",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=70",
  },
  {
    id: "Dining Room",
    label: "Dining Room",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=70",
  },
  {
    id: "Study Room",
    label: "Study Room",
    image: "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=800&q=70",
  },
  {
    id: "Office Room",
    label: "Office Room",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70",
  },
  {
    id: "Kids Room",
    label: "Kids Room",
    image: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=800&q=70",
  },
  {
    id: "Guest Room",
    label: "Guest Room",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=70",
  },
  {
    id: "Home Theater",
    label: "Home Theater",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=70",
  },
  {
    id: "Balcony",
    label: "Balcony",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=70",
  },
  {
    id: "Hall",
    label: "Hall",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=70",
  },
];

export const BUDGET_PRESETS = [
  { value: 50000, label: "₹50K" },
  { value: 100000, label: "₹1L" },
  { value: 200000, label: "₹2L" },
  { value: 500000, label: "₹5L" },
  { value: 1000000, label: "₹10L+" },
];

export const PALETTES = [
  { id: "Modern White", swatch: ["#FFFFFF", "#F1F1F4", "#D9DBE3"] },
  { id: "Warm Beige", swatch: ["#F5E6D3", "#D9B996", "#A88062"] },
  { id: "Luxury Gold", swatch: ["#F8E5B0", "#D4AF37", "#8C6A1F"] },
  { id: "Earthy Brown", swatch: ["#D8B58E", "#8C5A3B", "#5A3825"] },
  { id: "Royal Blue", swatch: ["#C7D4F2", "#3F5BD9", "#1A2B6B"] },
  { id: "Forest Green", swatch: ["#CDE3CD", "#3F7A4A", "#1F3A23"] },
  { id: "Minimal Grey", swatch: ["#EDEDF0", "#9A9AA3", "#3E3E45"] },
];

export const DESIGN_IDEAS = [
  {
    id: "modern-indian",
    title: "Modern Indian Homes",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=70",
  },
  {
    id: "luxury-villa",
    title: "Luxury Indian Villas",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=70",
  },
  {
    id: "traditional",
    title: "Traditional Wood",
    image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=70",
  },
  {
    id: "urban-apt",
    title: "Urban Apartments",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=70",
  },
  {
    id: "minimal",
    title: "Minimal Scandinavian",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=70",
  },
  {
    id: "boho",
    title: "Boho Eclectic",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=70",
  },
];

export function formatINR(n: number): string {
  if (n == null || isNaN(n)) return "₹0";
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return `₹${formatted}`;
}

export function formatINRShort(n: number): string {
  if (n == null || isNaN(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}
