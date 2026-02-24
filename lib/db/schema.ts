import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  bigint,
  date,
  boolean,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth.js Required Tables ──────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Named "auth_accounts" to avoid collision with our app "accounts" table
export const authAccounts = pgTable(
  "auth_accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [
    primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  ]
);

// ─── Application Tables ────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  status: text("status", {
    enum: ["pending", "connected", "error", "disconnected"],
  })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const connections = pgTable("connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: "cascade" }),
  zoneId: text("zone_id").notNull(),
  apiTokenEnc: text("api_token_enc").notNull(),
  provider: text("provider").default("cloudflare").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { mode: "date" }),
  syncError: text("sync_error"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const crawlerSnapshots = pgTable(
  "crawler_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    botName: text("bot_name").notNull(),
    botCategory: text("bot_category"),
    botOrg: text("bot_org"),
    requestCount: integer("request_count").notNull().default(0),
    bytesTransferred: bigint("bytes_transferred", { mode: "number" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("crawler_snapshots_unique").on(
      table.accountId,
      table.date,
      table.botName
    ),
  ]
);

export const crawlerPaths = pgTable(
  "crawler_paths",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    path: text("path").notNull(),
    botName: text("bot_name").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("crawler_paths_unique").on(
      table.accountId,
      table.date,
      table.path,
      table.botName
    ),
  ]
);

export const devInvites = pgTable("dev_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  devEmail: text("dev_email").notNull(),
  devName: text("dev_name"),
  token: text("token").unique().notNull(),
  status: text("status", {
    enum: ["pending", "opened", "completed"],
  })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const unsupportedProviderRequests = pgTable(
  "unsupported_provider_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    email: text("email"),
    domain: text("domain"),
    providers: text("providers").array().notNull(),
    notify: boolean("notify").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  }
);

// ─── Relations ──────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  connection: one(connections),
  crawlerSnapshots: many(crawlerSnapshots),
  crawlerPaths: many(crawlerPaths),
  devInvites: many(devInvites),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  account: one(accounts, {
    fields: [connections.accountId],
    references: [accounts.id],
  }),
}));

export const crawlerSnapshotsRelations = relations(
  crawlerSnapshots,
  ({ one }) => ({
    account: one(accounts, {
      fields: [crawlerSnapshots.accountId],
      references: [accounts.id],
    }),
  })
);

export const crawlerPathsRelations = relations(crawlerPaths, ({ one }) => ({
  account: one(accounts, {
    fields: [crawlerPaths.accountId],
    references: [accounts.id],
  }),
}));

export const devInvitesRelations = relations(devInvites, ({ one }) => ({
  account: one(accounts, {
    fields: [devInvites.accountId],
    references: [accounts.id],
  }),
}));
