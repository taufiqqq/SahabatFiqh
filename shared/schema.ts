import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export chat models from the integration
export * from "./models/chat";

// We can add other tables here if needed, but for now chat is the main feature.
