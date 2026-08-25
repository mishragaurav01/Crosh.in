import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type VariantSeed = {
  color: string;
  colorId?: string;
  size: string;
  price: number;
  stock: number;
};

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  category: string;
  skuPrefix: string;
  variants: VariantSeed[];
};

const CATEGORIES: Array<{ name: string; slug: string; description: string }> = [
  {
    name: "Bouquets",
    slug: "bouquets",
    description: "Hand-crocheted flower bouquets that never wilt.",
  },
  {
    name: "Keychains",
    slug: "keychains",
    description: "Pocket-sized crochet charms for keys, bags and zips.",
  },
  {
    name: "Plushies",
    slug: "plushies",
    description: "Soft amigurumi companions, stitched to be hugged.",
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    description: "Woven textures and cosy accents for every corner.",
  },
  {
    name: "Planters",
    slug: "planters",
    description: "Hangers, baskets and pots for your green friends.",
  },
  {
    name: "Wearables",
    slug: "wearables",
    description: "Everyday crochet: totes, hats, beanies and more.",
  },
];

const PRODUCTS: ProductSeed[] = [
  {
    name: "Eternal Rose Bouquet",
    slug: "eternal-rose-bouquet",
    description:
      "A dozen forever roses crocheted petal by petal, wrapped and ready to gift. Never wilts, never needs water.",
    category: "bouquets",
    skuPrefix: "ERB",
    variants: [
      { color: "Rose Pink", colorId: "pink", size: "S", price: 89900, stock: 14 },
      { color: "Rose Pink", colorId: "pink", size: "M", price: 129900, stock: 10 },
      { color: "Rose Pink", colorId: "pink", size: "L", price: 169900, stock: 6 },
      { color: "Crimson Red", colorId: "red", size: "S", price: 89900, stock: 12 },
      { color: "Crimson Red", colorId: "red", size: "M", price: 129900, stock: 8 },
      { color: "Ivory White", colorId: "white", size: "M", price: 129900, stock: 9 },
    ],
  },
  {
    name: "Sunflower Sunshine Bouquet",
    slug: "sunflower-sunshine-bouquet",
    description:
      "Cheerful crochet sunflowers with textured brown centres on leafy green stems, tied with rustic twine.",
    category: "bouquets",
    skuPrefix: "SSB",
    variants: [
      { color: "Sunny Yellow", colorId: "yellow", size: "Standard", price: 99900, stock: 15 },
      { color: "Sunny Yellow", colorId: "yellow", size: "Grande", price: 149900, stock: 7 },
      { color: "Warm Brown", colorId: "brown", size: "Standard", price: 99900, stock: 5 },
    ],
  },
  {
    name: "Tulip Pastel Bouquet",
    slug: "tulip-pastel-bouquet",
    description:
      "A soft spring bunch of crocheted tulips in blush and cloud tones — gentle colour that stays all year.",
    category: "bouquets",
    skuPrefix: "TPB",
    variants: [
      { color: "Blush Pink", colorId: "pink", size: "Standard", price: 89900, stock: 11 },
      { color: "Blush Pink", colorId: "pink", size: "Grande", price: 134900, stock: 4 },
      { color: "Cloud White", colorId: "white", size: "Standard", price: 89900, stock: 13 },
    ],
  },
  {
    name: "Mixed Wildflower Bouquet",
    slug: "mixed-wildflower-bouquet",
    description:
      "A meadow in your hands: daisies, cornflowers and grasses crocheted in a happy mix of colours.",
    category: "bouquets",
    skuPrefix: "MWB",
    variants: [
      { color: "Meadow Mix", size: "Standard", price: 119900, stock: 8 },
    ],
  },
  {
    name: "Baby's Breath Mini Bouquet",
    slug: "babys-breath-mini-bouquet",
    description:
      "Delicate sprigs of tiny white blooms — sweet on a study desk, bedside table or gift tag.",
    category: "bouquets",
    skuPrefix: "BBM",
    variants: [
      { color: "Cloud White", colorId: "white", size: "Mini", price: 59900, stock: 20 },
      { color: "Cloud White", colorId: "white", size: "Standard", price: 89900, stock: 10 },
    ],
  },
  {
    name: "Red Velvet Rose Box",
    slug: "red-velvet-rose-box",
    description:
      "Deep crimson crochet roses arranged dome-style in a keepsake box. Anniversaries, sorted.",
    category: "bouquets",
    skuPrefix: "RVB",
    variants: [
      { color: "Crimson Red", colorId: "red", size: "Box of 9", price: 149900, stock: 6 },
      { color: "Crimson Red", colorId: "red", size: "Box of 16", price: 189900, stock: 3 },
    ],
  },
  {
    name: "Daisy Chain Bouquet",
    slug: "daisy-chain-bouquet",
    description:
      "Fresh-as-morning daisies with golden centres, bunched loose and light just like a field pick.",
    category: "bouquets",
    skuPrefix: "DCB",
    variants: [
      { color: "Sunny Yellow", colorId: "yellow", size: "Standard", price: 74900, stock: 12 },
      { color: "Cloud White", colorId: "white", size: "Standard", price: 74900, stock: 12 },
    ],
  },

  {
    name: "Mini Bee Keychain",
    slug: "mini-bee-keychain",
    description:
      "A chubby little bee with stripey body and felt wings. Clips onto keys, totes and backpacks.",
    category: "keychains",
    skuPrefix: "MBK",
    variants: [
      { color: "Bumble Yellow", colorId: "yellow", size: "One Size", price: 29900, stock: 30 },
    ],
  },
  {
    name: "Heart Charm Keychain",
    slug: "heart-charm-keychain",
    description:
      "A plump crocheted heart on a sturdy clasp — a small token that says plenty.",
    category: "keychains",
    skuPrefix: "HCK",
    variants: [
      { color: "Blush Pink", colorId: "pink", size: "One Size", price: 24900, stock: 25 },
      { color: "Cherry Red", colorId: "red", size: "One Size", price: 24900, stock: 22 },
      { color: "Cloud White", colorId: "white", size: "One Size", price: 24900, stock: 18 },
    ],
  },
  {
    name: "Strawberry Keychain",
    slug: "strawberry-keychain",
    description:
      "Juicy berry red with embroidered seeds and a leafy crown. Sweeter than the real thing.",
    category: "keychains",
    skuPrefix: "SKC",
    variants: [
      { color: "Berry Red", colorId: "red", size: "One Size", price: 29900, stock: 0 },
    ],
  },
  {
    name: "Cloud Puff Keychain",
    slug: "cloud-puff-keychain",
    description:
      "A squishable marshmallow cloud for your keys. Oddly satisfying to squeeze.",
    category: "keychains",
    skuPrefix: "CPK",
    variants: [
      { color: "Cloud White", colorId: "white", size: "One Size", price: 34900, stock: 16 },
      { color: "Storm Grey", colorId: "grey", size: "One Size", price: 34900, stock: 12 },
    ],
  },
  {
    name: "Avocado Keychain",
    slug: "avocado-keychain",
    description:
      "Half an avocado with a woody pit, crocheted in fresh greens. For the toast loyalists.",
    category: "keychains",
    skuPrefix: "AVK",
    variants: [
      { color: "Avocado Green", colorId: "green", size: "One Size", price: 29900, stock: 20 },
      { color: "Toast Brown", colorId: "brown", size: "One Size", price: 29900, stock: 14 },
    ],
  },
  {
    name: "Smiley Star Keychain",
    slug: "smiley-star-keychain",
    description:
      "A five-point grin to brighten the most boring set of keys. Embroidered, safety-eyed, cute.",
    category: "keychains",
    skuPrefix: "SSK",
    variants: [
      { color: "Sunny Yellow", colorId: "yellow", size: "One Size", price: 24900, stock: 26 },
      { color: "Cloud White", colorId: "white", size: "One Size", price: 24900, stock: 19 },
    ],
  },

  {
    name: "Amigurumi Bunny",
    slug: "amigurumi-bunny",
    description:
      "Long-eared and lovable, this bunny is crocheted in soft cotton with a embroidered nose and a floofy tail.",
    category: "plushies",
    skuPrefix: "AMB",
    variants: [
      { color: "Blush Pink", colorId: "pink", size: "Small", price: 54900, stock: 10 },
      { color: "Blush Pink", colorId: "pink", size: "Large", price: 89900, stock: 5 },
      { color: "Cloud White", colorId: "white", size: "Small", price: 54900, stock: 12 },
      { color: "Cloud White", colorId: "white", size: "Large", price: 89900, stock: 7 },
      { color: "Storm Grey", colorId: "grey", size: "Small", price: 54900, stock: 8 },
      { color: "Storm Grey", colorId: "grey", size: "Large", price: 89900, stock: 0 },
    ],
  },
  {
    name: "Amigurumi Bear",
    slug: "amigurumi-bear",
    description:
      "A classic ted with jointed arms, honey-brown fur and a hand-stitched smile. Made for lifelong pals.",
    category: "plushies",
    skuPrefix: "ABR",
    variants: [
      { color: "Honey Brown", colorId: "brown", size: "Small", price: 54900, stock: 11 },
      { color: "Honey Brown", colorId: "brown", size: "Large", price: 89900, stock: 6 },
      { color: "Cloud White", colorId: "white", size: "Small", price: 54900, stock: 9 },
      { color: "Cloud White", colorId: "white", size: "Large", price: 89900, stock: 4 },
    ],
  },
  {
    name: "Crochet Octopus",
    slug: "crochet-octopus",
    description:
      "Eight curly arms of cuddle. This friendly octopus sits upright and guards your desk.",
    category: "plushies",
    skuPrefix: "OCT",
    variants: [
      { color: "Blush Pink", colorId: "pink", size: "One Size", price: 64900, stock: 9 },
      { color: "Storm Grey", colorId: "grey", size: "One Size", price: 64900, stock: 7 },
    ],
  },
  {
    name: "Sleepy Cat Plush",
    slug: "sleepy-cat-plush",
    description:
      "Curled up mid-nap with embroidered closed eyes. The chillest companion we make.",
    category: "plushies",
    skuPrefix: "SCP",
    variants: [
      { color: "Storm Grey", colorId: "grey", size: "One Size", price: 74900, stock: 10 },
      { color: "Cloud White", colorId: "white", size: "One Size", price: 74900, stock: 6 },
    ],
  },
  {
    name: "Penguin Pal",
    slug: "penguin-pal",
    description:
      "A waddling gentleman in a crisp black tailcoat with a white bow-tie belly.",
    category: "plushies",
    skuPrefix: "PGP",
    variants: [
      { color: "Midnight Black", colorId: "black", size: "One Size", price: 69900, stock: 8 },
      { color: "Cloud White", colorId: "white", size: "One Size", price: 69900, stock: 5 },
    ],
  },
  {
    name: "Duckling Plush",
    slug: "duckling-plush",
    description:
      "A round little duckling with an orange beak and permanent good mood.",
    category: "plushies",
    skuPrefix: "DKP",
    variants: [
      { color: "Duckling Yellow", colorId: "yellow", size: "One Size", price: 54900, stock: 13 },
    ],
  },
  {
    name: "Dinosaur Buddy",
    slug: "dinosaur-buddy",
    description:
      "Stegosaurus spikes, stubby legs, infinite patience. Roars sold separately.",
    category: "plushies",
    skuPrefix: "DSB",
    variants: [
      { color: "Fern Green", colorId: "green", size: "One Size", price: 79900, stock: 9 },
    ],
  },

  {
    name: "Crochet Coaster Set",
    slug: "crochet-coaster-set",
    description:
      "Four thick-stitch round coasters that soak up condensation and save your tables. Cotton, washable.",
    category: "home-decor",
    skuPrefix: "CCS",
    variants: [
      { color: "Sage Green", colorId: "green", size: "Set of 4", price: 49900, stock: 18 },
      { color: "Ivory White", colorId: "white", size: "Set of 4", price: 49900, stock: 15 },
    ],
  },
  {
    name: "Macramé Wall Hanging",
    slug: "macrame-wall-hanging",
    description:
      "Knotted fringe on a wooden dowel — calm, boho texture for blank walls.",
    category: "home-decor",
    skuPrefix: "MWH",
    variants: [
      { color: "Toast Brown", colorId: "brown", size: "Medium", price: 119900, stock: 7 },
      { color: "Ivory White", colorId: "white", size: "Medium", price: 119900, stock: 5 },
    ],
  },
  {
    name: "Textured Grid Cushion Cover",
    slug: "cushion-cover-textured-grid",
    description:
      "A woven grid pattern with satisfying depth. Fits standard 40×40 cm inserts (not included).",
    category: "home-decor",
    skuPrefix: "CCC",
    variants: [
      { color: "Storm Grey", colorId: "grey", size: "40x40cm", price: 64900, stock: 12 },
      { color: "Cloud White", colorId: "white", size: "40x40cm", price: 64900, stock: 9 },
      { color: "Blush Pink", colorId: "pink", size: "40x40cm", price: 64900, stock: 8 },
    ],
  },
  {
    name: "Natural Weave Table Runner",
    slug: "table-runner-natural-weave",
    description:
      "Earth-toned stitchwork that dresses up dinner tables and survives everyday spills.",
    category: "home-decor",
    skuPrefix: "TRN",
    variants: [
      { color: "Toast Brown", colorId: "brown", size: "140cm", price: 129900, stock: 6 },
    ],
  },
  {
    name: "Chunky Knit Storage Basket",
    slug: "storage-basket-chunky-knit",
    description:
      "A stout basket with structure to spare — corrals yarn, toys, remotes and everything else.",
    category: "home-decor",
    skuPrefix: "SBK",
    variants: [
      { color: "Storm Grey", colorId: "grey", size: "Medium", price: 79900, stock: 8 },
      { color: "Storm Grey", colorId: "grey", size: "Large", price: 109900, stock: 4 },
      { color: "Toast Brown", colorId: "brown", size: "Medium", price: 79900, stock: 10 },
    ],
  },
  {
    name: "Blush Dreamcatcher",
    slug: "dreamcatcher-blush",
    description:
      "Feather-light loops and trailing fringe in blush tones, hung on a brass-finish ring.",
    category: "home-decor",
    skuPrefix: "DCB2",
    variants: [
      { color: "Blush Pink", colorId: "pink", size: "One Size", price: 54900, stock: 11 },
    ],
  },

  {
    name: "Jute Braid Hanging Planter",
    slug: "hanging-planter-jute-braid",
    description:
      "Braided jute cradle with a 60cm drop — swings gently, holds firmly. Pot not included.",
    category: "planters",
    skuPrefix: "JHP",
    variants: [
      { color: "Jute Brown", colorId: "brown", size: "Standard", price: 64900, stock: 12 },
      { color: "Fern Green", colorId: "green", size: "Standard", price: 64900, stock: 8 },
    ],
  },
  {
    name: "Ribbed Desktop Planter",
    slug: "desktop-planter-ribbed",
    description:
      "A squat ribbed pot sized for succulents and cacti, with a drainage-friendly liner.",
    category: "planters",
    skuPrefix: "RDP",
    variants: [
      { color: "Ivory White", colorId: "white", size: "Small", price: 44900, stock: 20 },
      { color: "Storm Grey", colorId: "grey", size: "Small", price: 44900, stock: 16 },
      { color: "Blush Pink", colorId: "pink", size: "Small", price: 44900, stock: 14 },
    ],
  },
  {
    name: "Floor Basket Planter",
    slug: "floor-basket-planter",
    description:
      "Statement-sized woven basket for monsteras and fiddle figs. Sturdy base, tall silhouette.",
    category: "planters",
    skuPrefix: "FBP",
    variants: [
      { color: "Toast Brown", colorId: "brown", size: "Large", price: 139900, stock: 5 },
      { color: "Storm Grey", colorId: "grey", size: "Large", price: 139900, stock: 4 },
    ],
  },
  {
    name: "Succulent Trio with Mini Pots",
    slug: "succulent-set-mini-pots",
    description:
      "Three crocheted succulents in matching mini pots. All the greenery, zero watering schedule.",
    category: "planters",
    skuPrefix: "STM",
    variants: [
      { color: "Fern Green", colorId: "green", size: "Set of 3", price: 69900, stock: 10 },
      { color: "Sunny Yellow", colorId: "yellow", size: "Set of 3", price: 69900, stock: 7 },
    ],
  },
  {
    name: "Boho Plant Hanger Trio",
    slug: "boho-plant-hanger-trio",
    description:
      "Three knotted hangers in graduated lengths for a cascading corner jungle.",
    category: "planters",
    skuPrefix: "BPT",
    variants: [
      { color: "Jute Brown", colorId: "brown", size: "Set of 3", price: 99900, stock: 6 },
      { color: "Ivory White", colorId: "white", size: "Set of 3", price: 99900, stock: 5 },
    ],
  },

  {
    name: "Pastel Scrunchie Set",
    slug: "pastel-scrunchie-set",
    description:
      "Gentle-hold scrunchies in soft cotton blends. Three to a set, kind to hair, easy on wrists.",
    category: "wearables",
    skuPrefix: "PSS",
    variants: [
      { color: "Blush Pink", colorId: "pink", size: "Set of 3", price: 39900, stock: 22 },
      { color: "Cloud White", colorId: "white", size: "Set of 3", price: 39900, stock: 17 },
      { color: "Storm Grey", colorId: "grey", size: "Set of 3", price: 39900, stock: 19 },
    ],
  },
  {
    name: "Market Tote Bag",
    slug: "market-tote-cotton-weave",
    description:
      "A sturdy open-weave tote for markets, libraries and beach days. Folds flat, stretches wide.",
    category: "wearables",
    skuPrefix: "MTB",
    variants: [
      { color: "Olive Green", colorId: "green", size: "One Size", price: 89900, stock: 9 },
      { color: "Toast Brown", colorId: "brown", size: "One Size", price: 89900, stock: 7 },
      { color: "Ivory White", colorId: "white", size: "One Size", price: 89900, stock: 8 },
    ],
  },
  {
    name: "Ripple Stitch Bucket Hat",
    slug: "bucket-hat-ripple-stitch",
    description:
      "Wavy ripple brim, breathable stitches, packable crown. Sun protection that fits in a pocket.",
    category: "wearables",
    skuPrefix: "RBH",
    variants: [
      { color: "Sunny Yellow", colorId: "yellow", size: "S/M", price: 54900, stock: 10 },
      { color: "Sunny Yellow", colorId: "yellow", size: "L/XL", price: 59900, stock: 6 },
      { color: "Ivory White", colorId: "white", size: "S/M", price: 54900, stock: 11 },
    ],
  },
  {
    name: "Fingerless Gloves",
    slug: "fingerless-gloves",
    description:
      "Texting-friendly warmth with a snug ribbed cuff. One pair, many winters.",
    category: "wearables",
    skuPrefix: "FLG",
    variants: [
      { color: "Storm Grey", colorId: "grey", size: "Free Size", price: 49900, stock: 14 },
      { color: "Midnight Black", colorId: "black", size: "Free Size", price: 49900, stock: 12 },
    ],
  },
  {
    name: "Chunky Rib Beanie",
    slug: "beanie-chunky-rib",
    description:
      "Thick ribbed folds that actually cover the ears. Soft acrylic blend, no itch.",
    category: "wearables",
    skuPrefix: "CRB",
    variants: [
      { color: "Midnight Black", colorId: "black", size: "Free Size", price: 59900, stock: 15 },
      { color: "Storm Grey", colorId: "grey", size: "Free Size", price: 59900, stock: 13 },
      { color: "Chestnut Brown", colorId: "brown", size: "Free Size", price: 59900, stock: 9 },
    ],
  },
];

const COLLECTIONS: Array<{
  name: string;
  slug: string;
  description: string;
  productSlugs: string[];
}> = [
  {
    name: "Bestsellers",
    slug: "bestsellers",
    description: "The pieces our customers keep coming back for.",
    productSlugs: [
      "eternal-rose-bouquet",
      "sunflower-sunshine-bouquet",
      "mini-bee-keychain",
      "amigurumi-bunny",
      "amigurumi-bear",
      "crochet-coaster-set",
      "market-tote-cotton-weave",
      "duckling-plush",
      "tulip-pastel-bouquet",
      "hanging-planter-jute-braid",
      "storage-basket-chunky-knit",
      "beanie-chunky-rib",
    ],
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh off the hook — the latest additions to the studio.",
    productSlugs: [
      "dinosaur-buddy",
      "penguin-pal",
      "sleepy-cat-plush",
      "crochet-octopus",
      "boho-plant-hanger-trio",
      "bucket-hat-ripple-stitch",
      "table-runner-natural-weave",
      "macrame-wall-hanging",
      "mixed-wildflower-bouquet",
      "babys-breath-mini-bouquet",
      "red-velvet-rose-box",
    ],
  },
  {
    name: "Gifts Under ₹500",
    slug: "gifts-under-500",
    description: "Thoughtful handmade gifts that stay kind to your wallet.",
    productSlugs: [
      "mini-bee-keychain",
      "heart-charm-keychain",
      "strawberry-keychain",
      "cloud-puff-keychain",
      "avocado-keychain",
      "smiley-star-keychain",
      "pastel-scrunchie-set",
      "crochet-coaster-set",
      "desktop-planter-ribbed",
      "fingerless-gloves",
    ],
  },
  {
    name: "Wedding & Anniversary",
    slug: "wedding-anniversary",
    description: "Keepsake blooms and heirloom textures for the big days.",
    productSlugs: [
      "eternal-rose-bouquet",
      "red-velvet-rose-box",
      "babys-breath-mini-bouquet",
      "tulip-pastel-bouquet",
      "mixed-wildflower-bouquet",
      "dreamcatcher-blush",
      "cushion-cover-textured-grid",
      "macrame-wall-hanging",
      "table-runner-natural-weave",
      "crochet-coaster-set",
      "storage-basket-chunky-knit",
      "heart-charm-keychain",
    ],
  },
  {
    name: "Pastel Picks",
    slug: "pastel-picks",
    description: "Soft blushes, creams and greys for gentle palettes.",
    productSlugs: [
      "tulip-pastel-bouquet",
      "babys-breath-mini-bouquet",
      "heart-charm-keychain",
      "cloud-puff-keychain",
      "amigurumi-bunny",
      "pastel-scrunchie-set",
      "cushion-cover-textured-grid",
      "dreamcatcher-blush",
      "desktop-planter-ribbed",
      "duckling-plush",
      "smiley-star-keychain",
    ],
  },
  {
    name: "Cozy Home",
    slug: "cozy-home",
    description: "Layer your space in warm, handmade texture.",
    productSlugs: [
      "crochet-coaster-set",
      "macrame-wall-hanging",
      "cushion-cover-textured-grid",
      "table-runner-natural-weave",
      "storage-basket-chunky-knit",
      "dreamcatcher-blush",
      "hanging-planter-jute-braid",
      "desktop-planter-ribbed",
      "floor-basket-planter",
      "boho-plant-hanger-trio",
      "succulent-set-mini-pots",
      "beanie-chunky-rib",
    ],
  },
  {
    name: "Desk Buddies",
    slug: "desk-buddies",
    description: "Small companions for work-from-home desks and study tables.",
    productSlugs: [
      "mini-bee-keychain",
      "avocado-keychain",
      "smiley-star-keychain",
      "strawberry-keychain",
      "cloud-puff-keychain",
      "crochet-octopus",
      "sleepy-cat-plush",
      "penguin-pal",
      "dinosaur-buddy",
      "duckling-plush",
      "amigurumi-bear",
      "desktop-planter-ribbed",
    ],
  },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Seed assertion failed: ${message}`);
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function main(): Promise<void> {
  const productSlugs = new Set(PRODUCTS.map((p) => p.slug));
  assert(productSlugs.size === PRODUCTS.length, "duplicate product slugs in seed data");

  for (const collection of COLLECTIONS) {
    assert(
      collection.productSlugs.length >= 10 && collection.productSlugs.length <= 15,
      `collection "${collection.slug}" has ${collection.productSlugs.length} products (need 10-15)`,
    );
    for (const ps of collection.productSlugs) {
      assert(productSlugs.has(ps), `collection "${collection.slug}" references unknown product "${ps}"`);
    }
  }
  assert(PRODUCTS.length >= 30, `${PRODUCTS.length} products (need >=30)`);
  assert(COLLECTIONS.length >= 6 && COLLECTIONS.length <= 8, `${COLLECTIONS.length} collections (need 6-8)`);

  const colorOptions = await prisma.colorOption.findMany();
  const colorIdByName = new Map(colorOptions.map((c) => [c.name, c.id]));

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany();
    await tx.variantCollection.deleteMany();
    await tx.image.deleteMany();
    await tx.variant.deleteMany();
    await tx.product.deleteMany();
    await tx.collection.deleteMany();
    await tx.category.deleteMany();

    const categoryIds = new Map<string, string>();
    for (const c of CATEGORIES) {
      const row = await tx.category.create({
        data: { name: c.name, slug: c.slug, description: c.description },
      });
      categoryIds.set(c.slug, row.id);
    }

    const variantIdsByProductSlug = new Map<string, string[]>();
    for (const p of PRODUCTS) {
      const categoryId = categoryIds.get(p.category);
      assert(categoryId, `missing category "${p.category}"`);
      const created = await tx.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          status: "PUBLISHED",
          categoryId,
          variants: {
            create: p.variants.map((v, i) => ({
              sku: `${p.skuPrefix}-${slugify(v.color).slice(0, 3).toUpperCase()}-${slugify(v.size).slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
              size: v.size,
              color: v.color,
              ...(v.colorId && colorIdByName.has(v.colorId)
                ? { colorId: colorIdByName.get(v.colorId) }
                : {}),
              price: v.price,
              stock: v.stock,
              sortOrder: i,
            })),
          },
        },
        select: { id: true, variants: { select: { id: true } } },
      });
      variantIdsByProductSlug.set(
        p.slug,
        created.variants.map((v) => v.id),
      );
    }

    for (const c of COLLECTIONS) {
      const row = await tx.collection.create({
        data: { name: c.name, slug: c.slug, description: c.description },
      });
      const variantIds = c.productSlugs.flatMap(
        (ps) => variantIdsByProductSlug.get(ps) ?? [],
      );
      await tx.variantCollection.createMany({
        data: variantIds.map((variantId) => ({ variantId, collectionId: row.id })),
      });
    }
  }, { timeout: 120000, maxWait: 10000 });

  const [productCount, variantCount, collectionCount, membershipCount] = await Promise.all([
    prisma.product.count(),
    prisma.variant.count(),
    prisma.collection.count(),
    prisma.variantCollection.count(),
  ]);

  const memberships = await prisma.variantCollection.findMany({
    select: {
      collection: { select: { slug: true } },
      variant: { select: { productId: true } },
    },
  });

  const distinctByCollection = new Map<string, Set<string>>();
  const countByCollection = new Map<string, number>();
  for (const m of memberships) {
    const set = distinctByCollection.get(m.collection.slug) ?? new Set<string>();
    set.add(m.variant.productId);
    distinctByCollection.set(m.collection.slug, set);
    countByCollection.set(m.collection.slug, (countByCollection.get(m.collection.slug) ?? 0) + 1);
  }

  console.log("Seed complete:");
  console.log(JSON.stringify({ productCount, variantCount, collectionCount, membershipCount }));
  for (const [slug, products] of distinctByCollection) {
    console.log(`  ${slug}: ${products.size} products / ${countByCollection.get(slug)} variant memberships`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
