import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const playerRegistrations = pgTable("player_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerName: text("player_name").notNull(),
  thLevel: text("th_level").notNull(),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const clans = pgTable("clans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  participants: integer("participants").notNull(),
  league: text("league").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cwlMessages = pgTable("cwl_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlayerRegistrationSchema = createInsertSchema(playerRegistrations).pick({
  playerName: true,
  thLevel: true,
});

export const insertClanSchema = createInsertSchema(clans).pick({
  name: true,
  participants: true,
  league: true,
});

export const insertCwlMessageSchema = createInsertSchema(cwlMessages).pick({
  content: true,
});

export type InsertPlayerRegistration = z.infer<typeof insertPlayerRegistrationSchema>;
export type PlayerRegistration = typeof playerRegistrations.$inferSelect;

export type InsertClan = z.infer<typeof insertClanSchema>;
export type Clan = typeof clans.$inferSelect;

export type InsertCwlMessage = z.infer<typeof insertCwlMessageSchema>;
export type CwlMessage = typeof cwlMessages.$inferSelect;

export type ClashPlayer = {
  name: string;
  tag: string;
  townHallLevel: number;
  warStars: number;
  trophies: number;
  bestTrophies: number;
  legendStatistics?: {
    legendTrophies: number;
  };
};
