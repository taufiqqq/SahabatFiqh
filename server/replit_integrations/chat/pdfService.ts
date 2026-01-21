import OpenAI from "openai";
import scriptData from "../../../script.json";

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ScriptDocument {
    title: string;
    link: string;
}

interface RelevanceResult {
    isRelevant: boolean;
    selectedDocument: ScriptDocument | null;
    reasoning: string;
}

/**
 * Determines if a user query is relevant to any document in script.json
 * and selects the most appropriate document
 */
export async function findRelevantDocument(
    userQuery: string
): Promise<RelevanceResult> {
    try {
        const documentList = (scriptData as ScriptDocument[])
            .map((doc, idx) => `${idx + 1}. ${doc.title}`)
            .join("\n");

        const prompt = `You are an expert in Islamic banking and Malaysian financial regulations. 

User Query: "${userQuery}"

Available Documents:
${documentList}

Task: Determine if this query is related to ANY of the above documents. If yes, select the MOST relevant document number. If no, respond with "NOT_RELEVANT".

Respond in this exact JSON format:
{
  "isRelevant": true/false,
  "documentNumber": <number or null>,
  "reasoning": "<brief explanation>"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        if (result.isRelevant && result.documentNumber) {
            const selectedDoc = scriptData[result.documentNumber - 1];
            return {
                isRelevant: true,
                selectedDocument: selectedDoc,
                reasoning: result.reasoning,
            };
        }

        return {
            isRelevant: false,
            selectedDocument: null,
            reasoning: result.reasoning || "Query not related to available documents",
        };
    } catch (error) {
        console.error("Error finding relevant document:", error);
        return {
            isRelevant: false,
            selectedDocument: null,
            reasoning: "Error analyzing query",
        };
    }
}

/**
 * Fetches PDF from URL and extracts text content
 */
export async function extractPdfText(pdfUrl: string): Promise<string> {
    try {
        const response = await fetch(pdfUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/pdf,application/octet-stream,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.bnm.gov.my/',
                'Cache-Control': 'no-cache',
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const pdf = await import("pdf-parse");
        // Handle common CJS/ESM interop issues with pdf-parse
        const parse = typeof pdf === 'function' ? pdf : (pdf as any).default || pdf;
        const data = await parse(buffer);

        return data.text;
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        throw new Error("Failed to extract PDF content");
    }
}

/**
 * Creates an enhanced system prompt with PDF context
 */
export function createPdfContextPrompt(
    pdfContent: string,
    documentTitle: string
): string {
    return `You are an AI assistant focused on Islamic banking and Malaysian financial regulations.

IMPORTANT CONTEXT:
The user's question is related to "${documentTitle}". I have retrieved the full document content for you.

STRICT INSTRUCTIONS:
1. You MUST use the document content below as your PRIMARY reference
2. Base your answer STRICTLY on the information in this document
3. If the document doesn't contain the answer, clearly state that
4. Quote relevant sections from the document when applicable
5. Do not make up information not present in the document
6. Keep your response concise and structured. Do not exceed 800 words to avoid being cut off.

DOCUMENT CONTENT:
${pdfContent.substring(0, 50000)} 

${pdfContent.length > 50000 ? "\n[Document truncated due to length...]" : ""}

Now answer the user's question based ONLY on this document.`;
}
