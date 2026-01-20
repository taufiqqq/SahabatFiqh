# PDF RAG Implementation for SahabatFiqh

## Overview
Implemented a Retrieval-Augmented Generation (RAG) system that automatically fetches and uses relevant PDF documents from Bank Negara Malaysia (BNM) when answering user queries.

## How It Works

### 1. **Query Analysis**
When a user sends a message, the system:
- Analyzes the query using GPT-4o-mini
- Compares it against 200+ BNM policy documents
- Determines if the query is relevant to any document
- Selects the MOST relevant document if applicable

### 2. **PDF Retrieval & Extraction**
If a relevant document is found:
- Downloads the PDF from the BNM website
- Extracts all text content using `pdf-parse` library
- Preserves document structure and formatting

### 3. **Context-Enhanced Response**
- Creates a specialized system prompt with the PDF content
- Instructs the AI to use ONLY the document as reference
- Streams the response back to the user
- Falls back to general knowledge if PDF processing fails

## Files Modified/Created

### New Files:
- `server/replit_integrations/chat/pdfService.ts` - Core RAG logic

### Modified Files:
- `server/replit_integrations/chat/routes.ts` - Integrated PDF RAG into message endpoint

## Key Functions

### `findRelevantDocument(userQuery: string)`
- Uses AI to determine document relevance
- Returns: `{ isRelevant, selectedDocument, reasoning }`

### `extractPdfText(pdfUrl: string)`
- Fetches PDF from URL
- Extracts text content
- Returns: Plain text string

### `createPdfContextPrompt(pdfContent: string, documentTitle: string)`
- Creates enhanced system prompt
- Includes strict instructions to use PDF as primary reference
- Truncates content to 50,000 characters if needed

## Example Flow

**User Query:** "What are the requirements for Islamic credit cards?"

1. ✅ System detects relevance to "Credit Card and Credit Card-i" document
2. 📄 Fetches PDF from BNM website
3. 📝 Extracts ~30,000 characters of policy text
4. 🤖 AI responds based STRICTLY on the PDF content
5. 💬 User receives accurate, document-based answer

## Benefits

- ✅ **Accurate**: Answers based on official BNM documents
- ✅ **Up-to-date**: Always fetches latest PDFs from BNM
- ✅ **Transparent**: AI cites specific document sections
- ✅ **Fallback**: Gracefully handles PDF fetch failures
- ✅ **Efficient**: Only fetches PDFs when relevant

## Environment Variables Required

```env
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_api_key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1  # optional
DATABASE_URL=postgresql://...
```

## Testing

To test the RAG system:

1. Start the server: `npx tsx server/index.ts`
2. Create a new conversation
3. Ask questions like:
   - "What is Mudarabah in Islamic banking?"
   - "Tell me about credit card requirements"
   - "What are the rules for Ijarah?"
4. Check console logs for PDF fetching activity

## Console Output

When RAG is triggered, you'll see:
```
📄 Fetching relevant document: Mudarabah
🔗 URL: https://www.bnm.gov.my/documents/...
✅ PDF content extracted successfully (28543 characters)
```

## Future Improvements

1. **Caching**: Cache extracted PDF content to avoid repeated downloads
2. **Vector Search**: Use embeddings for more accurate document matching
3. **Multi-document**: Support queries spanning multiple documents
4. **Chunking**: Better handling of very large PDFs
5. **Citations**: Add specific page/section references in responses
