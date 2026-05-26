import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seoOptimizationsTable = pgTable("seo_optimizations", {
  id: serial("id").primaryKey(),
  rawTitle: text("raw_title").notNull(),
  rawDescription: text("raw_description").notNull(),
  optimizedTitle: text("optimized_title").notNull(),
  optimizedDescription: text("optimized_description").notNull(),
  keywords: text("keywords").array().notNull().default([]),
  keywordDensity: real("keyword_density").notNull().default(0),
  titleScore: integer("title_score").notNull().default(0),
  descriptionScore: integer("description_score").notNull().default(0),
  suggestions: text("suggestions").array().notNull().default([]),
  keywordStats: jsonb("keyword_stats").default([]),
  psychologyStrategies: text("psychology_strategies").array().notNull().default([]),
  masterListing: jsonb("master_listing").default(null),
  amazonListing: jsonb("amazon_listing").default(null),
  ebayListing: jsonb("ebay_listing").default(null),
  websiteListing: jsonb("website_listing").default(null),
  tiktokListing: jsonb("tiktok_listing").default(null),
  shopifyListing: jsonb("shopify_listing").default(null),
  otherPlatforms: jsonb("other_platforms").default(null),
  buyerIntelligence: jsonb("buyer_intelligence").default(null),
  competitivePositioning: jsonb("competitive_positioning").default(null),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSeoOptimizationSchema = createInsertSchema(seoOptimizationsTable).omit({ id: true, createdAt: true });
export type InsertSeoOptimization = z.infer<typeof insertSeoOptimizationSchema>;
export type SeoOptimization = typeof seoOptimizationsTable.$inferSelect;
