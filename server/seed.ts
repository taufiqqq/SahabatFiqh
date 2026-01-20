import { db } from "./db";
import { conversations, messages } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");
  try {
    const existingConversations = await db.select().from(conversations);
    if (existingConversations.length === 0) {
      console.log("Creating initial conversation...");
      const [conversation] = await db.insert(conversations).values({
        title: "Welcome to SahabatFiqh",
      }).returning();

      await db.insert(messages).values([
        {
          conversationId: conversation.id,
          role: "assistant",
          content: "Assalamu Alaikum! I am SahabatFiqh, your AI assistant for Islamic knowledge. How can I help you today?",
        }
      ]);
      console.log("Seeding complete.");
    } else {
      console.log("Database already seeded.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed().catch(console.error);
