/* Default storefront content. Everything here can be changed from Admin → Site content;
   the database only stores what the admin edits, and these values fill in the rest.
   Text in [BRACKETS] is a placeholder you should replace from the admin. */

export const SITE_DEFAULTS = {
  store: {
    name: "Tele Cart",
    whatsapp: "",
    phone: "",
    email: "",
    address: "",
    hours: "",
    facebook: "https://www.facebook.com/telecart.com.pk/",
    instagram: "https://www.instagram.com/telecart_official/",
    utilityText: "Delivery across Pakistan",
    priceNote: "All prices in PKR and subject to change daily",
  },

  theme: {
    accent: "#c5e813",
    customCursor: true,
  },

  header: {
    links: [
      { label: "Home", to: "/" },
      { label: "Mobiles", to: "/products?category=mobile-phones" },
      { label: "Accessories", to: "/products" },
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
    ctaLabel: "Order on WhatsApp",
  },

  // Your existing hero. Same text as before; edit it here without touching code.
  hero: {
    eyebrow: "Mobiles & accessories",
    titleLine1: "The right phone,",
    titleLine2: "at the right price.",
    text: "Add what you want to the cart — your order goes straight to our WhatsApp and we confirm it with you.",
    primaryLabel: "Shop now →",
    primaryLink: "/products",
    secondaryLabel: "Explore more",
    secondaryLink: "#cat",
    features: [
      { icon: "✔", label: "100% Original" },
      { icon: "🚚", label: "Free shipping $50+" },
      { icon: "↩", label: "7-day returns" },
      { icon: "🔒", label: "Secure payment" },
    ],
    showBadge: true,
    badgeTop: "UP TO",
    badgeValue: "25%",
    badgeBottom: "OFF",
  },

  home: {
    ticker: ["Original and sealed phones", "Delivery across Pakistan", "Order on WhatsApp", "Genuine chargers and cables", "After-sales support"],
    categories: { show: true, eyebrow: "Shop by category", title: "Mobiles and accessories online", linkLabel: "All products", limit: 4 },
    popular: { show: true, eyebrow: "Most popular", title: "Best mobiles in Pakistan right now", limit: 8 },
    deals: {
      show: true,
      eyebrow: "Best deals",
      title: "Today's mobile",
      titleHighlight: "prices in Pakistan.",
      text: "Straight prices, no hidden extras. Rates move with the market, so message us on WhatsApp to lock today's price and check availability.",
      categorySlug: "mobile-phones",
      highlights: [],
      buttonLabel: "Get the price list on WhatsApp",
      tableTitle: "Mobile prices (PKR)",
    },
    why: {
      show: true,
      eyebrow: "Why Tele Cart",
      title: "Why choose us",
      cards: [
        { icon: "shield", title: "Genuine products", text: "Brand-new phones and genuine accessories. Every listing shows the exact storage, colour and SIM type.", linkLabel: "", linkTo: "" },
        { icon: "whatsapp", title: "Order on WhatsApp", text: "Build your cart, send it to us on WhatsApp, and we confirm price and stock with you directly.", linkLabel: "", linkTo: "" },
        { icon: "truck", title: "Delivery across Pakistan", text: "Doorstep delivery to cities across Pakistan. Delivery time and charges are confirmed on WhatsApp.", linkLabel: "Delivery and returns", linkTo: "/delivery-returns" },
        { icon: "headset", title: "After-sales support", text: "Questions about your phone, charger or order? Message us on WhatsApp and a real person replies.", linkLabel: "Contact us", linkTo: "/contact" },
      ],
    },
    seo: {
      show: true,
      blocks: [
        { heading: "Buy mobiles online in Pakistan at the best prices", body: "Tele Cart is an online mobile shop in Pakistan for people who want a genuine phone at a fair price without the guesswork. Every listing shows the PKR price, storage, colour and SIM type, so you can compare the best mobiles in Pakistan side by side and order in a few taps on WhatsApp." },
        { heading: "Best mobiles in Pakistan right now", body: "The iPhone 17 Pro Max is our top pick for the biggest screen and the most capable cameras, the iPhone 17 Pro gives you the same flagship power in a smaller size, and the iPhone 16 is the best value if you want a new iPhone for less. See every model in our [mobile phones](/products?category=mobile-phones) section." },
        { heading: "Latest mobile prices in Pakistan", body: "Mobile prices in Pakistan change with the dollar rate, which is why we keep our price list up to date and confirm the final price with you before dispatch." },
        { heading: "Mobile accessories online in Pakistan", body: "Complete your order with original accessories: fast chargers, original iPhone cables, USB-C cables and handsfree. Browse all [chargers, cables and handsfree](/products)." },
      ],
    },
  },

  shop: {
    eyebrow: "Shop",
    title: "Best mobiles in Pakistan",
    titleHighlight: "and accessories",
    intro: "Compare the latest mobile prices in Pakistan by storage, colour and SIM type. Every listing is brand new and you can order it on WhatsApp, with delivery across Pakistan.",
    seoBlocks: [
      { heading: "How to choose the best mobile in Pakistan for you", body: "Pick the storage you need first: 256GB suits most people, 512GB is for heavy video and big photo libraries. Then choose the SIM type: physical-SIM models work with any local SIM straight away, while eSIM models need an operator that supports eSIM." },
      { heading: "Buying safely", body: "Always check the SIM type, storage, colour and PTA status before you pay. We confirm these details on WhatsApp for every order. Read our [delivery and returns policy](/delivery-returns) for the details." },
    ],
  },

  about: {
    eyebrow: "About us",
    title: "About Tele Cart, your online mobile shop in Pakistan",
    intro: "Brand-new phones, genuine chargers and cables, honest PKR prices and a real person on WhatsApp.",
    storyTitle: "Why we started Tele Cart",
    story: "Buying a phone in Pakistan should not mean guessing. Prices change by the day, the same iPhone is sold as physical-SIM, eSIM and JV, and it is hard to know what you are really getting.\n\nTele Cart is built around the way people here actually shop: you see the price, you pick the exact storage, colour and SIM type, and you talk to us directly on WhatsApp. We confirm everything before your phone leaves our hands, then deliver it to your door.",
    stepsTitle: "How ordering works",
    steps: [
      { title: "Choose your phone", text: "Pick the model, storage, colour and SIM type. The PKR price is shown on every listing." },
      { title: "Send your cart on WhatsApp", text: "One tap sends your whole cart to us with your details." },
      { title: "We confirm everything", text: "We check stock, confirm the final price and agree delivery and payment with you." },
      { title: "Delivered to your door", text: "Your order is dispatched to your city. Questions after delivery? Message us again." },
    ],
    valuesTitle: "What we stand for",
    values: [
      { icon: "tag", title: "Honest prices", text: "Clear PKR prices for every variant. If the price moves, we tell you before you pay." },
      { icon: "shield", title: "Clear details", text: "Storage, colour, SIM type and PTA status are spelled out, so there are no surprises at delivery." },
      { icon: "whatsapp", title: "A real person", text: "No call-centre maze. You talk to us on WhatsApp before and after your order." },
    ],
    visitTitle: "Visit us or order from home",
    visitText: "Come and see the phones in person, or send your order on WhatsApp and we deliver across Pakistan.",
  },

  contact: {
    title: "Contact Tele Cart",
    intro: "Ask about today's prices, check availability or place an order. WhatsApp is the fastest way to reach us.",
    formTitle: "Send us a message",
    formText: "Fill this in and we open WhatsApp with your message ready to send.",
  },

  policies: {
    title: "Delivery, payment and returns",
    intro: "How your order reaches you, how you pay and what happens if something is wrong.",
    sections: [
      { title: "Order confirmation", body: "When you send your cart on WhatsApp we check stock and confirm the exact variant, the final PKR price and your delivery details. Nothing is dispatched until you have confirmed." },
      { title: "Delivery across Pakistan", body: "We deliver to cities across Pakistan. Delivery time and charges depend on your city and are confirmed on WhatsApp. Typical delivery time: [DELIVERY TIME]. Delivery charges: [DELIVERY CHARGES]." },
      { title: "Payment", body: "No payment is taken on the website. Payment is agreed with you on WhatsApp. Accepted methods: [PAYMENT METHODS]." },
      { title: "Checking your order on delivery", body: "Please check the box, model, storage, colour and SIM type against your order when it arrives. Open-box policy: [OPEN-BOX POLICY]." },
      { title: "Warranty", body: "Warranty depends on the product and is explained when you order. Phone warranty: [PHONE WARRANTY]. Accessory warranty: [ACCESSORY WARRANTY]." },
      { title: "Returns and exchanges", body: "If you receive the wrong item or a faulty product, message us on WhatsApp straight away with your order details and photos. Return window: [RETURN WINDOW]. Conditions: [RETURN CONDITIONS]." },
    ],
  },

  footer: {
    newsletterShow: true,
    newsletterEyebrow: "Daily prices",
    newsletterTitle: "Get new arrivals and today's prices",
    newsletterText: "Latest mobile prices in Pakistan and new accessories, straight to your inbox. No spam.",
    about: "Buy mobiles online in Pakistan. Original phones with genuine chargers, cables and handsfree, ordered on WhatsApp and delivered across Pakistan.",
    popularSearches: [
      { label: "Best mobiles in Pakistan", to: "/products?category=mobile-phones" },
      { label: "Buy mobile online in Pakistan", to: "/products" },
      { label: "iPhone 17 Pro Max price in Pakistan", to: "/products/iphone-17-pro-max" },
      { label: "iPhone 16 price in Pakistan", to: "/products/iphone-16" },
      { label: "Mobile accessories online in Pakistan", to: "/products" },
    ],
  },

  seo: {
    home: { title: "Buy Mobiles Online in Pakistan at Best Prices | {shop}", description: "Buy mobiles online in Pakistan at the best prices. Shop the best mobiles in Pakistan plus original chargers, cables and handsfree. Order on WhatsApp." },
    products: { title: "Best Mobiles in Pakistan | Latest Mobile Prices | {shop}", description: "Best mobiles in Pakistan with the latest prices by storage, colour and SIM type, plus mobile accessories. Buy mobile online in Pakistan and order on WhatsApp." },
    cart: { title: "Your cart | {shop}", description: "Review your cart and send your order to us on WhatsApp." },
    about: { title: "About {shop} | Online Mobile Shop in Pakistan", description: "{shop} sells brand-new phones and genuine chargers, cables and handsfree in Pakistan. See how ordering on WhatsApp works." },
    contact: { title: "Contact {shop} | Order on WhatsApp", description: "Contact {shop} on WhatsApp, Facebook or Instagram for mobile prices, availability and accessories." },
    policies: { title: "Delivery, Payment and Returns | {shop}", description: "How {shop} delivers mobiles and accessories across Pakistan, how payment works, and our warranty and returns policy." },
    productTitle: "{name} Price in Pakistan | {shop}",
    productDescription: "{name} price in Pakistan from {price}. {variants}. Buy online from {shop} and order on WhatsApp.",
  },
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Saved values win; arrays are replaced as a whole; missing keys fall back to defaults. */
export function mergeDeep(base, over) {
  if (!isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(base?.[k]) ? mergeDeep(base[k], v) : v;
  return out;
}

export const withDefaults = (saved = {}) => {
  const out = {};
  for (const k of Object.keys(SITE_DEFAULTS)) out[k] = mergeDeep(SITE_DEFAULTS[k], saved[k]);
  return out;
};
