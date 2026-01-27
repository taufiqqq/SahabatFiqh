import * as lancedb from "@lancedb/lancedb";
import OpenAI from "openai";
import path from "path";
import fs from "fs";

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DB_PATH = path.join(process.cwd(), "data", "vectors");
const TABLE_NAME = "pdf_pages";

interface PdfPageRecord {
    vector: number[];
    text: string;
    pageNumber: number;
    pdfUrl: string;
}

export class VectorService {
    private db: lancedb.Connection | null = null;

    private async getDb() {
        if (!this.db) {
            if (!fs.existsSync(DB_PATH)) {
                fs.mkdirSync(DB_PATH, { recursive: true });
            }
            this.db = await lancedb.connect(DB_PATH);
        }
        return this.db;
    }

    /**
     * Checks if a PDF is already indexed in LanceDB
     */
    async isIndexed(pdfUrl: string): Promise<boolean> {
        try {
            const db = await this.getDb();
            const table = await db.openTable(TABLE_NAME);
            const count = await table
                .query()
                .where(`pdfUrl = '${pdfUrl}'`)
                .limit(1)
                .toArray();
            return count.length > 0;
        } catch (e) {
            return false;
        }
    }

    /**
     * Indexes PDF pages into LanceDB
     */
    async upsertPdfPages(
        pdfUrl: string,
        pages: { text: string; pageNumber: number }[],
    ) {
        const db = await this.getDb();

        // Remove existing pages for this URL if any to avoid duplicates
        try {
            const table = await db.openTable(TABLE_NAME);
            await table.delete(`pdfUrl = '${pdfUrl}'`);
        } catch (e) {
            // Table might not exist yet, which is fine
        }

        const records: PdfPageRecord[] = [];

        for (const page of pages) {
            if (!page.text.trim()) continue;

            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: page.text.substring(0, 8000), // Secure chunk size for OpenAI
            });

            records.push({
                vector: embeddingResponse.data[0].embedding,
                text: page.text,
                pageNumber: page.pageNumber,
                pdfUrl: pdfUrl,
            });
        }

        if (records.length > 0) {
            try {
                const table = await db.openTable(TABLE_NAME);
                await table.add(records as any);
            } catch (e) {
                await db.createTable(TABLE_NAME, records as any);
            }
        }
    }

    /**
     * Searches for the most relevant page and retrieves its neighbors (Triple-Page Context)
     */
    async searchRelevantPages(query: string, pdfUrl: string) {
        const db = await this.getDb();
        let table: lancedb.Table;

        try {
            table = await db.openTable(TABLE_NAME);
        } catch (e) {
            console.error("LanceDB table not found during search");
            return null;
        }

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
        });

        const queryVector = embeddingResponse.data[0].embedding;

        // Find the most relevant page for the query
        const results = await table
            .vectorSearch(queryVector)
            .where(`pdfUrl = '${pdfUrl}'`)
            .limit(1)
            .toArray();

        if (results.length === 0) return null;

        const bestPage = results[0] as any;
        const pageNum = bestPage.pageNumber;

        // Triple-Page Context: Page-1, Page, Page+1
        const contextPages = await table
            .query()
            .where(
                `pdfUrl = '${pdfUrl}' AND pageNumber >= ${pageNum - 1} AND pageNumber <= ${pageNum + 1}`,
            )
            .toArray();

        // Sort resulting pages by page number for logical flow
        const sortedPages = contextPages.sort(
            (a: any, b: any) => a.pageNumber - b.pageNumber,
        );

        const contextText = sortedPages
            .map((p: any) => `[[ PAGE ${p.pageNumber} ]]\n${p.text}`)
            .join("\n\n---\n\n");

        return {
            bestPageNumber: pageNum,
            contextText,
            sourceUrl: pdfUrl,
        };
    }
}

export const vectorService = new VectorService();
