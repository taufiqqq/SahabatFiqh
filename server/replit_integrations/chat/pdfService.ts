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
    console.log("\n🔍 [PDF RAG] findRelevantDocument called");
    console.log("📝 User Query:", userQuery);
    try {
        // Create a list of available documents for the AI to choose from
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

        console.log("🤖 Calling OpenAI to analyze relevance...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });
        console.log("✅ OpenAI response received");

        const result = JSON.parse(response.choices[0].message.content || "{}");

        if (result.isRelevant && result.documentNumber) {
            const selectedDoc = scriptData[result.documentNumber - 1];
            console.log("✅ RELEVANT DOCUMENT FOUND!");
            console.log("📄 Document:", selectedDoc.title);
            console.log("💭 Reasoning:", result.reasoning);
            return {
                isRelevant: true,
                selectedDocument: selectedDoc,
                reasoning: result.reasoning,
            };
        }

        console.log("❌ No relevant document found");
        console.log("💭 Reasoning:", result.reasoning || "Query not related to available documents");
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
    console.log("\n📥 [PDF RAG] extractPdfText called");
    console.log("🔗 PDF URL:", pdfUrl);
    try {
        // Fetch the PDF
        console.log("⬇️ Fetching PDF from URL...");
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
            console.error("❌ PDF fetch failed:", response.statusText);
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        console.log("✅ PDF downloaded successfully");

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert PDF to base64 for OpenAI
        const base64Pdf = buffer.toString("base64");

        // Use OpenAI to extract text from PDF
        // Note: This uses the file upload API
        const extractionPrompt = `Extract all text content from this PDF document. 
Preserve the structure and formatting as much as possible. 
Include headings, sections, and important details.`;

        // For now, we'll use a simpler approach with pdf-parse library
        console.log("📖 Parsing PDF content...");
        const pdfParseModule = await import("pdf-parse");
        // @ts-ignore - pdf-parse has complex type definitions
        const data = await pdfParseModule.default(buffer);
        console.log("✅ PDF parsed successfully");
        console.log("📊 Extracted text length:", data.text.length, "characters");

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
    return `You are SahabatFiqh, an AI assistant focused on Islamic banking and Malaysian financial regulations.

IMPORTANT CONTEXT:
The user's question is related to "${documentTitle}". I have retrieved the full document content for you.

STRICT INSTRUCTIONS:
1. You MUST use the document content below as your PRIMARY reference
2. Base your answer STRICTLY on the information in this document
3. If the document doesn't contain the answer, clearly state that
4. Quote relevant sections from the document when applicable
5. Do not make up information not present in the document

DOCUMENT CONTENT:
${pdfContent.substring(0, 50000)} 

${pdfContent.length > 50000 ? "\n[Document truncated due to length...]" : ""}

Now answer the user's question based ONLY on this document.`;
}
