import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { experiences, experience_windows, experience_windows_map, races } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildAffiliateUrl } from '../src/lib/affiliates';

/**
 * Seed script for 35 Melbourne experiences (7 per category)
 *
 * Categories: food, culture, adventure, daytrip, nightlife
 * Each experience is mapped to the experience windows where it fits
 * based on duration and time-of-day suitability.
 *
 * Depends on: seed-race.ts (melbourne-2026 race + 8 experience windows)
 * Run: npx tsx src/data/seed-experiences.ts
 */

interface ExperienceSeed {
  title: string;
  description: string;
  short_description: string;
  abstract?: string;
  category: 'food' | 'culture' | 'adventure' | 'daytrip' | 'nightlife';
  duration_hours: string;
  duration_label: string;
  price_amount: string;
  price_currency: string;
  price_label: string;
  rating: string;
  review_count: number;
  image_emoji: string;
  affiliate_base_url: string;
  affiliate_product_id: string;
  is_featured: boolean;
  tag: string | null;
  sort_order: number;
  windows: string[];
}

const EXPERIENCES: ExperienceSeed[] = [
  // =============================================
  // FOOD & COFFEE (7)
  // =============================================
  {
    title: 'Melbourne Laneways & Hidden Bars Food Tour',
    description: 'Discover Melbourne\'s legendary laneway culture on this guided walking tour through the city\'s best-kept secrets. Sample dishes from hole-in-the-wall eateries, rooftop bars, and underground speakeasies while your local guide shares stories of Melbourne\'s culinary evolution. Includes 7-8 authentic tastings featuring indigenous meats, artisan cheese, chocolate, and specialty coffee.',
    short_description: 'Explore Melbourne\'s iconic laneways with tastings at hidden bars and hole-in-the-wall eateries led by a local guide.',
    abstract: 'Melbourne\'s iconic laneways food tour — 7-8 tastings at hidden bars and rooftop speakeasies in the CBD. From A$130. Ideal between F1 practice sessions.',
    category: 'food',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '130.00',
    price_currency: 'AUD',
    price_label: 'A$130',
    rating: '4.8',
    review_count: 2341,
    image_emoji: '🍜',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-laneways-food-tour-with-7-authentic-tastings-t203662/',
    affiliate_product_id: 't203662',
    is_featured: true,
    tag: 'Most Popular',
    sort_order: 1,
    windows: ['thu-full', 'fri-morning', 'fri-evening', 'sat-morning', 'sat-evening', 'sun-morning', 'sun-evening'],
  },
  {
    title: 'Queen Victoria Market Foodie Tour',
    description: 'Join a guided grazing tour through Melbourne\'s beloved Queen Victoria Market, one of the largest open-air markets in the Southern Hemisphere. Taste your way through artisan cheese, cured meats, freshly baked pastries, and seasonal produce while learning the market\'s 140-year history. Includes a market shopping bag and $5 voucher.',
    short_description: 'Guided tasting tour through Melbourne\'s iconic Queen Victoria Market with generous samples and market history.',
    abstract: 'Guided grazing through Queen Vic Market — artisan cheese, cured meats, pastries and 140-year history. From A$99. Great for race Thursday and mornings.',
    category: 'food',
    duration_hours: '2.5',
    duration_label: '2.5 hrs',
    price_amount: '99.00',
    price_currency: 'AUD',
    price_label: 'A$99',
    rating: '4.7',
    review_count: 1876,
    image_emoji: '🥐',
    affiliate_base_url: 'https://www.getyourguide.com/queen-victoria-market-l3981/melbourne-ultimate-queen-victoria-market-foodie-tour-t103559/',
    affiliate_product_id: 't103559',
    is_featured: true,
    tag: null,
    sort_order: 2,
    windows: ['thu-full', 'fri-morning', 'fri-evening', 'sat-morning', 'sat-evening', 'sun-morning', 'sun-evening'],
  },
  {
    title: 'Melbourne Coffee Culture Walking Tour',
    description: 'Dive into Melbourne\'s world-famous coffee scene on this small-group walking tour through backstreet cafes and specialty roasters. Learn the crop-to-cup story, compare espresso and filter techniques, and discover why Melbourne is considered one of the best coffee cities on earth. Starts at the iconic Degraves Street.',
    short_description: 'Small-group walking tour through Melbourne\'s backstreet cafes exploring the city\'s world-famous coffee culture.',
    abstract: 'World-famous coffee city, one café at a time. Backstreet roasters and espresso bars from Degraves St. A$65 · 2 hrs · Fits any practice-day morning.',
    category: 'food',
    duration_hours: '2.0',
    duration_label: '2 hrs',
    price_amount: '65.00',
    price_currency: 'AUD',
    price_label: 'A$65',
    rating: '4.9',
    review_count: 982,
    image_emoji: '☕',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-central-l16063/melbourne-coffee-lovers-walk-t73067/',
    affiliate_product_id: 't73067',
    is_featured: false,
    tag: null,
    sort_order: 3,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Yarra Valley Wine & Food Day Tour',
    description: 'Escape Melbourne for a full day in the stunning Yarra Valley wine region. Visit premium wineries including St Hubert\'s and Rochford Wines, sample award-winning cool-climate wines, and enjoy a gourmet lunch with gin tasting. Stop at the Yarra Valley Chocolaterie and take home a bottle of your favourite wine.',
    short_description: 'Full-day wine tour through the Yarra Valley with premium tastings, gourmet lunch, and chocolaterie visit.',
    abstract: 'Yarra Valley wine escape — 4 premium estates, cool-climate tastings, chocolaterie, and gourmet lunch. A$145. Best on Thursday pre-race day.',
    category: 'food',
    duration_hours: '8.0',
    duration_label: 'Full day',
    price_amount: '145.00',
    price_currency: 'AUD',
    price_label: 'A$145',
    rating: '4.7',
    review_count: 2156,
    image_emoji: '🍷',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-yarra-valley-food-wine-chocolate-gin-tour-t460087/',
    affiliate_product_id: 't460087',
    is_featured: false,
    tag: 'Top Rated',
    sort_order: 4,
    windows: ['thu-full'],
  },
  {
    title: 'Melbourne Street Food & Night Market Tour',
    description: 'Experience Melbourne after dark on this guided evening food tour through the city\'s vibrant night markets and laneway restaurants. Visit at least four stops for a full meal spanning dumplings, fusion street food, and sweet treats, plus an included drink at a hidden bar. Explores Chinatown, Hardware Lane, and surrounding precincts.',
    short_description: 'Evening walking tour through Melbourne\'s night markets and laneway restaurants with a full meal across multiple stops.',
    abstract: 'After-dark food walk through Chinatown and Hardware Lane — dumplings, fusion street food, and a hidden bar. A$89 · 3 hrs · Perfect for F1 evenings.',
    category: 'food',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '89.00',
    price_currency: 'AUD',
    price_label: 'A$89',
    rating: '4.6',
    review_count: 743,
    image_emoji: '🍢',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-guided-night-time-food-walking-tour-t417799/',
    affiliate_product_id: 't417799',
    is_featured: false,
    tag: null,
    sort_order: 5,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
  {
    title: 'South Melbourne Market Grazing Tour',
    description: 'Graze your way through the historic South Melbourne Market on this intimate foodie tour. Sample everything from freshly shucked oysters to dim sims (invented here in 1945), artisan breads, and specialty coffee. Your guide shares the stories behind the stalls and connects you with the traders who make this market a Melbourne institution.',
    short_description: 'Intimate grazing tour through the historic South Melbourne Market sampling local specialties and meeting traders.',
    abstract: 'Oysters, dim sims (invented here 1945), artisan bread, and specialty coffee at South Melbourne Market. A$85 · 2 hrs. Open mornings all weekend.',
    category: 'food',
    duration_hours: '2.0',
    duration_label: '2 hrs',
    price_amount: '85.00',
    price_currency: 'AUD',
    price_label: 'A$85',
    rating: '4.5',
    review_count: 412,
    image_emoji: '🧀',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/south-melbourne-market-foodie-tour-t821964/',
    affiliate_product_id: 't821964',
    is_featured: false,
    tag: null,
    sort_order: 6,
    windows: ['thu-full', 'fri-morning', 'fri-evening', 'sat-morning', 'sat-evening', 'sun-morning', 'sun-evening'],
  },
  {
    title: 'Craft Beer & Brewery Walk: Collingwood',
    description: 'Discover Melbourne\'s thriving craft beer scene on this small-group brewery walk through the inner-city neighbourhood of Collingwood. Visit three independent breweries and taprooms along Smith Street, sampling tasting paddles and pairing snacks at each. Your guide breaks down brewing styles from pale ales to sours while sharing the stories behind Melbourne\'s beer revolution.',
    short_description: 'Small-group brewery walk through Collingwood visiting three craft breweries with tasting paddles and snacks.',
    abstract: 'Three Collingwood craft breweries on Smith Street with tasting paddles and snacks. A$95 · 3 hrs. Fits Friday and Saturday evening race gaps.',
    category: 'food',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '95.00',
    price_currency: 'AUD',
    price_label: 'A$95',
    rating: '4.6',
    review_count: 567,
    image_emoji: '🍺',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-evening-craft-beer-tour-t140826/',
    affiliate_product_id: 't140826',
    is_featured: false,
    tag: null,
    sort_order: 7,
    windows: ['thu-full', 'fri-morning', 'fri-evening', 'sat-morning', 'sat-evening', 'sun-morning', 'sun-evening'],
  },

  // =============================================
  // CULTURE & ART (7)
  // =============================================
  {
    title: 'Melbourne Street Art & Laneways Tour',
    description: 'Explore Melbourne\'s world-renowned street art scene on a walking tour led by an actual street artist. Wander through Hosier Lane, AC/DC Lane, and hidden alleyways to discover ever-changing murals, paste-ups, and stencil art. Learn about the artists, techniques, and the cultural movement that makes Melbourne the street art capital of Australia.',
    short_description: 'Walking tour through Melbourne\'s famous laneways and street art hotspots led by a working street artist.',
    abstract: 'Hosier Lane, AC/DC Lane, and hidden alleys with a working street artist as guide. A$39 · 2 hrs · Best value culture activity near the CBD.',
    category: 'culture',
    duration_hours: '2.0',
    duration_label: '2 hrs',
    price_amount: '39.00',
    price_currency: 'AUD',
    price_label: 'A$39',
    rating: '4.8',
    review_count: 3214,
    image_emoji: '🎨',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-street-art-walking-tour-with-a-street-artist-t68339/',
    affiliate_product_id: 't68339',
    is_featured: false,
    tag: 'Best Value',
    sort_order: 8,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'NGV & Arts Precinct Guided Tour',
    description: 'Take a guided walk through Melbourne\'s cultural heart, the Arts Precinct along St Kilda Road. Visit the iconic National Gallery of Victoria, explore Federation Square\'s architecture, and discover the surrounding galleries and performance spaces. Your guide provides insights into both the art and the buildings that house Melbourne\'s creative soul.',
    short_description: 'Guided cultural walk through Melbourne\'s Arts Precinct including the NGV, Federation Square, and surrounding galleries.',
    abstract: 'NGV, Federation Square, and the full Arts Precinct on St Kilda Road explored in 2.5 hrs. A$55 · Easy morning activity before Saturday qualifying.',
    category: 'culture',
    duration_hours: '2.5',
    duration_label: '2.5 hrs',
    price_amount: '55.00',
    price_currency: 'AUD',
    price_label: 'A$55',
    rating: '4.5',
    review_count: 389,
    image_emoji: '🖼️',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/icons-of-melbourne-walking-tour-t922788/',
    affiliate_product_id: 't922788',
    is_featured: false,
    tag: null,
    sort_order: 9,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Aboriginal Heritage Walking Tour',
    description: 'Walk the traditional lands of the Kulin Nation on this culturally immersive tour led by an Aboriginal guide. Follow the Birrarung (Yarra River) to significant meeting places and learn about 60,000+ years of continuous culture, Dreamtime stories, and the ongoing connection between Aboriginal people and the Melbourne landscape.',
    short_description: 'Aboriginal-led walking tour exploring Kulin Nation heritage sites along the Yarra River and through Melbourne.',
    abstract: 'Aboriginal-led walk through Kulin Nation heritage sites on the Yarra River (Birrarung). A$69 · 2 hrs · One of Melbourne\'s most unique cultural experiences.',
    category: 'culture',
    duration_hours: '2.0',
    duration_label: '2 hrs',
    price_amount: '69.00',
    price_currency: 'AUD',
    price_label: 'A$69',
    rating: '4.9',
    review_count: 621,
    image_emoji: '🪃',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-aboriginal-heritage-walking-tour-t1065776/',
    affiliate_product_id: 't1065776',
    is_featured: false,
    tag: null,
    sort_order: 10,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Melbourne History & Architecture Walk',
    description: 'Trace Melbourne\'s transformation from a gold rush settlement to a modern metropolis on this guided history walk. Discover Victorian-era arcades, grand public buildings, and hidden architectural gems from the State Library to Federation Square. Your guide brings to life the stories of boom, bust, and reinvention that shaped Australia\'s cultural capital.',
    short_description: 'Guided walking tour through Melbourne\'s architectural highlights from gold rush grandeur to modern landmarks.',
    abstract: 'Gold rush arcades to Federation Square on foot — Melbourne\'s architectural transformation in 2 hrs. A$45 · Ideal Friday morning or post-race Sunday.',
    category: 'culture',
    duration_hours: '2.0',
    duration_label: '2 hrs',
    price_amount: '45.00',
    price_currency: 'AUD',
    price_label: 'A$45',
    rating: '4.6',
    review_count: 534,
    image_emoji: '🏛️',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/ultimate-melbourne-walking-tour-history-laneways-culture-t228322/',
    affiliate_product_id: 't228322',
    is_featured: false,
    tag: null,
    sort_order: 11,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Old Melbourne Gaol Night Tour',
    description: 'Step inside one of Melbourne\'s most haunted buildings after dark on this atmospheric night tour of the Old Melbourne Gaol. Walk the same corridors as Ned Kelly in his final hours, explore the eerie cell blocks, and hear chilling tales of crime and punishment in colonial Victoria. Not for the faint-hearted.',
    short_description: 'After-dark tour of the Old Melbourne Gaol exploring haunted cell blocks and stories of colonial crime.',
    abstract: 'Walk Ned Kelly\'s corridor after dark — chilling cell blocks and colonial crime stories. A$42 · 1.5 hrs · Fits any F1 evening including race-day night.',
    category: 'culture',
    duration_hours: '1.5',
    duration_label: '1.5 hrs',
    price_amount: '42.00',
    price_currency: 'AUD',
    price_label: 'A$42',
    rating: '4.4',
    review_count: 876,
    image_emoji: '👻',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/old-melbourne-gaol-entry-ticket-souvenir-t1062976/',
    affiliate_product_id: 't1062976',
    is_featured: false,
    tag: null,
    sort_order: 12,
    windows: ['thu-full', 'fri-morning', 'fri-gap', 'fri-evening', 'sat-morning', 'sat-evening', 'sun-morning', 'sun-evening'],
  },
  {
    title: 'Royal Botanic Gardens Guided Walk',
    description: 'Enjoy a peaceful guided walk through Melbourne\'s Royal Botanic Gardens, home to over 8,500 plant species from around the world. Stroll past ornamental lakes, heritage-listed trees, and themed garden beds while your guide shares botanical insights and stories of the gardens\' 170-year history. A tranquil escape minutes from the CBD.',
    short_description: 'Guided walk through Melbourne\'s Royal Botanic Gardens discovering 8,500+ plant species and heritage landscapes.',
    abstract: '8,500 plant species and 170 years of heritage in Melbourne\'s botanic gardens. A$35 · 1.5 hrs · Low-key morning reset between race sessions.',
    category: 'culture',
    duration_hours: '1.5',
    duration_label: '1.5 hrs',
    price_amount: '35.00',
    price_currency: 'AUD',
    price_label: 'A$35',
    rating: '4.5',
    review_count: 298,
    image_emoji: '🌿',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-melbourne-gardens-the-explorer-tour-t408046/',
    affiliate_product_id: 't408046',
    is_featured: false,
    tag: null,
    sort_order: 13,
    windows: ['thu-full', 'fri-morning', 'fri-gap', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Fitzroy & Collingwood Cultural Walk',
    description: 'Discover Melbourne\'s most creative neighbourhoods on this walking tour through Fitzroy and Collingwood. Explore Brunswick and Smith Streets, peek into independent galleries, vintage shops, and artist studios, and admire large-scale street art murals. Your guide reveals the bohemian history and cultural evolution of these inner-city suburbs.',
    short_description: 'Walking tour through Fitzroy and Collingwood exploring street art, galleries, and Melbourne\'s bohemian subculture.',
    abstract: 'Brunswick Street galleries, vintage shops, and large-scale murals through Melbourne\'s creative heartland. A$49 · 2.5 hrs · Perfect Sunday morning wind-down.',
    category: 'culture',
    duration_hours: '2.5',
    duration_label: '2.5 hrs',
    price_amount: '49.00',
    price_currency: 'AUD',
    price_label: 'A$49',
    rating: '4.7',
    review_count: 445,
    image_emoji: '🎭',
    affiliate_base_url: 'https://www.getyourguide.com/collingwood-victoria-australia-l150175/private-melbourne-fitzroy-collingwood-culture-history-t389109/',
    affiliate_product_id: 't389109',
    is_featured: false,
    tag: null,
    sort_order: 14,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },

  // =============================================
  // ADVENTURE & OUTDOORS (7)
  // =============================================
  {
    title: 'Great Ocean Road & 12 Apostles Day Trip',
    description: 'Drive one of the world\'s most scenic coastal roads on this full-day tour from Melbourne. Marvel at the towering Twelve Apostles limestone stacks, walk through ancient rainforest at Otway National Park, and spot wild koalas along the Great Ocean Road. Includes stops at Loch Ard Gorge, Apollo Bay, and Memorial Arch with commentary throughout.',
    short_description: 'Full-day tour along the Great Ocean Road visiting the Twelve Apostles, rainforest walks, and coastal landmarks.',
    abstract: 'Drive the Great Ocean Road to the Twelve Apostles — rainforest, koalas, and coastal drama. A$115. Full-day best on pre-race Thursday.',
    category: 'adventure',
    duration_hours: '12.0',
    duration_label: 'Full day',
    price_amount: '115.00',
    price_currency: 'AUD',
    price_label: 'A$115',
    rating: '4.7',
    review_count: 4523,
    image_emoji: '🏖️',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/from-melbourne-great-ocean-road-12-apostles-day-tour-t11856/',
    affiliate_product_id: 't11856',
    is_featured: true,
    tag: 'Most Popular',
    sort_order: 15,
    windows: ['thu-full'],
  },
  {
    title: 'Melbourne Bike Tour: Bayside & St Kilda',
    description: 'Cruise Melbourne\'s beautiful bayside coastline on this guided cycling tour from the CBD to St Kilda and back. Pedal past the iconic Brighton Beach bathing boxes, ride along the Elwood foreshore, and explore the quirky charm of Acland Street. Includes bike, helmet, and refreshments at a local cafe stop.',
    short_description: 'Guided cycling tour along Melbourne\'s coastline past Brighton Beach boxes and St Kilda foreshore with refreshments.',
    abstract: 'Pedal Melbourne\'s coastline from the CBD to St Kilda — Brighton\'s bathing boxes, Elwood foreshore, café stop. A$79 · 3 hrs · Morning sessions only.',
    category: 'adventure',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '79.00',
    price_currency: 'AUD',
    price_label: 'A$79',
    rating: '4.8',
    review_count: 687,
    image_emoji: '🚴',
    affiliate_base_url: 'https://www.getyourguide.com/st-kilda-l118285/melbourne-bayside-cycling-tour-with-refreshments-t344781/',
    affiliate_product_id: 't344781',
    is_featured: false,
    tag: null,
    sort_order: 16,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Kayak Melbourne: Yarra River Paddle',
    description: 'Paddle through the heart of Melbourne on this guided kayak tour along the Yarra River. Glide under Princes Bridge, past the Royal Botanic Gardens and Federation Square, and enjoy a unique perspective of the city skyline from the water. Suitable for all skill levels with stable sit-on-top kayaks and full instruction provided.',
    short_description: 'Guided kayak tour along the Yarra River paddling past Melbourne\'s skyline, gardens, and iconic bridges.',
    abstract: 'Paddle the Yarra past Federation Square and the CBD skyline on stable sit-on-top kayaks. A$89 · 2.5 hrs · All skill levels. Suits Friday and Saturday mornings.',
    category: 'adventure',
    duration_hours: '2.5',
    duration_label: '2.5 hrs',
    price_amount: '89.00',
    price_currency: 'AUD',
    price_label: 'A$89',
    rating: '4.7',
    review_count: 523,
    image_emoji: '🛶',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-city-sights-kayak-tour-t126764/',
    affiliate_product_id: 't126764',
    is_featured: false,
    tag: null,
    sort_order: 17,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Helicopter Flight Over Melbourne',
    description: 'Soar above Melbourne on a thrilling private helicopter flight with panoramic views of the city skyline, Port Phillip Bay, and the Yarra River. Fly over the MCG, Flemington Racecourse, and the CBD skyscrapers while your pilot provides live commentary. A once-in-a-lifetime perspective of Melbourne from above.',
    short_description: 'Private helicopter flight over Melbourne\'s skyline with views of the MCG, Port Phillip Bay, and CBD.',
    abstract: 'Private 30-minute helicopter over Melbourne — MCG, Port Phillip Bay, CBD skyline. A$199. Available in practice-day gaps. Instant confirmation.',
    category: 'adventure',
    duration_hours: '0.5',
    duration_label: '30 min',
    price_amount: '199.00',
    price_currency: 'AUD',
    price_label: 'A$199',
    rating: '4.9',
    review_count: 312,
    image_emoji: '🚁',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-city-skyline-and-bay-scenic-helicopter-flight-t454981/',
    affiliate_product_id: 't454981',
    is_featured: false,
    tag: 'Premium',
    sort_order: 18,
    windows: ['thu-full', 'fri-morning', 'fri-gap', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Hot Air Balloon Over Melbourne at Sunrise',
    description: 'Float above Melbourne at dawn on a magical hot air balloon flight — Melbourne is one of the only major cities in the world where you can balloon over the CBD. Watch the sunrise paint the skyline gold as you drift over parks, the Yarra River, and suburbs stretching to the Dandenong Ranges. Includes sparkling wine on landing.',
    short_description: 'Sunrise hot air balloon flight over Melbourne\'s CBD with panoramic city views and sparkling wine on landing.',
    abstract: 'Float above Melbourne\'s CBD at dawn — one of the only cities in the world you can balloon over the skyline. A$379 · 4 hrs · Thursday and Sunday only.',
    category: 'adventure',
    duration_hours: '4.0',
    duration_label: '4 hrs',
    price_amount: '379.00',
    price_currency: 'AUD',
    price_label: 'A$379',
    rating: '4.8',
    review_count: 1245,
    image_emoji: '🎈',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-1-hour-hot-air-balloon-flight-at-sunrise-t66946/',
    affiliate_product_id: 't66946',
    is_featured: true,
    tag: null,
    sort_order: 19,
    windows: ['thu-full', 'sun-morning'],
  },
  {
    title: 'Surfing Lesson at Torquay Beach',
    description: 'Catch your first wave at Torquay, the surf capital of Victoria and gateway to the Great Ocean Road. This beginner-friendly lesson includes expert coaching, wetsuit, and softboard hire on one of Australia\'s safest learning beaches. Small groups ensure plenty of one-on-one attention as you ride the waves of Bass Strait.',
    short_description: 'Beginner-friendly surf lesson at Torquay Beach with all equipment, expert coaching, and small group sizes.',
    abstract: 'Learn to surf at Torquay, Victoria\'s surf capital. Beginner coaching, wetsuit and board included. A$89 · 3 hrs · Gateway to the Great Ocean Road.',
    category: 'adventure',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '89.00',
    price_currency: 'AUD',
    price_label: 'A$89',
    rating: '4.7',
    review_count: 398,
    image_emoji: '🏄',
    affiliate_base_url: 'https://www.getyourguide.com/torquay-victoria-l184199/torquay-2-hour-surf-experience-on-the-great-ocean-road-t174198/',
    affiliate_product_id: 't174198',
    is_featured: false,
    tag: null,
    sort_order: 20,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },
  {
    title: 'Melbourne Skydive: St Kilda Beach Landing',
    description: 'Experience the ultimate adrenaline rush with a tandem skydive over Melbourne, landing on the iconic St Kilda Beach. Jump from up to 15,000 feet, freefall for 60 seconds at 220 km/h, then enjoy a 5-7 minute canopy ride with 360-degree views of the Melbourne skyline, Port Phillip Bay, and the Mornington Peninsula.',
    short_description: 'Tandem skydive from 15,000 feet with a beach landing at St Kilda and panoramic views of Melbourne.',
    abstract: '15,000ft tandem skydive with a beach landing at St Kilda — 60-second freefall, panoramic bay views. A$329 · 3 hrs · Mornings only, subject to weather.',
    category: 'adventure',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '329.00',
    price_currency: 'AUD',
    price_label: 'A$329',
    rating: '4.9',
    review_count: 456,
    image_emoji: '🪂',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-tandem-skydive-experience-over-st-kilda-beach-t366270/',
    affiliate_product_id: 't366270',
    is_featured: false,
    tag: null,
    sort_order: 21,
    windows: ['thu-full', 'fri-morning', 'sat-morning', 'sun-morning'],
  },

  // =============================================
  // DAY TRIPS (7)
  // =============================================
  {
    title: 'Phillip Island Penguin Parade Tour',
    description: 'Watch hundreds of little penguins waddle ashore at sunset on this beloved day trip to Phillip Island. Visit the Koala Conservation Centre and Churchill Island Heritage Farm before settling in for the famous Penguin Parade, where the world\'s smallest penguins return from the sea to their burrows each evening. An unforgettable wildlife experience.',
    short_description: 'Day trip to Phillip Island to see the famous Penguin Parade, koalas, and heritage farmlands at sunset.',
    abstract: 'Little penguins waddle ashore at sunset at Phillip Island — koalas and heritage farm included. A$135. Full day, Thursday departures.',
    category: 'daytrip',
    duration_hours: '8.0',
    duration_label: 'Full day',
    price_amount: '135.00',
    price_currency: 'AUD',
    price_label: 'A$135',
    rating: '4.6',
    review_count: 3876,
    image_emoji: '🐧',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/penguin-parade-afternoon-wildlife-tour-half-day-t20608/',
    affiliate_product_id: 't20608',
    is_featured: true,
    tag: 'Top Rated',
    sort_order: 22,
    windows: ['thu-full'],
  },
  {
    title: 'Mornington Peninsula: Hot Springs & Wine',
    description: 'Unwind on a luxurious day trip to the Mornington Peninsula, combining thermal hot springs with wine country. Soak in over 50 naturally heated pools at Peninsula Hot Springs, then visit boutique wineries for tastings and a gourmet lunch overlooking the vineyards. The perfect blend of relaxation and indulgence.',
    short_description: 'Day trip to the Mornington Peninsula combining natural hot springs bathing with winery tastings and lunch.',
    abstract: 'Natural thermal pools at Peninsula Hot Springs plus boutique winery tastings and gourmet lunch. A$149. Full day on Thursday, the perfect pre-race reset.',
    category: 'daytrip',
    duration_hours: '8.0',
    duration_label: 'Full day',
    price_amount: '149.00',
    price_currency: 'AUD',
    price_label: 'A$149',
    rating: '4.7',
    review_count: 1543,
    image_emoji: '♨️',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-mornington-peninsula-hot-springs-and-winery-tour-t632485/',
    affiliate_product_id: 't632485',
    is_featured: false,
    tag: null,
    sort_order: 23,
    windows: ['thu-full'],
  },
  {
    title: 'Puffing Billy Steam Train & Dandenong Ranges',
    description: 'Ride the heritage Puffing Billy steam train through the fern gullies and towering eucalyptus forests of the Dandenong Ranges. This full-day tour includes the iconic train journey from Belgrave to Gembrook, walks through ancient mountain ash forests, and a visit to a charming ranges village for lunch among the mist-covered hills.',
    short_description: 'Heritage steam train ride through the Dandenong Ranges with forest walks and a village lunch stop.',
    abstract: 'Heritage steam train through fern gullies and mountain ash forests in the Dandenong Ranges. A$109 · 6 hrs · Departures on pre-race Thursday.',
    category: 'daytrip',
    duration_hours: '6.0',
    duration_label: '6 hrs',
    price_amount: '109.00',
    price_currency: 'AUD',
    price_label: 'A$109',
    rating: '4.5',
    review_count: 2134,
    image_emoji: '🚂',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/puffing-billy-and-blue-dandenongs-t37186/',
    affiliate_product_id: 't37186',
    is_featured: false,
    tag: null,
    sort_order: 24,
    windows: ['thu-full'],
  },
  {
    title: 'Wilsons Promontory National Park Day Trip',
    description: 'Venture to Victoria\'s southernmost tip on a full-day tour to Wilsons Promontory National Park. Hike to the Mt Oberon summit for sweeping coastal views, walk the white sands of Squeaky Beach, and spot wombats, kangaroos, and emus in their natural habitat. One of Australia\'s most spectacular coastal wilderness areas.',
    short_description: 'Full-day tour to Wilsons Promontory with summit hikes, pristine beaches, and native wildlife spotting.',
    abstract: 'Victoria\'s southernmost tip — summit hike, Squeaky Beach, wombats, kangaroos, and coastal wilderness. A$159. Full day from Melbourne on Thursday.',
    category: 'daytrip',
    duration_hours: '12.0',
    duration_label: 'Full day',
    price_amount: '159.00',
    price_currency: 'AUD',
    price_label: 'A$159',
    rating: '4.8',
    review_count: 876,
    image_emoji: '🏔️',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/from-melbourne-wilsons-promontory-small-group-day-tour-t237247/',
    affiliate_product_id: 't237247',
    is_featured: false,
    tag: null,
    sort_order: 25,
    windows: ['thu-full'],
  },
  {
    title: 'Yarra Valley Winery Hopping Tour',
    description: 'Spend the day hopping between the Yarra Valley\'s finest wineries on this guided tour from Melbourne. Enjoy tastings at four premium estates specialising in pinot noir, chardonnay, and sparkling wine, with a gourmet lunch at a winery restaurant overlooking the vines. The rolling green hills and cool-climate vineyards make for a stunning backdrop.',
    short_description: 'Guided day tour visiting four Yarra Valley wineries with premium tastings and a gourmet winery lunch.',
    abstract: 'Four Yarra Valley estates with pinot noir and chardonnay tastings, plus a winery restaurant lunch. A$129 · 7 hrs · Pre-race Thursday special.',
    category: 'daytrip',
    duration_hours: '7.0',
    duration_label: '7 hrs',
    price_amount: '129.00',
    price_currency: 'AUD',
    price_label: 'A$129',
    rating: '4.6',
    review_count: 1987,
    image_emoji: '🍇',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/yarra-valley-wine-experience-t60158/',
    affiliate_product_id: 't60158',
    is_featured: false,
    tag: null,
    sort_order: 26,
    windows: ['thu-full'],
  },
  {
    title: 'Healesville Sanctuary Wildlife Experience',
    description: 'Get up close with Australia\'s most iconic wildlife at Healesville Sanctuary in the Yarra Ranges. Meet koalas, kangaroos, wombats, and the elusive platypus in naturalistic bushland habitats. Watch the spectacular Birds of Prey show and learn about conservation efforts protecting endangered species. A must for animal lovers.',
    short_description: 'Visit Healesville Sanctuary to meet koalas, kangaroos, platypus, and watch the Birds of Prey show.',
    abstract: 'Koalas, wombats, kangaroos, platypus, and a live Birds of Prey show at Healesville Sanctuary. A$89 · Half day · Available Thursday or post-race Sunday.',
    category: 'daytrip',
    duration_hours: '5.0',
    duration_label: 'Half day',
    price_amount: '89.00',
    price_currency: 'AUD',
    price_label: 'A$89',
    rating: '4.6',
    review_count: 1432,
    image_emoji: '🦘',
    affiliate_base_url: 'https://www.getyourguide.com/healesville-sanctuary-l32694/healesville-sanctuary-general-admission-ticket-t66109/',
    affiliate_product_id: 't66109',
    is_featured: false,
    tag: null,
    sort_order: 27,
    windows: ['thu-full', 'sun-morning'],
  },
  {
    title: 'Grampians National Park Eco Day Tour',
    description: 'Escape Melbourne for a full day in Victoria\'s iconic Grampians National Park on this small-group eco tour with Go West. Walk through the Grand Canyon trail, stand at the base of Mackenzie Falls, and spot wild kangaroos and emus in Halls Gap. Morning tea stop at the Eureka Rebellion site in Ballarat and lunch in the Grampians village. A world-class natural landscape just 3 hours from the city.',
    short_description: 'Small-group eco day tour to the Grampians from Melbourne with wildlife spotting, waterfall walks, and a stop at Ballarat\'s Eureka Centre.',
    abstract: 'Small-group eco tour to the Grampians — Grand Canyon trail, Mackenzie Falls, wild kangaroos, and Ballarat stop. A$175. Thursday departures only.',
    category: 'daytrip',
    duration_hours: '14.0',
    duration_label: 'Full day',
    price_amount: '175.00',
    price_currency: 'AUD',
    price_label: 'A$175',
    rating: '4.8',
    review_count: 8240,
    image_emoji: '🦅',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/grampians-national-park-eco-tour-from-melbourne-t53623/',
    affiliate_product_id: 't53623',
    is_featured: false,
    tag: null,
    sort_order: 28,
    windows: ['thu-full'],
  },

  // =============================================
  // NIGHTLIFE (7)
  // =============================================
  {
    title: 'Melbourne Rooftop Bar Crawl',
    description: 'See Melbourne from above on this guided rooftop bar crawl through the CBD. Visit four of the city\'s best rooftop venues, from hidden gems accessible through unmarked doorways to panoramic sky bars with views across the skyline. Includes a welcome drink at each stop and skip-the-line entry. Small groups keep it social.',
    short_description: 'Guided crawl through four of Melbourne\'s best rooftop bars with welcome drinks and skip-the-line entry.',
    abstract: 'Four of Melbourne\'s best rooftop bars with welcome drinks and skip-the-line entry. A$89 · 3.5 hrs · Ideal Thursday–Sunday evenings after sessions.',
    category: 'nightlife',
    duration_hours: '3.5',
    duration_label: '3.5 hrs',
    price_amount: '89.00',
    price_currency: 'AUD',
    price_label: 'A$89',
    rating: '4.5',
    review_count: 654,
    image_emoji: '🍸',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-citys-history-and-unique-bar-scene-tour-t107935/',
    affiliate_product_id: 't107935',
    is_featured: false,
    tag: null,
    sort_order: 29,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
  {
    title: 'Hidden Speakeasy & Cocktail Tour',
    description: 'Unlock Melbourne\'s secret cocktail scene on this after-dark tour through hidden speakeasy bars. Navigate unmarked doors, concealed staircases, and password-protected entrances to discover venues most locals don\'t even know about. Includes two complimentary craft cocktails and insider stories about Melbourne\'s prohibition-era drinking culture.',
    short_description: 'After-dark tour through Melbourne\'s hidden speakeasy bars with craft cocktails and secret entrances.',
    abstract: 'Two craft cocktails and secret entrances through Melbourne\'s prohibition-era speakeasy circuit. A$110 · 3 hrs · Best on Friday and Saturday evenings.',
    category: 'nightlife',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '110.00',
    price_currency: 'AUD',
    price_label: 'A$110',
    rating: '4.7',
    review_count: 892,
    image_emoji: '🥃',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/hidden-bar-tour-t70866/',
    affiliate_product_id: 't70866',
    is_featured: false,
    tag: null,
    sort_order: 30,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
  {
    title: 'Melbourne Live Music Pub Crawl',
    description: 'Experience Melbourne\'s legendary live music scene on this guided pub crawl through the city\'s best music venues. From intimate jazz bars to gritty rock pubs, visit three to four venues across the CBD, Fitzroy, and Collingwood. Includes cover charges, a drink at the first venue, and insider knowledge from a local music scene guide.',
    short_description: 'Guided pub crawl through Melbourne\'s best live music venues spanning jazz bars to rock pubs.',
    abstract: 'Jazz bars to rock pubs — Melbourne\'s legendary live music scene in one guided evening. A$79 · 3 hrs · Post-qualifying Friday and race-day Saturday.',
    category: 'nightlife',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '79.00',
    price_currency: 'AUD',
    price_label: 'A$79',
    rating: '4.5',
    review_count: 423,
    image_emoji: '🎵',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-weekly-bar-crawl-5-free-shots-club-entry-t607300/',
    affiliate_product_id: 't607300',
    is_featured: false,
    tag: null,
    sort_order: 31,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
  {
    title: 'Melbourne: Uncover Hidden Laneway Bars',
    description: 'Melbourne hides dozens of bars behind unmarked doors, through back alleys, and up secret staircases. This guided experience takes you through the CBD\'s hidden laneway bar scene — from tiny speakeasies tucked inside convenience stores to rooftop bars hidden above ordinary shopfronts. Discover why Melbourne is considered one of the world\'s great bar cities, one secret door at a time.',
    short_description: 'Self-guided exploration of Melbourne\'s most secretive laneway bars with insider tips on unmarked doors and hidden gems.',
    abstract: 'Hidden bars inside convenience stores and above shopfronts — Melbourne\'s most secretive laneway circuit. A$79 · 3 hrs · Any F1 evening, self-paced.',
    category: 'nightlife',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '79.00',
    price_currency: 'AUD',
    price_label: 'A$79',
    rating: '4.6',
    review_count: 634,
    image_emoji: '🚪',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/the-melbourne-un-pub-crawl-t107419/',
    affiliate_product_id: 't107419',
    is_featured: false,
    tag: null,
    sort_order: 32,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
  {
    title: 'Haunted Melbourne Ghost Tour',
    description: 'Explore Melbourne\'s dark side on this spine-tingling ghost tour through the city\'s most haunted locations. Walk the shadowy laneways, hear tales of unsolved murders, visit Chinatown\'s opium den ruins, and learn about the ghosts said to roam Melbourne\'s oldest buildings. Departs at 8:30 PM for maximum atmospheric effect.',
    short_description: 'Evening ghost tour through Melbourne\'s most haunted laneways and historic sites with chilling true stories.',
    abstract: 'Shadowy laneways, opium den ruins, and unsolved murders — Melbourne\'s most haunted sites after dark. A$39 · 2 hrs · Departs 8:30 PM every evening.',
    category: 'nightlife',
    duration_hours: '2.0',
    duration_label: '2 hrs',
    price_amount: '39.00',
    price_currency: 'AUD',
    price_label: 'A$39',
    rating: '4.4',
    review_count: 1234,
    image_emoji: '🌙',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-15-hour-ghost-tour-t41517/',
    affiliate_product_id: 't41517',
    is_featured: false,
    tag: null,
    sort_order: 33,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
  {
    title: 'Melbourne River Cruise with Dinner',
    description: 'Cruise the Yarra River aboard the Spirit of Melbourne for a luxurious 4-course dinner with drinks. Glide past the illuminated skyline, Federation Square, Flinders Street Station, and the Docklands while enjoying modern Australian cuisine prepared on board. A refined way to experience Melbourne by night.',
    short_description: 'Dinner cruise on the Yarra River with a 4-course meal, drinks, and illuminated skyline views.',
    abstract: '4-course dinner on the Yarra River with the illuminated city skyline drifting past. A$129 · 3 hrs · Refined race-night dining on the Spirit of Melbourne.',
    category: 'nightlife',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '129.00',
    price_currency: 'AUD',
    price_label: 'A$129',
    rating: '4.3',
    review_count: 1567,
    image_emoji: '🛥️',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/melbourne-dinner-cruise-with-a-4-course-meal-and-drinks-t157506/',
    affiliate_product_id: 't157506',
    is_featured: false,
    tag: null,
    sort_order: 34,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
  {
    title: 'Casino & Southbank Evening Experience',
    description: 'Enjoy a glamorous evening along Melbourne\'s Southbank precinct, taking in the Crown Casino\'s famous fire show, riverside dining, and stylish bars. Stroll the promenade with views of the illuminated Arts Centre spire, try your luck at the tables, and soak up the electric atmosphere of Melbourne\'s premier entertainment district.',
    short_description: 'Evening experience along Southbank with the Crown Casino fire show, riverside dining, and waterfront bars.',
    abstract: 'Crown Casino fire show, riverside dining, and Southbank\'s waterfront bars on a glamorous evening. A$59 · 3 hrs · Walking distance from the CBD hotels.',
    category: 'nightlife',
    duration_hours: '3.0',
    duration_label: '3 hrs',
    price_amount: '59.00',
    price_currency: 'AUD',
    price_label: 'A$59',
    rating: '4.2',
    review_count: 345,
    image_emoji: '🎰',
    affiliate_base_url: 'https://www.getyourguide.com/melbourne-l202/luxury-sunset-cruise-on-yarra-river-in-melbourne-t636610/',
    affiliate_product_id: 't636610',
    is_featured: false,
    tag: null,
    sort_order: 35,
    windows: ['thu-full', 'fri-evening', 'sat-evening', 'sun-evening'],
  },
];

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });

  const db = drizzle(pool);

  console.log('[seed-exp] Connected to database');

  // --- 1. Look up the Melbourne 2026 race ---
  const [race] = await db.select().from(races).where(eq(races.slug, 'melbourne-2026'));
  if (!race) {
    console.log('[seed-exp] ERROR: Melbourne 2026 race not found. Run seed-race.ts first.');
    await pool.end();
    return;
  }
  const raceId = race.id;
  console.log('[seed-exp] Found race: melbourne-2026 (id:', raceId, ')');

  // --- 2. Check idempotency ---
  const existing = await db.select().from(experiences).where(eq(experiences.race_id, raceId)).limit(1);
  if (existing.length > 0) {
    console.log('[seed-exp] Experiences already seeded for race id:', raceId);
    console.log('[seed-exp] To re-seed, delete existing data first:');
    console.log(`  DELETE FROM experience_windows_map WHERE experience_id IN (SELECT id FROM experiences WHERE race_id = ${raceId});`);
    console.log(`  DELETE FROM experiences WHERE race_id = ${raceId};`);
    await pool.end();
    return;
  }

  // --- 3. Build window slug -> id lookup ---
  const windows = await db.select().from(experience_windows).where(eq(experience_windows.race_id, raceId));
  const windowBySlug = new Map(windows.map(w => [w.slug, w.id]));
  console.log('[seed-exp] Found', windows.length, 'experience windows');

  if (windows.length === 0) {
    console.log('[seed-exp] ERROR: No experience windows found. Run seed-race.ts first.');
    await pool.end();
    return;
  }

  // --- 4. Insert each experience + window mappings ---
  let totalMappings = 0;

  for (const exp of EXPERIENCES) {
    const slug = exp.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Insert experience with placeholder affiliate URL
    const [result] = await db.insert(experiences).values({
      race_id: raceId,
      title: exp.title,
      slug,
      description: exp.description,
      short_description: exp.short_description,
      abstract: exp.abstract ?? null,
      category: exp.category,
      duration_hours: exp.duration_hours,
      duration_label: exp.duration_label,
      price_amount: exp.price_amount,
      price_currency: exp.price_currency,
      price_label: exp.price_label,
      rating: exp.rating,
      review_count: exp.review_count,
      image_url: null,
      image_emoji: exp.image_emoji,
      affiliate_partner: 'getyourguide',
      affiliate_url: '',
      affiliate_product_id: exp.affiliate_product_id,
      is_featured: exp.is_featured,
      tag: exp.tag,
      sort_order: exp.sort_order,
      is_active: true,
    });

    const experienceId = result.insertId;

    // Build affiliate URL with real DB id and update the row
    const affiliateUrl = buildAffiliateUrl(exp.affiliate_base_url, experienceId, 'feed');
    await db.update(experiences)
      .set({ affiliate_url: affiliateUrl })
      .where(eq(experiences.id, experienceId));

    // Insert window mappings
    for (const windowSlug of exp.windows) {
      const windowId = windowBySlug.get(windowSlug);
      if (!windowId) {
        console.warn(`[seed-exp] WARNING: Window slug "${windowSlug}" not found, skipping`);
        continue;
      }
      await db.insert(experience_windows_map).values({
        experience_id: experienceId,
        window_id: windowId,
      });
      totalMappings++;
    }

    console.log(`[seed-exp] Inserted: ${exp.title} (${exp.windows.length} windows)`);
  }

  // --- Done ---
  console.log(`[seed-exp] Done! Seeded ${EXPERIENCES.length} experiences with ${totalMappings} window mappings`);
  await pool.end();
}

seed().catch((err) => {
  console.error('[seed-exp] Failed:', err);
  process.exit(1);
});
