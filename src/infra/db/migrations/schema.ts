import { pgTable, unique, text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const uploads = pgTable("uploads", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	remoteKey: text("remote_key").notNull(),
	remoteUrl: text("remote_url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("uploads_remote_key_unique").on(table.remoteKey),
]);
