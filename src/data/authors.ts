/**
 * Named authors (SEO experiment "expert-guide": a page by a named person with
 * a bio is a trust signal). Photos live in public/authors/.
 */
export interface Author {
  slug: string;
  name: string;
  /** Square photo, /authors/<slug>.jpg (240 px). */
  photo: string;
  bio: string;
  favouriteCities: string[];
  /** Other profiles of the same person (schema.org sameAs). */
  sameAs: { label: string; url: string }[];
}

export const AUTHORS: Record<string, Author> = {
  'jamshed-v-rajan': {
    slug: 'jamshed-v-rajan',
    name: 'Jamshed V Rajan',
    photo: '/authors/jamshed-v-rajan.jpg',
    bio: 'Jamshed is a versatile traveler, equally drawn to the vibrant energy of city escapes and the peaceful solitude of remote getaways. On some trips, he indulges in resort hopping, while on others, he spends little time in his accommodation, fully immersing himself in the destination. A passionate foodie, Jamshed delights in exploring local cuisines, with a particular love for flavorful non-vegetarian dishes.',
    favouriteCities: ['Amsterdam', 'Las Vegas', 'Dublin', 'Prague', 'Vienna'],
    sameAs: [{ label: 'The Better Vacation', url: 'https://thebettervacation.com/jamshed-v-rajan/' }],
  },
};

export function authorBySlug(slug: string): Author | null {
  return AUTHORS[slug] ?? null;
}

export const authorPath = (a: Pick<Author, 'slug'>) => `/authors/${a.slug}`;

/** schema.org Person for an author (used on their page and as the author of guides). */
export function authorLd(a: Author) {
  return {
    '@type': 'Person',
    name: a.name,
    url: `https://f1weekend.co${authorPath(a)}`,
    image: `https://f1weekend.co${a.photo}`,
    description: a.bio,
    sameAs: a.sameAs.map((s) => s.url),
  };
}
