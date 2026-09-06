import type { Creative } from "./creative";

/**
 * The five products Zylo actually sells.
 *
 * Everything else in the catalog is sourced sample data — good for building a
 * storefront against, not something anyone can buy. These are real, they are
 * the ones with designed posters, and they are why the home page opens with a
 * section of its own rather than mixing them into a rail of demo phones.
 *
 * The copy here is transcribed from the posters rather than rewritten, so the
 * page and the image cannot drift apart. Specifications come from the source
 * listings.
 *
 * PRICES ARE PLACEHOLDERS. Only one real figure was available (the top lists
 * at ₹349 on the source), so the rest are round retail guesses at a 50% strike
 * — set them properly before this is anything but a demo. `price` is stored in
 * the same notional dollars as the rest of the table and multiplied by 84 for
 * display, so the INR figure each one produces is written beside it.
 */

export interface VerifiedProduct {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly brand: string;
  /** Notional dollars; ×84 is what a shopper sees. */
  readonly price: number;
  readonly discountPercentage: number;
  readonly rating: number;
  readonly stock: number;
  readonly thumbnail: string;
  readonly images: readonly string[];
  readonly tags: readonly string[];
  readonly warrantyInformation: string;
  readonly shippingInformation: string;
  readonly returnPolicy: string;
  readonly availabilityStatus: string;
  readonly creative: Creative;
}

const inr = (rupees: number) => rupees / 84;

export const VERIFIED: readonly VerifiedProduct[] = [
  {
    id: 901,
    title: "12 Pairs Earring Set — Everyday Elegance",
    description:
      "Twelve pairs of gold-plated studs and hoops on one card, one for every month: pearl, crystal, clover, heart, sunburst. Lightweight alloy with a skin-friendly finish, made to be mixed rather than matched.",
    category: "womens-jewellery",
    brand: "Zylo",
    price: inr(499), // ₹499
    discountPercentage: 50,
    rating: 4.3,
    stock: 60,
    thumbnail: "/verified/earring-set-12-pairs.jpg",
    images: ["/verified/earring-set-12-pairs.jpg"],
    tags: ["earrings", "studs", "gold plated", "gift"],
    warrantyInformation: "No warranty — replacement on damage in transit",
    shippingInformation: "Ships in 1–2 business days",
    returnPolicy: "7 day return policy",
    availabilityStatus: "In Stock",
    creative: {
      kicker: "Mix. Match. Shine.",
      headline: ["12 PAIRS", "EARRING SET"],
      tagline: "Everyday Elegance",
      accent: "#9A7B4F",
      ground: "light",
      features: [
        { icon: "Gem", label: "Trendy designs" },
        { icon: "Feather", label: "Lightweight & comfortable" },
        { icon: "ShieldCheck", label: "Skin friendly material" },
        { icon: "Gift", label: "Perfect for every occasion" },
      ],
      perfectFor: [
        { icon: "Sparkles", label: "Stylish look" },
        { icon: "Link", label: "Durable & long lasting" },
        { icon: "Clock", label: "Easy to wear all day" },
        { icon: "Heart", label: "Made for you" },
      ],
    },
  },
  {
    id: 902,
    title: "Cold-Shoulder Pom-Pom Top — Brown",
    description:
      "A short crepe kurti with a notch neck, cold shoulders and a laced back, finished with pom-pom trim along the sleeves and hem. Above-knee length, cut to fall over wide-leg denim.",
    category: "tops",
    brand: "Zylo",
    price: inr(599), // ₹599
    discountPercentage: 50,
    rating: 3.7,
    stock: 45,
    thumbnail: "/verified/pom-pom-top-front.jpg",
    images: ["/verified/pom-pom-top-front.jpg", "/verified/pom-pom-top-back.jpg"],
    tags: ["top", "kurti", "crepe", "pom-pom", "cold shoulder"],
    warrantyInformation: "No warranty",
    shippingInformation: "Ships in 1–2 business days",
    returnPolicy: "7 day return policy",
    availabilityStatus: "In Stock",
    creative: {
      headline: ["STYLISH.", "TRENDY.", "EFFORTLESS."],
      tagline: "Everyday Style, Elevated",
      accent: "#6B4429",
      ground: "light",
      features: [
        { icon: "Feather", label: "Lightweight & breathable" },
        { icon: "Shirt", label: "Stylish & trendy design" },
        { icon: "Grid3x3", label: "Soft & durable fabric" },
        { icon: "ShieldCheck", label: "Comfortable all day" },
      ],
      perfectFor: [
        { icon: "Users", label: "Flattering fit" },
        { icon: "Sparkles", label: "Easy to style" },
        { icon: "Clock", label: "Made for everyday" },
      ],
    },
  },
  {
    id: 903,
    title: "Gojo Satoru Oversized Tee — Slate Blue",
    description:
      "A premium cotton-blend oversized tee with a full-back Gojo Satoru print and a small chest mark on the front. Unisex cut, dropped shoulders, built to hold its print through the wash.",
    category: "mens-shirts",
    brand: "Zylo",
    price: inr(699), // ₹699
    discountPercentage: 50,
    rating: 4.4,
    stock: 70,
    thumbnail: "/verified/gojo-tee-front.jpg",
    images: ["/verified/gojo-tee-front.jpg", "/verified/gojo-tee-back.jpg"],
    tags: ["t-shirt", "oversized", "anime", "unisex", "printed"],
    warrantyInformation: "No warranty",
    shippingInformation: "Ships in 1–2 business days",
    returnPolicy: "7 day return policy",
    availabilityStatus: "In Stock",
    creative: {
      headline: ["BOLD.", "ICONIC.", "UNSTOPPABLE."],
      tagline: "Make a statement without saying a word.",
      accent: "#5B87B5",
      ground: "light",
      features: [
        { icon: "Cloud", label: "Premium cotton blend" },
        { icon: "Feather", label: "Soft & comfortable" },
        { icon: "Shirt", label: "Oversized fit" },
        { icon: "Palette", label: "Bold & durable print" },
        { icon: "Users", label: "Unisex style" },
      ],
      perfectFor: [
        { icon: "Shirt", label: "Daily wear" },
        { icon: "Armchair", label: "Hangouts" },
        { icon: "Camera", label: "Street style" },
      ],
    },
  },
  {
    id: 904,
    title: "SunSwitch Vitamin C + E Sunscreen SPF 50",
    description:
      "A silky, matte-finish sunscreen with niacinamide and vitamin C — broad-spectrum SPF 50 PA+++ that absorbs fast and leaves no white cast. Sheer natural tint, 60ml.",
    category: "skin-care",
    brand: "SunSwitch",
    price: inr(449), // ₹449
    discountPercentage: 50,
    rating: 4.5,
    stock: 80,
    thumbnail: "/verified/sunswitch-spf50.jpg",
    images: ["/verified/sunswitch-spf50.jpg"],
    tags: ["sunscreen", "spf 50", "vitamin c", "niacinamide", "skincare"],
    warrantyInformation: "Use within 12 months of opening",
    shippingInformation: "Ships in 1–2 business days",
    returnPolicy: "Sealed returns only, 7 days",
    availabilityStatus: "In Stock",
    creative: {
      kicker: "Shield. Brighten. Protect.",
      headline: ["VITAMIN C + E", "SUNSCREEN"],
      tagline: "Your daily defense against sun damage & dullness.",
      accent: "#E2A312",
      ground: "light",
      seal: "SPF 50 PA+++",
      features: [
        { icon: "Citrus", label: "Vitamin C + E", note: "Brightens skin & fights free radicals" },
        { icon: "ShieldCheck", label: "SPF 50 PA+++", note: "Protects from harmful UVA & UVB rays" },
        { icon: "Droplet", label: "Niacinamide", note: "Strengthens the skin barrier" },
        { icon: "Leaf", label: "Lightweight & non-greasy", note: "Absorbs quickly, no white cast" },
      ],
      perfectFor: [
        { icon: "Sun", label: "Daily protection" },
        { icon: "Sparkles", label: "Brighter skin" },
        { icon: "Leaf", label: "All skin types" },
        { icon: "Droplet", label: "Dermatologically tested" },
      ],
    },
  },
  {
    id: 905,
    title: "6-Piece Kitchen Knife Set — Black",
    description:
      "Three black-coated stainless knives with matching covers: a 29.5cm utility, a 29cm cleaver and a 23.5cm paring knife. Corrosion-resistant blades and dimpled ergonomic handles.",
    category: "kitchen-accessories",
    brand: "Zylo",
    price: inr(899), // ₹899
    discountPercentage: 50,
    rating: 4.2,
    stock: 40,
    thumbnail: "/verified/knife-set-6-piece.jpg",
    images: ["/verified/knife-set-6-piece.jpg", "/verified/knife-set-specs.jpg"],
    tags: ["knife set", "kitchen", "stainless steel", "gift"],
    warrantyInformation: "6 month warranty against manufacturing defects",
    shippingInformation: "Ships in 2–3 business days",
    returnPolicy: "7 day return policy",
    availabilityStatus: "In Stock",
    creative: {
      headline: ["SHARPEN YOUR", "EVERYDAY"],
      tagline: "Premium knife set for effortless cutting.",
      accent: "#C9A227",
      ground: "dark",
      seal: "6 PIECE SET",
      features: [
        { icon: "Utensils", label: "Precision sharp blades", note: "Effortless cutting every time" },
        { icon: "ShieldCheck", label: "Durable & rust resistant", note: "Long-lasting performance" },
        { icon: "Hand", label: "Ergonomic handles", note: "Comfortable grip for safe use" },
        { icon: "Droplet", label: "Easy to clean", note: "Hassle-free maintenance" },
      ],
      perfectFor: [
        { icon: "Leaf", label: "Food grade material" },
        { icon: "ShieldCheck", label: "Safe & reliable" },
        { icon: "Gift", label: "Perfect gift choice" },
        { icon: "Gem", label: "Stylish & modern" },
      ],
    },
  },
];
