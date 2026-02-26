import { relations } from "drizzle-orm/relations";
import { experiences, affiliateClicks, races, experienceWindows, experienceWindowsMap, itineraries, sessions } from "./schema";

export const affiliateClicksRelations = relations(affiliateClicks, ({one}) => ({
	experience: one(experiences, {
		fields: [affiliateClicks.experienceId],
		references: [experiences.id]
	}),
}));

export const experiencesRelations = relations(experiences, ({one, many}) => ({
	affiliateClicks: many(affiliateClicks),
	experienceWindowsMaps: many(experienceWindowsMap),
	race: one(races, {
		fields: [experiences.raceId],
		references: [races.id]
	}),
}));

export const experienceWindowsRelations = relations(experienceWindows, ({one, many}) => ({
	race: one(races, {
		fields: [experienceWindows.raceId],
		references: [races.id]
	}),
	experienceWindowsMaps: many(experienceWindowsMap),
}));

export const racesRelations = relations(races, ({many}) => ({
	experienceWindows: many(experienceWindows),
	experiences: many(experiences),
	itineraries: many(itineraries),
	sessions: many(sessions),
}));

export const experienceWindowsMapRelations = relations(experienceWindowsMap, ({one}) => ({
	experience: one(experiences, {
		fields: [experienceWindowsMap.experienceId],
		references: [experiences.id]
	}),
	experienceWindow: one(experienceWindows, {
		fields: [experienceWindowsMap.windowId],
		references: [experienceWindows.id]
	}),
}));

export const itinerariesRelations = relations(itineraries, ({one}) => ({
	race: one(races, {
		fields: [itineraries.raceId],
		references: [races.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	race: one(races, {
		fields: [sessions.raceId],
		references: [races.id]
	}),
}));