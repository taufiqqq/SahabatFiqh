import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CRAWLER_API_URL = 'https://sahabat-fiqh-crawler-34o7etaj1-taufiqqqs-projects.vercel.app/scrape/bnm?x-vercel-protection-bypass=Jn2rmGmvjnTDCpQ9dlTfepiHN7ozFUoq';

interface ScriptDocument {
    title: string;
    url: string;
}

interface RelevanceResult {
    isRelevant: boolean;
    selectedDocument: ScriptDocument | null;
    reasoning: string;
}

/**
 * Fetches the latest document list from the crawler API
 */
async function getDocumentList(): Promise<ScriptDocument[]> {
    try {
        const response = await fetch(CRAWLER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Failed to fetch crawler data: ${response.statusText}`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error("Error fetching document list from API:", error);
        return [];
    }
}

/**
 * Determines if a user query is relevant to any document in the remote API
 */
export async function findRelevantDocument(
    userQuery: string
): Promise<RelevanceResult> {
    try {
        const documents = await getDocumentList();
        if (documents.length === 0) {
            return { isRelevant: false, selectedDocument: null, reasoning: "No documents available from API" };
        }

        // Limit the number of documents passed to OpenAI to avoid token limits
        // We'll take the first 100 as a representative sample or we could do a more sophisticated search
        const docCount = documents.length;
        const documentList = documents
            .slice(0, 100)
            .map((doc, idx) => `${idx + 1}. ${doc.title}`)
            .join("\n");

        const prompt = `You are an expert in Islamic banking and Malaysian financial regulations. 

User Query: "${userQuery}"

Available Documents (Showing first 100 out of ${docCount}):
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

        if (result.isRelevant && result.documentNumber && result.documentNumber <= documents.length) {
            const selectedDoc = documents[result.documentNumber - 1];
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
