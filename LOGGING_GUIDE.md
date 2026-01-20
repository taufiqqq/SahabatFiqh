# PDF RAG Logging Guide

## What to Look For in Console Logs

When you send a message through the chat, you should see these logs in sequence:

### 1. **Message Received**
```
================================================================================
💬 [CHAT] New message received
================================================================================
📍 Conversation ID: 1
📝 Message content: What is Mudarabah?
✅ User message saved to database
📚 Loaded conversation history: 2 messages
```

### 2. **Document Relevance Check**
```
🔍 Checking for relevant BNM documents...

🔍 [PDF RAG] findRelevantDocument called
📝 User Query: What is Mudarabah?
🤖 Calling OpenAI to analyze relevance...
✅ OpenAI response received
```

### 3a. **If Relevant Document Found** (PDF RAG Activated)
```
✅ RELEVANT DOCUMENT FOUND!
📄 Document: Mudarabah
💭 Reasoning: The query asks about Mudarabah, which is an Islamic banking concept covered in the document.

🎯 PDF RAG ACTIVATED!
📄 Fetching relevant document: Mudarabah
🔗 URL: https://www.bnm.gov.my/documents/.../Mudarabah.pdf

📥 [PDF RAG] extractPdfText called
🔗 PDF URL: https://www.bnm.gov.my/documents/.../Mudarabah.pdf
⬇️ Fetching PDF from URL...
✅ PDF downloaded successfully
📖 Parsing PDF content...
✅ PDF parsed successfully
📊 Extracted text length: 28543 characters

✅ PDF content extracted successfully (28543 characters)
📋 System prompt updated with PDF context
```

### 3b. **If No Relevant Document** (General Knowledge)
```
❌ No relevant document found
💭 Reasoning: The query is about general Islamic practices not covered in BNM policy documents.

ℹ️ No relevant BNM document found - using general knowledge
```

### 4. **OpenAI Response**
```
🚀 Starting OpenAI streaming response...
🤖 Model: gpt-5.1
```

### 5. **Error Scenarios**

**PDF Fetch Failed:**
```
❌ PDF fetch failed: 404 Not Found
❌ Error processing PDF: Error: Failed to fetch PDF: 404 Not Found
⚠️ Falling back to general knowledge
```

**OpenAI API Error:**
```
Error sending message: [error details]
```

## Testing the System

### Test 1: BNM-Related Query (Should trigger PDF RAG)
**Query:** "What are the requirements for Islamic credit cards?"
**Expected:** Should find "Credit Card and Credit Card-i" document

### Test 2: Islamic Banking Query (Should trigger PDF RAG)
**Query:** "Explain Mudarabah in Islamic banking"
**Expected:** Should find "Mudarabah" document

### Test 3: General Query (Should NOT trigger PDF RAG)
**Query:** "How do I pray Fajr?"
**Expected:** Should use general knowledge, no PDF fetch

### Test 4: Unrelated Query (Should NOT trigger PDF RAG)
**Query:** "What's the weather today?"
**Expected:** Should use general knowledge, no PDF fetch

## Troubleshooting

**No logs appearing?**
- Check if server is running
- Verify you're sending messages through the chat interface
- Check DATABASE_URL is set

**PDF RAG never triggers?**
- Check AI_INTEGRATIONS_OPENAI_API_KEY is set
- Verify script.json is loaded
- Try a very specific BNM query like "What is the policy on Mudarabah?"

**PDF fetch fails?**
- Check internet connection
- Verify PDF URLs in script.json are accessible
- Some PDFs might be blocked or moved
