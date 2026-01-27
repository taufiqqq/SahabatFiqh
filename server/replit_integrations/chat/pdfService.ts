import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CRAWLER_API_URL =
    "https://sahabat-fiqh-crawler.vercel.app/scrape/bnm?x-vercel-protection-bypass=Jn2rmGmvjnTDCpQ9dlTfepiHN7ozFUoq";

interface ScriptDocument {
    title: string;
    url: string;
}

interface RelevanceResult {
    isRelevant: boolean;
    selectedDocument: ScriptDocument | null;
    reasoning: string;
}

interface PdfPageContent {
    pageNumber: number;
    text: string;
}

/**
 * Fetches the latest document list from the crawler API
 */
async function getDocumentList(): Promise<ScriptDocument[]> {
    try {
        const response = await fetch(CRAWLER_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (!response.ok)
            throw new Error(
                `Failed to fetch crawler data: ${response.statusText}`,
            );
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
    userQuery: string,
): Promise<RelevanceResult> {
    try {
        const documents = await getDocumentList();
        if (documents.length === 0) {
            return {
                isRelevant: false,
                selectedDocument: null,
                reasoning: "No documents available from API",
            };
        }

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

        if (
            result.isRelevant &&
            result.documentNumber &&
            result.documentNumber <= documents.length
        ) {
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
            reasoning:
                result.reasoning || "Query not related to available documents",
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

const PDF_FETCH_PROXY_URL =
    "https://sahabat-fiqh-crawler.vercel.app/fetch?x-vercel-protection-bypass=Jn2rmGmvjnTDCpQ9dlTfepiHN7ozFUoq";

/**
 * Fetches PDF from URL using a Puppeteer-based proxy and extracts text content
 */
export async function extractPdfText(
    pdfUrl: string,
): Promise<{ fullText: string; pages: PdfPageContent[] }> {
    try {
        console.log(`Fetching PDF via proxy: ${pdfUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(
            `${PDF_FETCH_PROXY_URL}&url=${encodeURIComponent(pdfUrl)}`,
            { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(
                `Failed to fetch PDF: ${response.status} ${response.statusText}`,
            );
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("pdf")) {
            throw new Error(`Proxy did not return PDF (${contentType})`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        if (buffer.length === 0) {
            throw new Error("Fetched PDF is empty");
        }

        // ✅ ESM-safe import
        const pdfParse = (await import("pdf-parse")).default;

        const data = await pdfParse(buffer);

        const pages: PdfPageContent[] = [];
        data.text.split("\f").forEach((text, i) => {
            const clean = text.trim();
            if (clean) {
                pages.push({ pageNumber: i + 1, text: clean });
            }
        });

        return {
            fullText: data.text,
            pages: pages.length ? pages : [{ pageNumber: 1, text: data.text }],
        };
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        throw new Error("Failed to extract PDF content");
    }
}

/**
 * Creates an enhanced system prompt with Triple-Page context and rich citation instructions
 * Merges the user's preferred formatting with new RAG requirements.
 */
export function createPdfContextPrompt(
    contextText: string,
    documentTitle: string,
): string {
    return `You are SahabatFiqh, an expert AI assistant focused on Islamic banking and Malaysian financial regulations. 

IMPORTANT CONTEXT:
The user's query is related to the BNM document: "${documentTitle}". 
I have retrieved a "Triple-Page" context from this document (the most relevant page and its immediate preceding and succeeding pages) to ensure you have complete information.

STRICT INSTRUCTIONS:
1. Answer the user's question clearly, respectfully, and conversationally based ONLY on the provided document text.
2. If the document doesn't contain the answer, explicitly state that you couldn't find specific information in this document.
3. CRUCIAL: You MUST provide specific evidence for your answer. At the VERY END of your response, provide the evidence wrapped in a <cite> tag.
4. FORMAT FOR CITATION:
   <cite> [${documentTitle}, Page X]: "The exact sentence or paragraph from the PDF used as evidence" </cite>
5. Only cite the MOST relevant page number (this is the page that directly answers the query).

TRIPLE-PAGE DOCUMENT CONTEXT:
${contextText}

Now, provide a helpful and accurate answer based on the document, followed by the mandatory <cite> block.`;
}
