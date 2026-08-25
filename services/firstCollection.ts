export type CollectionAvailability = 'ready_to_release' | 'limited_release' | 'made_to_order';

const collectionImage = (fileName: string): string => {
  const pageBase = window.location.pathname.startsWith('/Everfracted/') ? '/Everfracted' : '';
  return `${pageBase}/collection/${fileName}`;
};

export interface CollectionProduct {
  slug: string;
  title: string;
  eyebrow: string;
  formula: string;
  season: string;
  mood: string[];
  palette: string[];
  availability: CollectionAvailability;
  price: number;
  imageUrl: string;
  summary: string;
  story: string;
  silhouette: string;
  scale: string;
  materials: string[];
  care: string;
  setting: string;
  fulfilment: string;
}

export const FIRST_COLLECTION = {
  name: 'The First Threshold Edit',
  kicker: 'Moodoor / First release',
  season: 'Autumn into winter',
  story: 'Three distinct compositions for the front door: a quiet open crescent, a generous harvest sweep, and a dark after-hours focal study. Each is designed as a small release rather than a crowded catalogue.',
  products: [
    {
      slug: 'quiet-winter-welcome',
      title: 'Quiet Winter Welcome',
      eyebrow: 'The calm study',
      formula: 'Crescent sweep',
      season: 'Winter',
      mood: ['Calm', 'Restorative'],
      palette: ['Sage', 'Ivory', 'Walnut'],
      availability: 'ready_to_release',
      price: 248,
      imageUrl: collectionImage('quiet-winter-welcome.jpg'),
      summary: 'An open crescent of boxwood, ivory peony, and pale ranunculus for a dark-wood threshold.',
      story: 'Quiet Winter Welcome leaves room for the door to breathe. A dense boxwood line carries the eye through a low, unhurried crescent; cream-white flowers gather at its edge rather than closing the ring.',
      silhouette: 'Open crescent with a generous silence arc',
      scale: 'Designed on a 24-inch wreath base',
      materials: ['Boxwood structure', 'Cream-white peony', 'Pure-white ranunculus'],
      care: 'Display beneath a sheltered overhang or indoors. Keep clear of prolonged standing moisture and store in its box between seasons.',
      setting: 'Especially at home on deep walnut, charcoal, and quieter painted doors.',
      fulfilment: 'Released in limited studio quantities. Request availability for current dispatch timing.',
    },
    {
      slug: 'harvest-hour',
      title: 'Harvest Hour',
      eyebrow: 'The warm study',
      formula: 'Asymmetric weight',
      season: 'Autumn',
      mood: ['Warm', 'Generous'],
      palette: ['Russet', 'Burgundy', 'Sage'],
      availability: 'limited_release',
      price: 286,
      imageUrl: collectionImage('harvest-hour.jpg'),
      summary: 'A warm, low-slung sweep of boxwood, cream peony, burgundy ranunculus, and bittersweet berry.',
      story: 'Harvest Hour is made to feel generous without becoming loud. Its visual weight settles low and left, while a lifted line of greens and berry makes the gesture feel gathered rather than symmetrical.',
      silhouette: 'Weighted asymmetry with an elevated foliage gesture',
      scale: 'Designed on a 24-inch wreath base',
      materials: ['Boxwood structure', 'Cream-white peony', 'Deep-burgundy ranunculus', 'Bittersweet berry accent'],
      care: 'Display beneath a sheltered overhang or indoors. Keep clear of prolonged standing moisture and store in its box between seasons.',
      setting: 'A warm contrast for charcoal, black, and traditional painted doors.',
      fulfilment: 'A small studio release. Enquire for availability, timing, and local delivery options.',
    },
    {
      slug: 'after-hours',
      title: 'After Hours',
      eyebrow: 'The dramatic study',
      formula: 'Focal trio',
      season: 'Celebration',
      mood: ['Dramatic', 'Sculptural'],
      palette: ['Ink', 'Burgundy', 'Ivory'],
      availability: 'made_to_order',
      price: 264,
      imageUrl: collectionImage('after-hours.jpg'),
      summary: 'An ink-green wreath with three ivory focal blooms, deep burgundy ranunculus, and close-set berry accents.',
      story: 'After Hours is the collection’s most formal composition. Three light focal blooms create a deliberate line across a shadowed field of boxwood and burgundy, giving the door a composed evening presence.',
      silhouette: 'Focal trio with shadowed negative space',
      scale: 'Designed on a 24-inch wreath base',
      materials: ['Boxwood structure', 'Cream-white peony', 'Deep-burgundy ranunculus', 'Dark berry accent'],
      care: 'Display beneath a sheltered overhang or indoors. Keep clear of prolonged standing moisture and store in its box between seasons.',
      setting: 'Built for black, midnight blue, and architectural entryways.',
      fulfilment: 'Made in a limited studio cadence. Enquire with your preferred delivery or collection date.',
    },
  ] satisfies CollectionProduct[],
} as const;

export function getFirstCollectionProduct(slug: string | undefined): CollectionProduct | undefined {
  return FIRST_COLLECTION.products.find((product) => product.slug === slug);
}

export function collectionAvailabilityLabel(availability: CollectionAvailability): string {
  if (availability === 'ready_to_release') return 'First release';
  if (availability === 'limited_release') return 'Small release';
  return 'Made to order';
}
