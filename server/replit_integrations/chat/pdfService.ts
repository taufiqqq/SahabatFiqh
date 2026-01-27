import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CRAWLER_API_URL =
    "https://sahabat-fiqh-crawler.vercel.app/scrape/bnm?x-vercel-protection-bypass=Jn2rmGmvjnTDCpQ9dlTfepiHN7ozFUoq";

const PDF_FETCH_PROXY_URL =
    "https://sahabat-fiqh-crawler.vercel.app/fetch?x-vercel-protection-bypass=Jn2rmGmvjnTDCpQ9dlTfepiHN7ozFUoq";

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

/* -------------------------------------------------- */
/* DOCUMENT LIST                                      */
/* -------------------------------------------------- */

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
        console.error("Crawler API error:", error);
        return [];
    }
}

/* -------------------------------------------------- */
/* RELEVANT DOCUMENT                                  */
/* -------------------------------------------------- */

export async function findRelevantDocument(
    userQuery: string,
): Promise<RelevanceResult> {
    try {
        const documents = await getDocumentList();

        if (!documents.length) {
            return {
                isRelevant: false,
                selectedDocument: null,
                reasoning: "No documents available",
            };
        }

        const documentList = documents
            .slice(0, 80)
            .map((d, i) => `${i + 1}. ${d.title}`)
            .join("\n");

        const prompt = `User Question:
"${userQuery}"

Available Documents:
${documentList}

Pick the MOST relevant document number.
If none match, say NOT_RELEVANT.

Return JSON:
{
 "isRelevant": true/false,
 "documentNumber": number|null,
 "reasoning": "short"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        if (result.isRelevant && result.documentNumber) {
            return {
                isRelevant: true,
                selectedDocument: documents[result.documentNumber - 1],
                reasoning: result.reasoning,
            };
        }

        return {
            isRelevant: false,
            selectedDocument: null,
            reasoning: result.reasoning || "Not relevant",
        };
    } catch (e) {
        console.error("findRelevantDocument error:", e);
        return {
            isRelevant: false,
            selectedDocument: null,
            reasoning: "AI failure",
        };
    }
}

/* -------------------------------------------------- */
/* PDF FETCH + PAGE TEXT                              */
/* -------------------------------------------------- */

export async function extractPdfText(
    pdfUrl: string,
): Promise<{ pages: PdfPageContent[] }> {
    console.log("Fetching PDF:", pdfUrl);

    const res = await fetch(
        `${PDF_FETCH_PROXY_URL}&url=${encodeURIComponent(pdfUrl)}`,
    );

    if (!res.ok) {
        const t = await res.text();
        console.error("Proxy error:", t.slice(0, 300));
        throw new Error("PDF fetch failed");
    }

    const buf = Buffer.from(await res.arrayBuffer());

    // ✅ pdf-parse v2 CLASS API
    const mod: any = await import("pdf-parse");
    const PDFParse = mod.PDFParse ?? mod.default?.PDFParse;

    if (!PDFParse) {
        throw new Error("PDFParse class not found in pdf-parse module");
    }

    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();

    const pages: PdfPageContent[] = result.pages.map((p: any, i: number) => ({
        pageNumber: i + 1,
        text: p.text,
    }));

    console.log("Parsed pages:", pages.length);
    console.log("Page 1 preview:", pages[0]?.text.slice(0, 200));

    return { pages };
}

/* -------------------------------------------------- */
/* CONTEXT PROMPT                                     */
/* -------------------------------------------------- */

export function createPdfContextPrompt(
    contextText: string,
    documentTitle: string,
): string {
    return `You are SahabatFiqh, an expert AI assistant focused on Islamic banking and Malaysian financial regulations.

IMPORTANT:
All answers MUST be based only on the document text below from:
"${documentTitle}"

INSTRUCTIONS:
1. Answer using only the provided text.
2. You may summarize and combine information across pages.
3. If only partial information is available, explain based on what is present.
4. Include your answer with at least one citation in this format:
   <cite> [${documentTitle}, Page X]: "Exact quote" </cite>

DOCUMENT TEXT:
${contextText}
`;
}
