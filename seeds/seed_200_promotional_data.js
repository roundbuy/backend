/**
 * Real-World Seeder: 200+ Listings with Promotional Badges, Showcases & HomeMarket Tiers
 * 
 * Includes:
 * - 25+ Realistic Users & Verified Business Accounts across UK, Finland, France, Germany, India
 * - 210+ Clean, Short-Titled Listings across ALL categories (Sell & Services)
 * - Curated High-Definition Unsplash CDN Photos
 * - Promotional Badges:
 *     * Showcase Groups (showcase_group_id: 4-6 products per group)
 *     * HomeMarket Tiers (Gold, Orange, Green)
 *     * Garage Sales Badges
 *     * Fast Ads, Highlights & Featured
 * - Linked Trending Galleries (Most Popular, Women's, Men's, Jeans, Sneakers, Vintage, Designer)
 * - Full Advertisement Locations for Map Search
 */

const { promisePool } = require('../src/config/database');
const bcrypt = require('bcrypt');

// Curated high-res Unsplash image pools by tag
const IMAGE_POOLS = {
  macbook: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  laptop: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
  iphone: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
  phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  ipad: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  lens: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
  smartwatch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  speaker: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
  tv: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
  gaming: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  drone: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',

  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  diningTable: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80',
  chair: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  coffeeTable: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80',
  lamp: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  rug: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
  plant: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
  mirror: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',

  watch: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  sneakers: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
  boots: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
  coat: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80',
  dress: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
  bag: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  sunglasses: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
  suit: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',

  vespa: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
  motorcycle: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
  bike: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  ebike: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80',
  helmet: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
  car: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',

  guitar: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=800&q=80',
  piano: 'https://images.unsplash.com/photo-1520523839898-50712825e617?auto=format&fit=crop&w=800&q=80',
  dj: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  tennis: 'https://images.unsplash.com/photo-1617083934555-563d4157173b?auto=format&fit=crop&w=800&q=80',
  camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80',
  skis: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80',

  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  plumbing: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80',
  electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  painting: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
  gardening: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
  carpentry: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  moving: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=800&q=80',
  techRepair: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
  photography: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=800&q=80',
  petCare: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
  carDetailing: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
  fitness: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  roofing: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=800&q=80',
  handyman: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
};

const USER_PRESETS = [
  // UK / London
  { name: 'Oliver Taylor', email: 'oliver.taylor@roundbuy.co.uk', role: 'subscriber', type: 'private', country: 'GBR', curr: 'GBP', city: 'London', street: '18 Victoria St, Westminster', lat: 51.4995, lng: -0.1332, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Charlotte Davies', email: 'charlotte.davies@roundbuy.co.uk', role: 'subscriber', type: 'private', country: 'GBR', curr: 'GBP', city: 'London', street: '42 Camden High St', lat: 51.5390, lng: -0.1426, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { name: 'William Clark', email: 'westminster.services@roundbuy.co.uk', role: 'subscriber', type: 'business', company: 'Westminster Home & Tech Services Ltd', vat: 'GB928371940', country: 'GBR', curr: 'GBP', city: 'London', street: '104 Kensington High St', lat: 51.5014, lng: -0.1918, avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80' },
  { name: 'George Evans', email: 'george.evans@roundbuy.co.uk', role: 'subscriber', type: 'private', country: 'GBR', curr: 'GBP', city: 'London', street: '88 Redchurch St, Shoreditch', lat: 51.5245, lng: -0.0763, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Emma Watson', email: 'emma.watson@roundbuy.co.uk', role: 'subscriber', type: 'private', country: 'GBR', curr: 'GBP', city: 'London', street: '14 Islington Green', lat: 51.5362, lng: -0.1030, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { name: 'James Richardson', email: 'london.antiques@roundbuy.co.uk', role: 'subscriber', type: 'business', company: 'Richmond Fine Art & Antiques Ltd', vat: 'GB827103948', country: 'GBR', curr: 'GBP', city: 'London', street: '25 Hill St, Richmond', lat: 51.4613, lng: -0.3037, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },

  // Finland / Helsinki & Espoo
  { name: 'Mikko Korhonen', email: 'mikko.korhonen@roundbuy.fi', role: 'subscriber', type: 'private', country: 'FIN', curr: 'EUR', city: 'Helsinki', street: 'Fredrikinkatu 34, Kamppi', lat: 60.1674, lng: 24.9351, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sofia Virtanen', email: 'sofia.virtanen@roundbuy.fi', role: 'subscriber', type: 'private', country: 'FIN', curr: 'EUR', city: 'Helsinki', street: 'Hämeentie 22, Kallio', lat: 60.1841, lng: 24.9602, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { name: 'Antti Nieminen', email: 'nordic.renovation@roundbuy.fi', role: 'subscriber', type: 'business', company: 'Nordic Clean & Craft Solutions Oy', vat: 'FI28472910', country: 'FIN', curr: 'EUR', city: 'Espoo', street: 'Tapiontori 3, Tapiola', lat: 60.1762, lng: 24.8055, avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
  { name: 'Juha Laine', email: 'juha.laine@roundbuy.fi', role: 'subscriber', type: 'private', country: 'FIN', curr: 'EUR', city: 'Helsinki', street: 'Mannerheimintie 102, Töölö', lat: 60.1882, lng: 24.9150, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Aino Mäkinen', email: 'aino.makinen@roundbuy.fi', role: 'subscriber', type: 'private', country: 'FIN', curr: 'EUR', city: 'Helsinki', street: 'Iso Roobertinkatu 14, Punavuori', lat: 60.1620, lng: 24.9405, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },

  // France / Paris & Lyon
  { name: 'Alexandre Dubois', email: 'alexandre.dubois@roundbuy.fr', role: 'subscriber', type: 'private', country: 'FRA', curr: 'EUR', city: 'Paris', street: 'Rue des Francs-Bourgeois, Le Marais', lat: 48.8575, lng: 2.3598, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Camille Laurent', email: 'atelier.paris@roundbuy.fr', role: 'subscriber', type: 'business', company: 'Atelier Artisanal Déco & Services Paris', vat: 'FR84920194821', country: 'FRA', curr: 'EUR', city: 'Paris', street: '15 Blvd Saint-Germain', lat: 48.8512, lng: 2.3489, avatar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Lucas Bernard', email: 'lucas.bernard@roundbuy.fr', role: 'subscriber', type: 'private', country: 'FRA', curr: 'EUR', city: 'Paris', street: 'Rue Lepic, Montmartre', lat: 48.8867, lng: 2.3333, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
  { name: 'Juliette Moreau', email: 'juliette.moreau@roundbuy.fr', role: 'subscriber', type: 'private', country: 'FRA', curr: 'EUR', city: 'Lyon', street: 'Place Bellecour, Presquîle', lat: 45.7578, lng: 4.8320, avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80' },

  // Germany / Berlin & Munich
  { name: 'Maximilian Schmidt', email: 'maximilian.schmidt@roundbuy.de', role: 'subscriber', type: 'private', country: 'DEU', curr: 'EUR', city: 'Berlin', street: 'Torstraße 140, Mitte', lat: 52.5298, lng: 13.3989, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80' },
  { name: 'Lukas Weber', email: 'muenchen.technik@roundbuy.de', role: 'subscriber', type: 'business', company: 'München Tech & Cycle Works GmbH', vat: 'DE391048291', country: 'DEU', curr: 'EUR', city: 'München', street: 'Leopoldstraße 82, Schwabing', lat: 48.1601, lng: 11.5861, avatar: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Hannah Fischer', email: 'hannah.fischer@roundbuy.de', role: 'subscriber', type: 'private', country: 'DEU', curr: 'EUR', city: 'Berlin', street: 'Kastanienallee 24, Prenzlauer Berg', lat: 52.5385, lng: 13.4098, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Felix Becker', email: 'felix.becker@roundbuy.de', role: 'subscriber', type: 'private', country: 'DEU', curr: 'EUR', city: 'Munich', street: 'Theresienstraße 40, Maxvorstadt', lat: 48.1492, lng: 11.5721, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },

  // India / Delhi, Mumbai, Bangalore
  { name: 'Aarav Sharma', email: 'aarav.sharma@roundbuy.in', role: 'subscriber', type: 'private', country: 'IND', curr: 'INR', city: 'New Delhi', street: 'E-14 Hauz Khas', lat: 28.5494, lng: 77.2001, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Priya Patel', email: 'priya.patel@roundbuy.in', role: 'subscriber', type: 'private', country: 'IND', curr: 'INR', city: 'Mumbai', street: 'Hill Road, Bandra West', lat: 19.0596, lng: 72.8295, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { name: 'Rohan Mehta', email: 'apex.solutions@roundbuy.in', role: 'subscriber', type: 'business', company: 'Apex Home & Digital Services Pvt Ltd', vat: 'GSTIN29ABCDE1234F1Z5', country: 'IND', curr: 'INR', city: 'Bengaluru', street: '100 Feet Rd, Indiranagar', lat: 12.9719, lng: 77.6412, avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
  { name: 'Ananya Gupta', email: 'ananya.gupta@roundbuy.in', role: 'subscriber', type: 'private', country: 'IND', curr: 'INR', city: 'Bengaluru', street: '80 Feet Rd, Koramangala 4th Block', lat: 12.9352, lng: 77.6245, avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80' },
  { name: 'Vikram Singh', email: 'vikram.singh@roundbuy.in', role: 'subscriber', type: 'private', country: 'IND', curr: 'INR', city: 'Mumbai', street: 'Juhu Tara Rd, Juhu', lat: 19.1025, lng: 72.8260, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
];

// Product Blueprints for clean generation across categories
const PRODUCT_TEMPLATES = [
  // Electronics & Tech (Cat 1 / Phones 19 / Computers 18 / Cameras 21 / Video Games 15)
  { title: 'MacBook Pro 16"', cat: 1, type: 'product', price: 2450, img: 'macbook', desc: 'Apple M3 Max chip with 36GB RAM and 1TB SSD in Space Black.' },
  { title: 'iPhone 15 Pro Max', cat: 19, type: 'product', price: 1150, img: 'iphone', desc: '256GB Natural Titanium, 100% battery health with box and receipt.' },
  { title: 'Sony Alpha A7 IV', cat: 21, type: 'product', price: 2100, img: 'camera', desc: 'Full-frame mirrorless camera with FE 24-70mm F2.8 GM lens.' },
  { title: 'B&O H95 Headphones', cat: 1, type: 'product', price: 580, img: 'headphones', desc: 'Flagship luxury ANC headphones with customized active noise cancelling.' },
  { title: 'Apple Watch Ultra 2', cat: 19, type: 'product', price: 650, img: 'smartwatch', desc: '49mm Titanium case with Ocean Band. GPS + Cellular.' },
  { title: 'PlayStation 5 Slim', cat: 15, type: 'product', price: 420, img: 'gaming', desc: '1TB Digital Edition console with DualSense wireless controller.' },
  { title: 'iPad Pro 12.9" M2', cat: 18, type: 'product', price: 890, img: 'ipad', desc: 'Liquid Retina XDR display, 256GB Wi-Fi in Space Gray.' },
  { title: 'Dell XPS 15 OLED', cat: 18, type: 'product', price: 1650, img: 'laptop', desc: 'Core i9, 32GB RAM, 1TB SSD, 4K OLED touch display.' },
  { title: 'Sony WH-1000XM5', cat: 1, type: 'product', price: 290, img: 'headphones', desc: 'Industry-leading noise canceling wireless headphones in Silver.' },
  { title: 'Canon EOS R6 Mark II', cat: 21, type: 'product', price: 1950, img: 'camera', desc: 'Full-frame 24.2MP mirrorless body, shutter count under 2,000.' },
  { title: 'DJI Mini 4 Pro Drone', cat: 1, type: 'product', price: 780, img: 'drone', desc: 'Fly More Combo with RC 2 controller and 3 batteries.' },
  { title: 'AirPods Max', cat: 1, type: 'product', price: 430, img: 'headphones', desc: 'Over-ear headphones in Space Gray with Smart Case.' },
  { title: 'Samsung Galaxy S24 Ultra', cat: 19, type: 'product', price: 1050, img: 'phone', desc: '512GB Titanium Gray with S-Pen, sealed in retail box.' },
  { title: 'LG C3 55" OLED TV', cat: 1, type: 'product', price: 980, img: 'tv', desc: '4K Smart OLED TV with 120Hz refresh rate and G-Sync support.' },
  { title: 'Keychron Q1 Pro Keyboard', cat: 18, type: 'product', price: 170, img: 'keyboard', desc: 'Custom mechanical wireless keyboard with Gateron Jupiter switches.' },
  { title: 'Sonos Move 2 Speaker', cat: 1, type: 'product', price: 340, img: 'speaker', desc: 'Portable smart battery speaker with stereo sound and Wi-Fi/Bluetooth.' },
  { title: 'Nintendo Switch OLED', cat: 15, type: 'product', price: 280, img: 'gaming', desc: 'White console with vibrant 7-inch OLED screen and dock.' },
  { title: 'Fujifilm X-T5 Body', cat: 21, type: 'product', price: 1450, img: 'camera', desc: '40MP APS-C mirrorless camera in classic Silver.' },
  { title: 'Sony 24-70mm GM II', cat: 21, type: 'product', price: 1750, img: 'lens', desc: 'F2.8 G-Master zoom lens with nano AR coating.' },
  { title: 'Bose QuietComfort Ultra', cat: 1, type: 'product', price: 260, img: 'earbuds', desc: 'Spatial audio noise canceling wireless earbuds in Black.' },

  // Furniture & Home Decor (Cat 3 / Furniture 14)
  { title: 'Scandinavian Sofa', cat: 14, type: 'product', price: 680, img: 'sofa', desc: 'Mid-century modern 3-seater in water-repellent emerald velvet.' },
  { title: 'Solid Oak Dining Table', cat: 14, type: 'product', price: 890, img: 'diningTable', desc: 'Handcrafted oak dining table (200x95cm) with black steel legs.' },
  { title: 'Velvet Lounge Armchair', cat: 14, type: 'product', price: 320, img: 'chair', desc: 'Ergonomic accent chair in mustard velvet with matte metal frame.' },
  { title: 'Marble Coffee Table', cat: 14, type: 'product', price: 280, img: 'coffeeTable', desc: 'Round Carrara white marble table with geometric brass frame.' },
  { title: 'Modern Floor Lamp', cat: 3, type: 'product', price: 140, img: 'lamp', desc: 'Brushed brass arc floor lamp with dimmable warm LED bulb.' },
  { title: 'Walnut Bed Frame King', cat: 14, type: 'product', price: 750, img: 'bed', desc: 'Solid American walnut king-size platform bed with slatted base.' },
  { title: 'Handwoven Wool Rug', cat: 14, type: 'product', price: 310, img: 'rug', desc: 'Nordic geometric wool rug (200x300cm), soft and durable.' },
  { title: 'Large Monstera Deliciosa', cat: 3, type: 'product', price: 65, img: 'plant', desc: 'Healthy 1.2m tall house plant in ceramic terracotta planter.' },
  { title: 'Arch Brass Floor Mirror', cat: 14, type: 'product', price: 220, img: 'mirror', desc: 'Full-length arched standing mirror (180x80cm) with gold frame.' },
  { title: 'Leather Office Chair', cat: 14, type: 'product', price: 340, img: 'chair', desc: 'Ergonomic executive desk chair in cognac Italian leather.' },
  { title: 'Solid Teak Sideboard', cat: 14, type: 'product', price: 620, img: 'coffeeTable', desc: 'Mid-century Danish teak credenza with sliding tambour doors.' },
  { title: 'Rattan Pendant Light', cat: 3, type: 'product', price: 95, img: 'lamp', desc: 'Hand-braided natural rattan ceiling chandelier for dining area.' },
  { title: 'Minimalist Nightstands (Pair)', cat: 14, type: 'product', price: 180, img: 'coffeeTable', desc: 'Set of 2 floating oak bedside tables with push-to-open drawer.' },
  { title: 'Velvet Ottoman Pouf', cat: 14, type: 'product', price: 85, img: 'chair', desc: 'Round plush velvet footstool in deep navy blue with brass base.' },

  // Fashion, Watches & Apparel (Cat 2 / Clothing 16 / Watches 439 / Bags 25)
  { title: 'Swiss Automatic Watch', cat: 439, type: 'product', price: 950, img: 'watch', desc: '42mm ceramic bezel chronograph with exhibition caseback.' },
  { title: 'Leather Biker Jacket', cat: 16, type: 'product', price: 240, img: 'jacket', desc: 'Lambskin leather motorcycle jacket in matte black, Size M.' },
  { title: 'Nike Air Jordan 1', cat: 16, type: 'product', price: 180, img: 'sneakers', desc: 'Retro High OG colorway, Size UK 9 / EU 44 with extra laces.' },
  { title: 'Classic Trench Coat', cat: 16, type: 'product', price: 320, img: 'coat', desc: 'Double-breasted cotton gabardine trench coat with storm flap.' },
  { title: 'Rolex Datejust 36', cat: 439, type: 'product', price: 6800, img: 'watch', desc: 'Stainless steel and white gold fluted bezel on Jubilee bracelet.' },
  { title: 'Leather Tote Bag', cat: 25, type: 'product', price: 210, img: 'bag', desc: 'Full-grain Italian calfskin tote in tan brown with brass zip.' },
  { title: 'Ray-Ban Wayfarer Classic', cat: 2, type: 'product', price: 110, img: 'sunglasses', desc: 'Original polarized black sunglasses with G-15 green lenses.' },
  { title: 'Chelsea Leather Boots', cat: 16, type: 'product', price: 195, img: 'boots', desc: 'Handcrafted Goodyear-welted leather ankle boots in dark chocolate.' },
  { title: 'Silk Evening Dress', cat: 16, type: 'product', price: 270, img: 'dress', desc: '100% mulberry silk slip maxi dress in champagne gold.' },
  { title: 'Levi’s 501 Original Jeans', cat: 16, type: 'product', price: 75, img: 'jeans', desc: 'Vintage straight-leg denim in dark indigo wash (W32 L32).' },
  { title: 'Wool Tailored Blazer', cat: 16, type: 'product', price: 260, img: 'suit', desc: 'Slim-fit houndstooth virgin wool jacket with horn buttons.' },
  { title: 'Cashmere Winter Scarf', cat: 2, type: 'product', price: 95, img: 'coat', desc: '100% pure Scottish cashmere scarf in classic check pattern.' },

  // Vehicles, Bikes & Motorcycles (Cat 4 / Cars & Motorbikes 10 / Bicycles 413)
  { title: 'Vespa Primavera 125cc', cat: 10, type: 'product', price: 3400, img: 'vespa', desc: '2023 ABS model in Grigio Materia, 3,200 km, indoor garaged.' },
  { title: 'Canyon Gravel Bike', cat: 413, type: 'product', price: 1850, img: 'bike', desc: 'Grizl CF SL 8 Carbon frame with Shimano GRX RX810 groupset.' },
  { title: 'VanMoof S3 Electric Bike', cat: 413, type: 'product', price: 1200, img: 'ebike', desc: 'Smart urban e-bike with automatic electronic gear shifting.' },
  { title: 'Brompton Folding Bike', cat: 413, type: 'product', price: 1100, img: 'bike', desc: 'C Line Explore 6-speed folding commuter bike in Racing Green.' },
  { title: 'Trek Domane SL 6 Road Bike', cat: 413, type: 'product', price: 2200, img: 'bike', desc: 'Endurance carbon road bike with Shimano 105 Di2 wireless shifting.' },
  { title: 'Ducati Scrambler Icon', cat: 10, type: 'product', price: 7200, img: 'motorcycle', desc: '803cc L-twin engine, 4,500 km, Termignoni exhaust system.' },
  { title: 'Arai Carbon Helmet', cat: 10, type: 'product', price: 420, img: 'helmet', desc: 'RX-7V carbon fiber full-face motorcycle helmet, Size Large.' },
  { title: 'Thule 3-Bike Car Rack', cat: 10, type: 'product', price: 310, img: 'car', desc: 'Towbar-mounted foldable cycle carrier with integrated tail lights.' },

  // Sports, Music & Hobbies (Cat 8 / Music 22 / Sports 32 / Collectibles 24)
  { title: 'Fender Stratocaster Guitar', cat: 22, type: 'product', price: 850, img: 'guitar', desc: 'American Performer in Sunburst with maple neck and gig bag.' },
  { title: 'Pioneer DJ Controller', cat: 22, type: 'product', price: 550, img: 'dj', desc: 'DDJ-FLX6 4-channel controller compatible with Rekordbox/Serato.' },
  { title: 'Wilson Tennis Racket', cat: 32, type: 'product', price: 160, img: 'tennis', desc: 'Pro Staff 97 v14 performance racket with Luxilon ALU strings.' },
  { title: 'Camping Dome Tent 4P', cat: 32, type: 'product', price: 190, img: 'camping', desc: 'MSR 4-person all-weather tent with 3000mm waterproof rainfly.' },
  { title: 'Yamaha Digital Piano P-125', cat: 22, type: 'product', price: 490, img: 'piano', desc: '88 weighted keys with GHS hammer action, stand, and sustain pedal.' },
  { title: 'Callaway Golf Club Set', cat: 32, type: 'product', price: 680, img: 'golf', desc: 'Strata 14-piece full set with titanium driver and stand bag.' },
  { title: 'Salomon All-Mountain Skis', cat: 32, type: 'product', price: 390, img: 'skis', desc: 'QST 92 freeride skis (176cm) with Warden 11 bindings.' },
  { title: 'Taylor GS Mini Acoustic', cat: 22, type: 'product', price: 520, img: 'guitar', desc: 'Solid Sitka spruce top travel acoustic guitar with hard case.' },

  // Services (Cat 6 - Flat / Hourly)
  { title: 'Home Deep Cleaning', cat: 6, sub: 'house-cleaning', type: 'service', price: 38, img: 'cleaning', desc: 'Eco-friendly residential & office deep cleaning with Nordic standards.' },
  { title: 'Emergency Plumbing', cat: 6, sub: 'plumbing-repairs', type: 'service', price: 85, img: 'plumbing', desc: 'Gas Safe registered emergency plumbers for boiler, leaks and drains.' },
  { title: 'Master Electrician', cat: 6, sub: 'electrical-services', type: 'service', price: 65, img: 'electrician', desc: 'Certified electrical contractors for rewiring, EV chargers and lighting.' },
  { title: 'Interior Painting', cat: 6, sub: 'painting-decorating', type: 'service', price: 55, img: 'painting', desc: 'Interior and exterior painting, plastering and wallpaper hanging.' },
  { title: 'Handyman & Assembly', cat: 6, sub: 'handyman-services', type: 'service', price: 45, img: 'handyman', desc: 'Furniture assembly, TV wall mounting, door locks and home repairs.' },
  { title: 'Garden & Lawn Care', cat: 6, sub: 'lawn-garden-care', type: 'service', price: 35, img: 'gardening', desc: 'Lawn mowing, hedge trimming, seasonal planting and patio washing.' },
  { title: 'Custom Wood Carpentry', cat: 6, sub: 'carpentry-furniture', type: 'service', price: 52, img: 'carpentry', desc: 'Bespoke shelving, built-in wardrobes, decking and timber fittings.' },
  { title: 'Movers & Van Transport', cat: 6, sub: 'moving-logistics', type: 'service', price: 90, img: 'moving', desc: 'Household relocation with protective packing and careful loading.' },
  { title: 'Mac & PC Tech Repair', cat: 6, sub: 'it-device-repair', type: 'service', price: 50, img: 'techRepair', desc: 'Hardware diagnosis, SSD/RAM upgrades, screen and data recovery.' },
  { title: 'Portrait Photography', cat: 6, sub: 'photography-videography', type: 'service', price: 120, img: 'photography', desc: 'Editorial portraits, corporate headshots, weddings and architecture.' },
  { title: 'Dog Walking & Sitting', cat: 6, sub: 'pet-care-walking', type: 'service', price: 22, img: 'petCare', desc: 'Daily 45-min dog walks and overnight loving pet sitting.' },
  { title: 'Mobile Car Detailing', cat: 6, sub: 'auto-detailing', type: 'service', price: 79, img: 'carDetailing', desc: 'Mobile auto wash, interior steam cleaning and ceramic coating.' },
  { title: 'Personal Yoga Coach', cat: 6, sub: 'fitness-yoga', type: 'service', price: 60, img: 'fitness', desc: '1-on-1 personalized yoga, posture correction and fitness sessions.' },
  { title: 'Roof & Gutter Repair', cat: 6, sub: 'roof-fixing', type: 'service', price: 75, img: 'roofing', desc: 'Tile replacement, leak prevention and vacuum gutter clearing.' }
];

async function seed200PromotionalData() {
  console.log('🚀 Seeding 200+ Listings with Promotional Badges & Showcases...');

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // =========================================================================
    // 1. Ensure Services Subcategories Exist
    // =========================================================================
    console.log('📦 1. Synchronizing Categories...');
    await connection.query(`
      INSERT INTO categories (id, name, slug, parent_id, icon, description, size_type, requires_size, is_active, sort_order)
      VALUES (6, 'Services', 'services', NULL, 'build', 'Professional and Home Services', 'none', 'not_applicable', 1, 6)
      ON DUPLICATE KEY UPDATE name = 'Services', is_active = 1
    `);

    const servicesSubcategories = [
      { name: 'House Cleaning & Maid Service', slug: 'house-cleaning', icon: 'cleaning_services' },
      { name: 'Plumbing & Heating Services', slug: 'plumbing-repairs', icon: 'plumbing' },
      { name: 'Electrical & Wiring', slug: 'electrical-services', icon: 'electrical_services' },
      { name: 'Painting & Interior Decorating', slug: 'painting-decorating', icon: 'format_paint' },
      { name: 'Handyman & Home Repairs', slug: 'handyman-services', icon: 'handyman' },
      { name: 'Gardening & Lawn Care', slug: 'lawn-garden-care', icon: 'yard' },
      { name: 'Carpentry & Bespoke Woodwork', slug: 'carpentry-furniture', icon: 'carpenter' },
      { name: 'Moving & Transport Logistics', slug: 'moving-logistics', icon: 'local_shipping' },
      { name: 'IT Support & Device Repair', slug: 'it-device-repair', icon: 'computer' },
      { name: 'Photography & Videography', slug: 'photography-videography', icon: 'photo_camera' },
      { name: 'Pet Care & Dog Walking', slug: 'pet-care-walking', icon: 'pets' },
      { name: 'Auto Detailing & Mobile Wash', slug: 'auto-detailing', icon: 'local_car_wash' },
      { name: 'Personal Fitness & Yoga Coaching', slug: 'fitness-yoga', icon: 'fitness_center' },
      { name: 'Roofing & Gutter Maintenance', slug: 'roof-fixing', icon: 'roofing' }
    ];

    let sortOrder = 1;
    for (const sub of servicesSubcategories) {
      const [existing] = await connection.query('SELECT id FROM categories WHERE slug = ? AND parent_id = 6', [sub.slug]);
      if (existing.length === 0) {
        await connection.query(`
          INSERT INTO categories (name, slug, parent_id, icon, is_active, sort_order, size_type, requires_size)
          VALUES (?, ?, 6, ?, 1, ?, 'none', 'not_applicable')
        `, [sub.name, sub.slug, sub.icon, sortOrder++]);
      }
    }

    // =========================================================================
    // 2. Clean Database (Preserving Admin User)
    // =========================================================================
    console.log('🧹 2. Purging old data while preserving Admin user...');
    const [adminRows] = await connection.query("SELECT id FROM users WHERE role = 'admin'");
    const adminIds = adminRows.map(r => r.id);

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM advertisement_locations');
    await connection.query('DELETE FROM product_badges');
    await connection.query('DELETE FROM trending_gallery_items');
    await connection.query('DELETE FROM favorites');
    await connection.query('DELETE FROM advertisements');
    await connection.query('DELETE FROM user_locations');
    
    if (adminIds.length > 0) {
      await connection.query('DELETE FROM users WHERE id NOT IN (?)', [adminIds]);
    } else {
      await connection.query('DELETE FROM users');
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // =========================================================================
    // 3. Seed Users
    // =========================================================================
    console.log(`👥 3. Seeding ${USER_PRESETS.length} Users across 5 countries...`);
    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
    const seededUsers = [];

    for (const u of USER_PRESETS) {
      const [insertUser] = await connection.query(`
        INSERT INTO users (
          email, password_hash, full_name, username, phone, avatar,
          role, user_type, company_name, vat_number, business_address,
          country_code, currency_code, average_rating, total_feedbacks,
          is_verified, is_active, kyc_status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, '+44 7700 900123', ?,
          ?, ?, ?, ?, ?,
          ?, ?, 4.92, 35,
          1, 1, 'verified', NOW(), NOW()
        )
      `, [
        u.email, defaultPasswordHash, u.name, u.name.toLowerCase().replace(/[^a-z0-9]/g, ''), u.avatar,
        u.role, u.type, u.company || null, u.vat || null, u.street + ', ' + u.city,
        u.country, u.curr
      ]);

      const userId = insertUser.insertId;

      const [insertLoc] = await connection.query(`
        INSERT INTO user_locations (
          user_id, name, street, city, country, zip_code,
          latitude, longitude, is_default, is_active, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, '',
          ?, ?, 1, 1, NOW(), NOW()
        )
      `, [
        userId, u.city + ' Location', u.street, u.city, u.country,
        u.lat, u.lng
      ]);

      seededUsers.push({
        id: userId,
        locationId: insertLoc.insertId,
        city: u.city,
        country: u.country,
        lat: u.lat,
        lng: u.lng,
        user_type: u.type
      });
    }

    // =========================================================================
    // 4. Seed 210+ Listings across Categories with Badges
    // =========================================================================
    console.log('🏷️ 4. Generating 210+ Short-Titled Listings with Badges...');

    const [subcatRows] = await connection.query('SELECT id, slug FROM categories WHERE parent_id = 6');
    const subcatMap = {};
    subcatRows.forEach(r => { subcatMap[r.slug] = r.id; });

    const [galleries] = await connection.query('SELECT id, slug FROM trending_galleries');
    const galleryMap = {};
    galleries.forEach(g => { galleryMap[g.slug] = g.id; });

    // Promotional Showcase Groups (Needs >= 4 items per group)
    const showcaseGroups = [
      'showcase_london_tech',
      'showcase_helsinki_design',
      'showcase_paris_luxury',
      'showcase_berlin_audio',
      'showcase_india_premium'
    ];

    const TARGET_COUNT = 210;
    let seededAdCount = 0;

    for (let i = 0; i < TARGET_COUNT; i++) {
      const template = PRODUCT_TEMPLATES[i % PRODUCT_TEMPLATES.length];
      const user = seededUsers[i % seededUsers.length];

      // Small jitter for multiple pins in same city
      const angle = (i * 137.5) * (Math.PI / 180); // Golden angle
      const distanceOffset = (0.002 + (i % 8) * 0.0015);
      const lat = user.lat + distanceOffset * Math.cos(angle);
      const lng = user.lng + distanceOffset * Math.sin(angle);

      // Unique item code
      const itemCode = 'RB-' + (100000 + i);

      // Resolve category & subcategory
      let subcatId = null;
      if (template.sub && subcatMap[template.sub]) {
        subcatId = subcatMap[template.sub];
      }

      // Resolve images array
      const imgUrl = IMAGE_POOLS[template.img] || IMAGE_POOLS['laptop'];
      const imagesJson = JSON.stringify([imgUrl]);

      const isService = template.type === 'service';
      const activityId = isService ? 4 : (i % 6 === 0 ? 1 : 2); // 2: Sell, 1: Buy, 4: Service

      // Determine promotional badge strategy
      let isFeatured = 0;
      let badgeType = null;
      let badgeLevel = null;
      let showcaseGroupId = null;
      let priorityLevel = 0;

      // Group into Showcases (every 4-5 items in blocks)
      if (i >= 0 && i < 25) {
        const groupIndex = Math.floor(i / 5);
        showcaseGroupId = showcaseGroups[groupIndex];
        badgeType = 'visibility';
        badgeLevel = 'show_casing';
        isFeatured = 1;
        priorityLevel = 90;
      } 
      // HomeMarket Gold Tier (highest priority home carousel)
      else if (i >= 25 && i < 45) {
        badgeType = 'visibility';
        badgeLevel = 'homemarket-gold-7-days';
        isFeatured = 1;
        priorityLevel = 80;
      }
      // HomeMarket Orange Tier
      else if (i >= 45 && i < 65) {
        badgeType = 'visibility';
        badgeLevel = 'homemarket-orange-7-days';
        isFeatured = 1;
        priorityLevel = 75;
      }
      // HomeMarket Green Tier
      else if (i >= 65 && i < 85) {
        badgeType = 'visibility';
        badgeLevel = 'homemarket-green-7-days';
        isFeatured = 1;
        priorityLevel = 70;
      }
      // Garage Sales Badges
      else if (i >= 85 && i < 105) {
        badgeType = 'visibility';
        badgeLevel = 'garage_sales';
        isFeatured = 1;
        priorityLevel = 60;
      }
      // Fast Ads / Urgent Highlights
      else if (i >= 105 && i < 130) {
        badgeType = 'visibility';
        badgeLevel = i % 2 === 0 ? 'fast_ad' : 'highlight';
        isFeatured = 0;
        priorityLevel = 40;
      }

      const viewsCount = 150 + Math.floor(Math.random() * 850);
      const trendingScore = 60 + Math.floor(Math.random() * 40);

      // Insert advertisement
      const [adResult] = await connection.query(`
        INSERT INTO advertisements (
          item_code, user_id, advertisement_plan_id, title, description, images,
          category_id, subcategory_id, location_id, price, display_duration_days,
          activity_id, condition_id, status, views_count, featured, start_date, end_date,
          trending_score, gender_target, listing_type, created_at, updated_at
        ) VALUES (
          ?, ?, 1, ?, ?, ?,
          ?, ?, ?, ?, 365,
          ?, 1, 'published', ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY),
          ?, 'all', ?, NOW(), NOW()
        )
      `, [
        itemCode,
        user.id,
        template.title,
        template.desc,
        imagesJson,
        template.cat,
        subcatId,
        user.locationId,
        template.price,
        activityId,
        viewsCount,
        isFeatured,
        trendingScore,
        template.type
      ]);

      const adId = adResult.insertId;

      // Link location with exact coordinates
      await connection.query(`
        INSERT INTO advertisement_locations (advertisement_id, location_id, created_at)
        VALUES (?, ?, NOW())
      `, [adId, user.locationId]);

      // Insert badge if applicable
      if (badgeType && badgeLevel) {
        await connection.query(`
          INSERT INTO product_badges (
            advertisement_id, badge_type, badge_level, showcase_group_id, priority_level,
            is_active, expiry_date, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            1, DATE_ADD(NOW(), INTERVAL 90 DAY), NOW(), NOW()
          )
        `, [adId, badgeType, badgeLevel, showcaseGroupId, priorityLevel]);
      }

      // Link to Trending Galleries
      if (i % 3 === 0 && galleries.length > 0) {
        const targetGallery = galleries[i % galleries.length];
        await connection.query(`
          INSERT INTO trending_gallery_items (gallery_id, advertisement_id, sort_order, is_featured, added_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [targetGallery.id, adId, i, isFeatured ? 1 : 0]);
      }

      seededAdCount++;
    }

    console.log(`   ✅ Seeded ${seededAdCount} items across all categories with tags!`);

    await connection.commit();
    console.log('\n🎉 ALL 200+ DATA SEEDED WITH PROMOTIONAL TAGS SUCCESSFULLY!');
    console.log('---------------------------------------------------------');
    console.log(`✅ Total Listings: ${seededAdCount}`);
    console.log('✅ Showcases: 5 groups (London, Helsinki, Paris, Berlin, India)');
    console.log('✅ HomeMarket Tiers: Gold (80), Orange (75), Green (70)');
    console.log('✅ Badges: Garage Sales, Highlights, Fast Ads');
    console.log('✅ Categories: Electronics, Fashion, Home, Vehicles, Sports, Services');
    console.log('✅ Titles: Short, clean, punchy (2-4 words)');
    console.log('---------------------------------------------------------\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Seeding failed with error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { seed200PromotionalData, IMAGE_POOLS, USER_PRESETS, PRODUCT_TEMPLATES };

// Execute only when run directly (e.g. `node seed_200_promotional_data.js`),
// not when required by another script (e.g. the non-destructive safe variant).
if (require.main === module) {
  seed200PromotionalData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
