import { mysqlTable, int, varchar, year, decimal, char, date, timestamp, mysqlEnum, time, boolean, json, bigint, primaryKey, text } from "drizzle-orm/mysql-core";

export const races = mysqlTable("races", {
    id: int("id").primaryKey().autoincrement(),
    slug: varchar("slug", { length: 100 }).unique(),
    name: varchar("name", { length: 255 }),
    season: year("season"),
    round: int("round"),
    circuit_name: varchar("circuit_name", { length: 255 }),
    city: varchar("city", { length: 100 }),
    country: varchar("country", { length: 100 }),
    country_code: char("country_code", { length: 2 }),
    circuit_lat: decimal("circuit_lat", { precision: 10, scale: 6 }),
    circuit_lng: decimal("circuit_lng", { precision: 10, scale: 6 }),
    timezone: varchar("timezone", { length: 50 }),
    race_date: date("race_date"),
    created_at: timestamp("created_at").defaultNow(),
});

export const sessions = mysqlTable("sessions", {
    id: int("id").primaryKey().autoincrement(),
    race_id: int("race_id").references(() => races.id),
    name: varchar("name", { length: 100 }),
    short_name: varchar("short_name", { length: 20 }),
    day_of_week: mysqlEnum("day_of_week", ["Thursday", "Friday", "Saturday", "Sunday"]),
    start_time: time("start_time"),
    end_time: time("end_time"),
    session_type: mysqlEnum("session_type", ["practice", "qualifying", "sprint", "race", "support", "event"]),
    created_at: timestamp("created_at").defaultNow(),
});

export const experience_windows = mysqlTable("experience_windows", {
    id: int("id").primaryKey().autoincrement(),
    race_id: int("race_id").references(() => races.id),
    slug: varchar("slug", { length: 50 }),
    label: varchar("label", { length: 100 }),
    day_of_week: mysqlEnum("day_of_week", ["Thursday", "Friday", "Saturday", "Sunday"]),
    start_time: time("start_time"),
    end_time: time("end_time"),
    max_duration_hours: decimal("max_duration_hours", { precision: 3, scale: 1 }),
    description: text("description"),
    sort_order: int("sort_order"),
    created_at: timestamp("created_at").defaultNow(),
});

export const experiences = mysqlTable("experiences", {
    id: int("id").primaryKey().autoincrement(),
    race_id: int("race_id").references(() => races.id),
    title: varchar("title", { length: 255 }),
    slug: varchar("slug", { length: 255 }),
    description: text("description"),
    short_description: varchar("short_description", { length: 500 }),
    abstract: text("abstract"),
    category: mysqlEnum("category", ["food", "culture", "adventure", "daytrip", "nightlife"]),
    duration_hours: decimal("duration_hours", { precision: 3, scale: 1 }),
    duration_label: varchar("duration_label", { length: 50 }),
    price_amount: decimal("price_amount", { precision: 10, scale: 2 }),
    price_currency: varchar("price_currency", { length: 3 }),
    price_label: varchar("price_label", { length: 50 }),
    rating: decimal("rating", { precision: 3, scale: 1 }),
    review_count: int("review_count"),
    image_url: varchar("image_url", { length: 500 }),
    image_emoji: varchar("image_emoji", { length: 10 }),
    affiliate_partner: varchar("affiliate_partner", { length: 50 }),
    affiliate_url: varchar("affiliate_url", { length: 1000 }),
    affiliate_product_id: varchar("affiliate_product_id", { length: 100 }),
    is_featured: boolean("is_featured").default(false),
    tag: varchar("tag", { length: 50 }),
    sort_order: int("sort_order"),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at").defaultNow(),
    // Enrichment columns (populated by enrich-from-gyg.ts script)
    highlights: json("highlights"),          // string[]
    includes: json("includes"),              // string[]
    excludes: json("excludes"),              // string[]
    important_info: text("important_info"),
    photos: json("photos"),                  // string[] — GYG image URLs
    reviews_snapshot: json("reviews_snapshot"), // {author,rating,text,date}[]
    f1_context: text("f1_context"),          // Claude-generated F1 editorial
    meeting_point: text("meeting_point"),    // GYG meeting point description
    // Tour-detail enrichment columns (populated by enrich-from-gyg.ts)
    bestseller: boolean("bestseller"),
    original_price: decimal("original_price", { precision: 10, scale: 2 }),
    discount_pct: int("discount_pct"),
    has_pick_up: boolean("has_pick_up"),
    mobile_voucher: boolean("mobile_voucher"),
    instant_confirmation: boolean("instant_confirmation"),
    skip_the_line: boolean("skip_the_line"),
    options_snapshot: json("options_snapshot"),   // OptionSnapshot[]
    gyg_categories: json("gyg_categories"),       // string[]
    seo_keywords: json("seo_keywords"),           // string[] — experience-specific extra keywords
    f1_windows_label: varchar("f1_windows_label", { length: 255 }), // human-readable F1 schedule label
    lat: decimal("lat", { precision: 10, scale: 7 }),
    lng: decimal("lng", { precision: 10, scale: 7 }),
    languages: json("languages"),                 // string[] — aggregated language codes across all options
    distance_km: decimal("distance_km", { precision: 5, scale: 1 }),
    neighborhood: varchar("neighborhood", { length: 100 }),
    travel_mins: int("travel_mins"),
});

export const experience_windows_map = mysqlTable("experience_windows_map", {
    experience_id: int("experience_id").references(() => experiences.id),
    window_id: int("window_id").references(() => experience_windows.id),
}, (table) => ({
    pk: primaryKey({ columns: [table.experience_id, table.window_id] }),
}));

export const itineraries = mysqlTable("itineraries", {
    id: varchar("id", { length: 12 }).primaryKey(),
    race_id: int("race_id").references(() => races.id),
    arrival_day: mysqlEnum("arrival_day", ["Wednesday", "Thursday", "Friday"]),
    departure_day: mysqlEnum("departure_day", ["Sunday", "Monday", "Tuesday"]),
    interests: json("interests"),
    group_size: int("group_size").default(1),
    itinerary_json: json("itinerary_json"),
    prompt_hash: varchar("prompt_hash", { length: 64 }),
    generation_model: varchar("generation_model", { length: 50 }),
    created_at: timestamp("created_at").defaultNow(),
    view_count: int("view_count").default(0),
    share_count: int("share_count").default(0),
});

export const affiliate_clicks = mysqlTable("affiliate_clicks", {
    id: bigint("id", { mode: "bigint" }).primaryKey().autoincrement(),
    experience_id: int("experience_id").references(() => experiences.id),
    itinerary_id: varchar("itinerary_id", { length: 12 }),
    affiliate_partner: varchar("affiliate_partner", { length: 50 }),
    source: mysqlEnum("source", ["feed", "itinerary", "featured"]),
    session_id: varchar("session_id", { length: 64 }),
    user_agent: varchar("user_agent", { length: 500 }),
    referer: varchar("referer", { length: 1000 }),
    clicked_at: timestamp("clicked_at").defaultNow(),
});

export const events = mysqlTable("events", {
    id: bigint("id", { mode: "bigint" }).primaryKey().autoincrement(),
    event_type: varchar("event_type", { length: 50 }),
    event_data: json("event_data"),
    session_id: varchar("session_id", { length: 64 }),
    page_path: varchar("page_path", { length: 255 }),
    created_at: timestamp("created_at").defaultNow(),
});

export const schedule_entries = mysqlTable("schedule_entries", {
    id: int("id").primaryKey().autoincrement(),
    race_id: int("race_id").references(() => races.id),
    day_of_week: mysqlEnum("day_of_week", ["Thursday", "Friday", "Saturday", "Sunday"]).notNull(),
    start_time: time("start_time").notNull(),
    end_time: time("end_time").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    series: varchar("series", { length: 100 }),
    series_key: varchar("series_key", { length: 50 }),
    sort_order: int("sort_order"),
    created_at: timestamp("created_at").defaultNow(),
});
