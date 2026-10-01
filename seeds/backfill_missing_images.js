/**
 * Backfill real stock photos onto any advertisement whose images are
 * missing, empty, or broken (e.g. a baked-in http://localhost:5001 URL,
 * or a /uploads/... path whose file no longer exists on this server).
 *
 * Never touches an ad that already has at least one working image.
 * Picks an image by:
 *   1. Matching a keyword in the ad's title against a curated pool
 *      (reuses the same Unsplash photo set as seed_200_promotional_data.js)
 *   2. Falling back to a default photo for the ad's top-level category
 *   3. Falling back to a generic default if neither matches
 *
 * Safe to re-run — only ever touches rows currently in a broken state.
 * Wrapped in a single transaction, rolled back on any error.
 *
 * Usage (from backend/):
 *   node seeds/backfill_missing_images.js
 *   node seeds/backfill_missing_images.js --dry-run   # report only, no writes
 */

const fs = require('fs');
const path = require('path');
const { promisePool } = require('../src/config/database');
const { IMAGE_POOLS } = require('./seed_200_promotional_data');

const DRY_RUN = process.argv.includes('--dry-run');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Extra photo pools for categories seed_200_promotional_data.js doesn't cover
const EXTRA_IMAGE_POOLS = {
  boat: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=800&q=80',
  book: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
  appliance: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80',
  movie: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
  collectible: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=800&q=80',
  baby: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80',
  toy: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=800&q=80',
  beauty: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  art: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=80',
  ticket: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
  renovation: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
  realestate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
  animal: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80',
  hobby: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=80',
  tools: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80',
  jewellery: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
  job: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
  give: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
  generic: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=800&q=80',
};

const ALL_POOLS = { ...IMAGE_POOLS, ...EXTRA_IMAGE_POOLS };

// Title keyword -> pool key. Checked in order, first match wins, so more
// specific terms are listed before their more generic siblings.
const TITLE_KEYWORDS = [
  ['macbook', 'macbook'], ['iphone', 'iphone'], ['ipad', 'ipad'],
  ['samsung galaxy', 'phone'], ['smartphone', 'phone'], ['phone', 'phone'],
  ['dslr', 'camera'], ['mirrorless', 'camera'], ['camera', 'camera'], ['lens', 'lens'],
  ['airpods', 'earbuds'], ['earbud', 'earbuds'], ['headphone', 'headphones'],
  ['apple watch', 'smartwatch'], ['smartwatch', 'smartwatch'], ['smart watch', 'smartwatch'], ['watch', 'watch'],
  ['speaker', 'speaker'], ['oled tv', 'tv'], [' tv', 'tv'],
  ['playstation', 'gaming'], ['nintendo', 'gaming'], ['xbox', 'gaming'], ['console', 'gaming'],
  ['keyboard', 'keyboard'], ['drone', 'drone'],
  ['sofa', 'sofa'], ['dining table', 'diningTable'], ['coffee table', 'coffeeTable'], ['table', 'coffeeTable'],
  ['armchair', 'chair'], ['office chair', 'chair'], ['chair', 'chair'],
  ['floor lamp', 'lamp'], ['pendant light', 'lamp'], ['lamp', 'lamp'],
  ['bed frame', 'bed'], ['mattress', 'bed'], ['wool rug', 'rug'], ['rug', 'rug'],
  ['monstera', 'plant'], ['plant', 'plant'], ['mirror', 'mirror'],
  ['sneaker', 'sneakers'], ['jordan', 'sneakers'], ['chelsea boot', 'boots'], ['boot', 'boots'],
  ['biker jacket', 'jacket'], ['blazer', 'jacket'], ['jacket', 'jacket'],
  ['trench coat', 'coat'], ['winter coat', 'coat'], ['coat', 'coat'],
  ['evening dress', 'dress'], ['dress', 'dress'],
  ['tote bag', 'bag'], ['handbag', 'bag'], ['laptop bag', 'bag'], ['bag', 'bag'],
  ['sunglasses', 'sunglasses'], ['ray-ban', 'sunglasses'],
  ['jeans', 'jeans'], ['denim', 'jeans'], ['suit', 'suit'],
  ['ring', 'jewellery'], ['necklace', 'jewellery'], ['bracelet', 'jewellery'], ['jewellery', 'jewellery'], ['jewelry', 'jewellery'],
  ['vespa', 'vespa'], ['scooter', 'vespa'], ['motorcycle', 'motorcycle'], ['ducati', 'motorcycle'],
  ['gravel bike', 'bike'], ['road bike', 'bike'], ['folding bike', 'bike'], ['bicycle', 'bike'], ['e-bike', 'ebike'], ['electric bike', 'ebike'],
  ['helmet', 'helmet'], ['bike rack', 'car'], ['car', 'car'], ['boat', 'boat'], ['yacht', 'boat'],
  ['guitar', 'guitar'], ['piano', 'piano'], ['dj controller', 'dj'],
  ['tennis', 'tennis'], ['camping tent', 'camping'], ['tent', 'camping'], ['golf', 'golf'], ['ski', 'skis'],
  ['book', 'book'], ['fridge', 'appliance'], ['washing machine', 'appliance'], ['appliance', 'appliance'],
  ['movie', 'movie'], ['dvd', 'movie'], ['coin', 'collectible'], ['stamp', 'collectible'], ['collectible', 'collectible'],
  ['stroller', 'baby'], ['baby', 'baby'], ['doll', 'toy'], ['teddy', 'toy'], ['toy', 'toy'],
  ['makeup', 'beauty'], ['skincare', 'beauty'], ['perfume', 'beauty'],
  ['deep cleaning', 'cleaning'], ['cleaning', 'cleaning'], ['plumbing', 'plumbing'], ['plumber', 'plumbing'],
  ['electrician', 'electrician'], ['electrical', 'electrician'],
  ['painting', 'painting'], ['gardening', 'gardening'], ['lawn', 'gardening'],
  ['carpentry', 'carpentry'], ['carpenter', 'carpentry'], ['moving', 'moving'], ['mover', 'moving'],
  ['tech repair', 'techRepair'], ['it support', 'techRepair'], ['photography', 'photography'], ['photographer', 'photography'],
  ['dog walking', 'petCare'], ['pet sitting', 'petCare'], ['pet care', 'petCare'],
  ['car detailing', 'carDetailing'], ['auto detailing', 'carDetailing'],
  ['yoga', 'fitness'], ['fitness coach', 'fitness'], ['roofing', 'roofing'], ['roof', 'roofing'],
  ['handyman', 'handyman'], ['assembly', 'handyman'],
];

// Top-level category name -> default pool key (covers every top-level
// category found in this database; walked up to via parent_id).
const CATEGORY_NAME_TO_POOL = [
  [/electronic/i, 'laptop'],
  [/fashion|clothing|shoes/i, 'jacket'],
  [/furniture|decoration/i, 'sofa'],
  [/home\s*&?\s*garden/i, 'sofa'],
  [/vehicles?/i, 'car'],
  [/cars?\s*&?\s*motorbikes?/i, 'car'],
  [/boats?\s*&?\s*trailers?/i, 'boat'],
  [/bicycles?\s*&?\s*cycling/i, 'bike'],
  [/real\s*estate|housing/i, 'realestate'],
  [/services?/i, 'handyman'],
  [/jobs?|seek\s*&?\s*offer\s*work/i, 'job'],
  [/networking\s*services?/i, 'job'],
  [/sports?\s*&?\s*(hobbies|accessories)/i, 'tennis'],
  [/video\s*games?\s*&?\s*consoles?/i, 'gaming'],
  [/books?\s*&?\s*magazines?/i, 'book'],
  [/computers?\s*&?\s*tablets?/i, 'laptop'],
  [/phones?\s*&?\s*accessories/i, 'phone'],
  [/home\s*electronics|domestic\s*appliances/i, 'appliance'],
  [/cameras?/i, 'camera'],
  [/music\s*&?\s*instruments?/i, 'guitar'],
  [/movies?\s*&?\s*accessories/i, 'movie'],
  [/collectibles?/i, 'collectible'],
  [/bags?/i, 'bag'],
  [/babies?\s*&?\s*mothers?/i, 'baby'],
  [/children\s*&?\s*accessories/i, 'toy'],
  [/toys?,?\s*dolls?\s*&?\s*teddies/i, 'toy'],
  [/beauty\s*&?\s*health/i, 'beauty'],
  [/art,?\s*design\s*&?\s*antiques/i, 'art'],
  [/tickets?,?\s*gift\s*cards?\s*&?\s*coupons?/i, 'ticket'],
  [/building\s*&?\s*(refurbishing|renovation)/i, 'renovation'],
  [/travel/i, 'travel'],
  [/makers?/i, 'tools'],
  [/animals?/i, 'animal'],
  [/entertainment\s*&?\s*hobbies|hobby\s*groups?/i, 'hobby'],
  [/trades?\s*&?\s*professional\s*equipment/i, 'tools'],
  [/watches?\s*&?\s*jewellery/i, 'jewellery'],
  [/give/i, 'give'],
  [/miscellaneous/i, 'generic'],
];

function findTitleImage(title) {
  const lower = (title || '').toLowerCase();
  for (const [keyword, poolKey] of TITLE_KEYWORDS) {
    if (lower.includes(keyword)) return ALL_POOLS[poolKey] || null;
  }
  return null;
}

function findCategoryImage(categoryName) {
  for (const [pattern, poolKey] of CATEGORY_NAME_TO_POOL) {
    if (pattern.test(categoryName || '')) return ALL_POOLS[poolKey] || null;
  }
  return null;
}

function isImageWorking(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('localhost')) return false;
  if (url.startsWith('http')) return true; // external CDN URL, assume reachable
  if (url.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS_DIR, url.replace('/uploads/', ''));
    return fs.existsSync(filePath);
  }
  return false;
}

function parseImages(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function buildTopLevelResolver(connection) {
  const [categories] = await connection.query('SELECT id, name, parent_id FROM categories');
  const byId = new Map(categories.map(c => [c.id, c]));

  const resolve = (id) => {
    let current = byId.get(id);
    const seen = new Set();
    while (current && current.parent_id && !seen.has(current.id)) {
      seen.add(current.id);
      const parent = byId.get(current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return current || null;
  };

  return resolve;
}

async function backfill() {
  console.log(`🚀 Backfilling missing/broken advertisement images${DRY_RUN ? ' (DRY RUN — no writes)' : ''}...`);

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const resolveTopLevel = await buildTopLevelResolver(connection);

    const [ads] = await connection.query('SELECT id, title, category_id, images FROM advertisements');
    console.log(`📦 Scanning ${ads.length} advertisements...`);

    let brokenCount = 0;
    let fixedByTitle = 0;
    let fixedByCategory = 0;
    let fixedByGeneric = 0;
    const unresolved = [];

    for (const ad of ads) {
      const images = parseImages(ad.images);
      const hasWorkingImage = images.some(isImageWorking);
      if (hasWorkingImage) continue; // never touch ads that already have a real image

      brokenCount++;

      let newImage = findTitleImage(ad.title);
      let source = 'title';

      if (!newImage) {
        const topCat = resolveTopLevel(ad.category_id);
        newImage = findCategoryImage(topCat?.name);
        source = 'category';
      }

      if (!newImage) {
        newImage = ALL_POOLS.generic;
        source = 'generic';
      }

      if (!newImage) {
        unresolved.push(ad.id);
        continue;
      }

      if (source === 'title') fixedByTitle++;
      else if (source === 'category') fixedByCategory++;
      else fixedByGeneric++;

      if (!DRY_RUN) {
        await connection.query(
          'UPDATE advertisements SET images = ? WHERE id = ?',
          [JSON.stringify([newImage]), ad.id]
        );
      }
    }

    if (DRY_RUN) {
      await connection.rollback();
    } else {
      await connection.commit();
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`✅ ${brokenCount} ads had missing/broken images`);
    console.log(`   → ${fixedByTitle} matched by title keyword`);
    console.log(`   → ${fixedByCategory} matched by category default`);
    console.log(`   → ${fixedByGeneric} used the generic fallback`);
    if (unresolved.length > 0) {
      console.log(`   ⚠️  ${unresolved.length} could not be resolved: ${unresolved.join(', ')}`);
    }
    console.log(DRY_RUN ? '   (dry run — no changes were written)' : '   Changes committed.');
    console.log('─'.repeat(50) + '\n');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Backfill failed — rolled back, no changes were made:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  backfill()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { backfill };
