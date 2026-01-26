import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import {
  findRelevantDocument,
  extractPdfText,
  createPdfContextPrompt,
} from "./pdfService";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(
        title || "New Discussion",
      );
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post(
    "/api/conversations/:id/messages",
    async (req: Request, res: Response) => {
      try {
        const conversationId = parseInt(req.params.id);
        const { content } = req.body;

        await chatStorage.createMessage(conversationId, "user", content);

        const messages =
          await chatStorage.getMessagesByConversation(conversationId);
        const chatMessages = messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

        const relevanceCheck = await findRelevantDocument(content);

        let systemPrompt =
          "You are a helpful AI assistant. You provide knowledgeable, respectful, and accurate information. Your tone is polite and warm. Keep your response concise and structured. Aim for under 800 words to ensure completeness within token limits.";

        let pdfPages: any[] = [];

        if (relevanceCheck.isRelevant && relevanceCheck.selectedDocument) {
          try {
            const pdfUrl = relevanceCheck.selectedDocument.url;
            const { fullText, pages } = await extractPdfText(pdfUrl);
            pdfPages = pages;
            systemPrompt = createPdfContextPrompt(
              fullText,
              relevanceCheck.selectedDocument.title,
              pages,
            );
          } catch (pdfError) {
            console.error("Error processing PDF:", pdfError);
            systemPrompt += `\n\nNote: I found a relevant document titled "${relevanceCheck.selectedDocument.title}" but couldn't access it. I'll answer based on my general knowledge.`;
          }
        }

        chatMessages.unshift({
          role: "system",
          content: systemPrompt,
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: chatMessages,
          stream: true,
          max_completion_tokens: 1024,
        });

        let fullResponse = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Extract citations from the response
        const citationMatch = fullResponse.match(
          /---CITATIONS---\n([\s\S]*?)$/,
        );
        let citations = null;
        let mainContent = fullResponse;

        if (citationMatch) {
          const citationText = citationMatch[1].trim();
          mainContent = fullResponse
            .replace(/---CITATIONS---[\s\S]*$/, "")
            .trim();

          // Parse citations
          const citationLines = citationText
            .split("\n")
            .filter((line) => line.trim());
          citations = citationLines
            .map((line) => {
              const match = line.match(
                /^-?\s*Page\s+(\d+(?:,\s*\d+)*)\s*:\s*(.+)$/i,
              );
              if (match) {
                return {
                  pages: match[1].split(",").map((p) => parseInt(p.trim())),
                  text: match[2].trim(),
                };
              }
              return null;
            })
            .filter(Boolean);
        }

        let pdfData = null;
        if (relevanceCheck.isRelevant && relevanceCheck.selectedDocument) {
          pdfData = {
            title: relevanceCheck.selectedDocument.title,
            link: relevanceCheck.selectedDocument.url,
            description:
              relevanceCheck.reasoning || "Related BNM Policy Document",
            citations: citations || [],
          };
          res.write(`data: ${JSON.stringify({ pdf: pdfData })}\n\n`);
        }

        await chatStorage.createMessage(
          conversationId,
          "assistant",
          mainContent,
          pdfData,
        );

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (error) {
        console.error("Error sending message:", error);
        if (res.headersSent) {
          res.write(
            `data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`,
          );
          res.end();
        } else {
          res.status(500).json({ error: "Failed to send message" });
        }
      }
    },
  );
}
