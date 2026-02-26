import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, primaryKey, bigint, int, varchar, mysqlEnum, timestamp, json, time, decimal, text, longtext, unique, year, char, date } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const affiliateClicks = mysqlTable("affiliate_clicks", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	experienceId: int("experience_id").references(() => experiences.id),
	itineraryId: varchar("itinerary_id", { length: 12 }),
	affiliatePartner: varchar("affiliate_partner", { length: 50 }),
	source: mysqlEnum(['feed','itinerary','featured']),
	sessionId: varchar("session_id", { length: 64 }),
	userAgent: varchar("user_agent", { length: 500 }),
	referer: varchar({ length: 1000 }),
	clickedAt: timestamp("clicked_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "affiliate_clicks_id"}),
]);

export const events = mysqlTable("events", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	eventType: varchar("event_type", { length: 50 }),
	eventData: json("event_data"),
	sessionId: varchar("session_id", { length: 64 }),
	pagePath: varchar("page_path", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "events_id"}),
]);

export const experienceWindows = mysqlTable("experience_windows", {
	id: int().autoincrement().notNull(),
	raceId: int("race_id").references(() => races.id),
	slug: varchar({ length: 50 }),
	label: varchar({ length: 100 }),
	dayOfWeek: mysqlEnum("day_of_week", ['Thursday','Friday','Saturday','Sunday']),
	startTime: time("start_time"),
	endTime: time("end_time"),
	maxDurationHours: decimal("max_duration_hours", { precision: 3, scale: 1 }),
	description: text(),
	sortOrder: int("sort_order"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "experience_windows_id"}),
]);

export const experienceWindowsMap = mysqlTable("experience_windows_map", {
	experienceId: int("experience_id").notNull().references(() => experiences.id),
	windowId: int("window_id").notNull().references(() => experienceWindows.id),
},
(table) => [
	primaryKey({ columns: [table.experienceId, table.windowId], name: "experience_windows_map_experience_id_window_id"}),
]);

export const experiences = mysqlTable("experiences", {
	id: int().autoincrement().notNull(),
	raceId: int("race_id").references(() => races.id),
	title: varchar({ length: 255 }),
	slug: varchar({ length: 255 }),
	description: text(),
	shortDescription: varchar("short_description", { length: 500 }),
	abstract: text(),
	bestseller: tinyint(),
	category: mysqlEnum(['food','culture','adventure','daytrip','nightlife']),
	durationHours: decimal("duration_hours", { precision: 3, scale: 1 }),
	durationLabel: varchar("duration_label", { length: 50 }),
	priceAmount: decimal("price_amount", { precision: 10, scale: 2 }),
	priceCurrency: varchar("price_currency", { length: 3 }),
	priceLabel: varchar("price_label", { length: 50 }),
	originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
	discountPct: int("discount_pct"),
	rating: decimal({ precision: 3, scale: 1 }),
	reviewCount: int("review_count"),
	imageUrl: varchar("image_url", { length: 500 }),
	imageEmoji: varchar("image_emoji", { length: 10 }),
	affiliatePartner: varchar("affiliate_partner", { length: 50 }),
	affiliateUrl: varchar("affiliate_url", { length: 1000 }),
	affiliateProductId: varchar("affiliate_product_id", { length: 100 }),
	isFeatured: tinyint("is_featured").default(0),
	tag: varchar({ length: 50 }),
	sortOrder: int("sort_order"),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	highlights: json(),
	includes: json(),
	excludes: json(),
	importantInfo: text("important_info"),
	photos: json(),
	gygCategories: json("gyg_categories"),
	reviewsSnapshot: json("reviews_snapshot"),
	optionsSnapshot: json("options_snapshot"),
	f1Context: text("f1_context"),
	meetingPoint: text("meeting_point"),
	mobileVoucher: tinyint("mobile_voucher"),
	instantConfirmation: tinyint("instant_confirmation"),
	skipTheLine: tinyint("skip_the_line"),
	hasPickUp: tinyint("has_pick_up"),
	distanceKm: decimal("distance_km", { precision: 5, scale: 1 }),
	neighborhood: varchar({ length: 100 }),
	travelMins: int("travel_mins"),
	lat: decimal({ precision: 10, scale: 7 }),
	lng: decimal({ precision: 10, scale: 7 }),
	languages: json(),
	seoKeywords: json("seo_keywords"),
	f1WindowsLabel: varchar("f1_windows_label", { length: 255 }),
	guideArticle: longtext("guide_article"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "experiences_id"}),
]);

export const itineraries = mysqlTable("itineraries", {
	id: varchar({ length: 12 }).notNull(),
	raceId: int("race_id").references(() => races.id),
	arrivalDay: mysqlEnum("arrival_day", ['Wednesday','Thursday','Friday']),
	departureDay: mysqlEnum("departure_day", ['Sunday','Monday','Tuesday']),
	interests: json(),
	groupSize: int("group_size").default(1),
	itineraryJson: json("itinerary_json"),
	promptHash: varchar("prompt_hash", { length: 64 }),
	generationModel: varchar("generation_model", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	viewCount: int("view_count").default(0),
	shareCount: int("share_count").default(0),
},
(table) => [
	primaryKey({ columns: [table.id], name: "itineraries_id"}),
]);

export const races = mysqlTable("races", {
	id: int().autoincrement().notNull(),
	slug: varchar({ length: 100 }),
	name: varchar({ length: 255 }),
	season: year(),
	round: int(),
	circuitName: varchar("circuit_name", { length: 255 }),
	city: varchar({ length: 100 }),
	country: varchar({ length: 100 }),
	countryCode: char("country_code", { length: 2 }),
	circuitLat: decimal("circuit_lat", { precision: 10, scale: 6 }),
	circuitLng: decimal("circuit_lng", { precision: 10, scale: 6 }),
	timezone: varchar({ length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	raceDate: date("race_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "races_id"}),
	unique("races_slug_unique").on(table.slug),
]);

export const scheduleEntries = mysqlTable("schedule_entries", {
	id: int().autoincrement().notNull(),
	raceId: int("race_id"),
	dayOfWeek: mysqlEnum("day_of_week", ['Thursday','Friday','Saturday','Sunday']).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	title: varchar({ length: 255 }).notNull(),
	series: varchar({ length: 100 }),
	seriesKey: varchar("series_key", { length: 50 }),
	sortOrder: int("sort_order"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "schedule_entries_id"}),
]);

export const sessions = mysqlTable("sessions", {
	id: int().autoincrement().notNull(),
	raceId: int("race_id").references(() => races.id),
	name: varchar({ length: 100 }),
	shortName: varchar("short_name", { length: 20 }),
	dayOfWeek: mysqlEnum("day_of_week", ['Thursday','Friday','Saturday','Sunday']),
	startTime: time("start_time"),
	endTime: time("end_time"),
	sessionType: mysqlEnum("session_type", ['practice','qualifying','sprint','race','support','event']),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sessions_id"}),
]);
