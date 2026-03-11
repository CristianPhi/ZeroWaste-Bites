export interface Store {
  id: string
  name: string
  avatar: string
  address: string
  closingTime: string
  distance: string
  rating: number
  verified: boolean
}

export interface DealPost {
  id: string
  store: Store
  image: string
  itemName: string
  description: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  quantity: number
  expiresAt: string
  postedAgo: string
  category: string
  claimed: number
}

export const stores: Store[] = [
  {
    id: "holland-bakery",
    name: "Holland Bakery",
    avatar: "/images/store-2.jpg",
    address: "Jl. Salemba No. 15, Jakarta Pusat",
    closingTime: "21:30",
    distance: "1.2 km",
    rating: 4.8,
    verified: true,
  },
  {
    id: "warung-ibu-sari",
    name: "Warung Ibu Sari",
    avatar: "/images/store-1.jpg",
    address: "Jl. Margonda Raya No. 42, Depok",
    closingTime: "22:00",
    distance: "0.8 km",
    rating: 4.7,
    verified: false,
  },
]

export const dealPosts: DealPost[] = [
  {
    id: "deal-1",
    store: stores[0],
    image: "/images/bakery.jpg",
    itemName: "Roti Cokelat Keju",
    description: "Fresh from this morning, best before tomorrow. Still soft and delicious! Buy before we close tonight.",
    originalPrice: 15000,
    discountedPrice: 7500,
    discountPercent: 50,
    quantity: 8,
    expiresAt: "Tomorrow, 6 AM",
    postedAgo: "15 min ago",
    category: "Bakery",
    claimed: 3,
  },
  {
    id: "deal-2",
    store: stores[1],
    image: "/images/nasi-goreng.jpg",
    itemName: "Nasi Goreng Spesial",
    description: "Our signature nasi goreng, made fresh today. Grab it before closing! Perfect for a late night meal.",
    originalPrice: 25000,
    discountedPrice: 12500,
    discountPercent: 50,
    quantity: 3,
    expiresAt: "Tonight, 10 PM",
    postedAgo: "32 min ago",
    category: "Meals",
    claimed: 1,
  },
  {
    id: "deal-3",
    store: stores[0],
    image: "/images/martabak.jpg",
    itemName: "Martabak Manis Cokelat",
    description: "Half a box of our best-selling martabak. Still warm and gooey! Perfect for a sweet treat tonight.",
    originalPrice: 40000,
    discountedPrice: 18000,
    discountPercent: 55,
    quantity: 2,
    expiresAt: "Tomorrow, 8 AM",
    postedAgo: "1 hr ago",
    category: "Snacks",
    claimed: 0,
  },
  {
    id: "deal-4",
    store: stores[1],
    image: "/images/sate.jpg",
    itemName: "Sate Ayam (10 tusuk)",
    description: "Freshly grilled chicken satay with peanut sauce. Last batch of the day, hurry up!",
    originalPrice: 30000,
    discountedPrice: 15000,
    discountPercent: 50,
    quantity: 4,
    expiresAt: "Tonight, 10 PM",
    postedAgo: "1 hr ago",
    category: "Meals",
    claimed: 2,
  },
  {
    id: "deal-5",
    store: stores[1],
    image: "/images/rendang.jpg",
    itemName: "Rendang Sapi",
    description: "Slow-cooked beef rendang, made today. Perfect with steamed rice. Only a few portions left!",
    originalPrice: 35000,
    discountedPrice: 17500,
    discountPercent: 50,
    quantity: 2,
    expiresAt: "Tomorrow morning",
    postedAgo: "2 hrs ago",
    category: "Meals",
    claimed: 1,
  },
  {
    id: "deal-6",
    store: stores[0],
    image: "/images/juices.jpg",
    itemName: "Assorted Fresh Juices",
    description: "Freshly squeezed fruit juices - mango, guava, and avocado. Made today, best consumed tonight.",
    originalPrice: 18000,
    discountedPrice: 8000,
    discountPercent: 56,
    quantity: 6,
    expiresAt: "Tonight, 9:30 PM",
    postedAgo: "3 hrs ago",
    category: "Drinks",
    claimed: 4,
  },
]

export function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min} min ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export interface ApiDeal {
  _id?: string
  id: string
  ownerEmail: string
  ownerUsername?: string
  storeName: string
  storeAvatar?: string
  storeAddress?: string
  storeClosingTime?: string
  storeRating?: number
  storeVerified?: boolean
  itemName: string
  image: string
  description?: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  quantity: number
  expiresAt: string
  category: string
  status: string
  claimed: number
  createdAt: string
}

export interface ApiStore {
  id: string
  name: string
  avatar: string
  address: string
  closingTime: string
  distance: string
  rating: number
  verified: boolean
  dealCount?: number
}

export interface ApiOrder {
  _id?: string
  id: string
  userEmail: string
  dealId: string
  dealName: string
  storeName: string
  storeAvatar?: string
  storeAddress?: string
  image: string
  pricePaid: number
  pickupBefore: string
  status: "Pickup Ready" | "Completed" | "Cancelled"
  claimedAt: string
}

export function apiDealToDealPost(deal: ApiDeal): DealPost {
  const storeId =
    deal.ownerUsername ||
    deal.ownerEmail
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
  return {
    id: deal.id,
    store: {
      id: storeId,
      name: deal.storeName,
      avatar: deal.storeAvatar || "/images/store-1.jpg",
      address: deal.storeAddress || "",
      closingTime: deal.storeClosingTime || "",
      distance: "",
      rating: deal.storeRating ?? 4.5,
      verified: deal.storeVerified ?? false,
    },
    image: deal.image,
    itemName: deal.itemName,
    description: deal.description || "",
    originalPrice: deal.originalPrice,
    discountedPrice: deal.discountedPrice,
    discountPercent: deal.discountPercent,
    quantity: deal.quantity,
    expiresAt: deal.expiresAt,
    postedAgo: timeAgo(deal.createdAt),
    category: deal.category,
    claimed: deal.claimed,
  }
}
