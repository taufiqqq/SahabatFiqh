# SahabatFiqh - Islamic AI Assistant

## Overview

SahabatFiqh is an Islamic AI chat assistant specialized in Shariah accounting, audit, and Islamic finance topics. The application features a conversational interface with an animated character, PDF-based Retrieval-Augmented Generation (RAG) for referencing Bank Negara Malaysia (BNM) policy documents, and real-time streaming responses.

The core functionality allows users to ask questions about Islamic finance concepts, and the system automatically fetches relevant BNM PDF documents to provide authoritative, source-backed answers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Animations**: Framer Motion for character state transitions

The frontend implements a chat interface with:
- Sidebar for conversation management (create, list, delete)
- Chat window with markdown-rendered messages and PDF source citations
- Animated character display that switches between idle/talking states during streaming
- SSE (Server-Sent Events) for real-time message streaming

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with SSE for streaming responses

Key backend modules:
- `server/replit_integrations/chat/` - Core chat functionality with PDF RAG
- `server/replit_integrations/audio/` - Voice chat capabilities (WebM to WAV conversion, speech-to-text)
- `server/replit_integrations/image/` - Image generation via OpenAI
- `server/replit_integrations/batch/` - Batch processing utilities with rate limiting

### PDF RAG System
The RAG implementation in `pdfService.ts`:
1. Fetches document list from external crawler API (BNM policy documents)
2. Uses GPT-4o-mini to analyze query relevance against 200+ documents
3. Downloads and extracts PDF content using `pdf-parse` library
4. Injects PDF content into system prompt for context-aware responses
5. Falls back to general knowledge if no relevant document found

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` and `shared/models/chat.ts`
- **Tables**:
  - `conversations` - Chat session metadata (id, title, createdAt)
  - `messages` - Individual messages with role, content, optional PDF metadata
- **Migrations**: Drizzle Kit with `migrations/` output directory

### Authentication
Currently no authentication implemented. The storage layer includes a basic in-memory user store interface (`server/storage.ts`) but is not actively used.

## External Dependencies

### AI Services
- **OpenAI API** via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Models used: GPT-4o-mini for chat, gpt-image-1 for image generation
  - Features: Chat completions with streaming, speech-to-text, text-to-speech

### External APIs
- **BNM Document Crawler**: `https://sahabat-fiqh-crawler-*.vercel.app/scrape/bnm`
  - Provides list of Bank Negara Malaysia policy documents
  - Returns document titles and PDF URLs
  - Requires bypass token in query params

### Database
- **PostgreSQL** - Connection via `DATABASE_URL` environment variable
- **Drizzle ORM** - Type-safe database operations

### Key NPM Packages
- `pdf-parse` - PDF text extraction for RAG
- `openai` - OpenAI API client
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `react-markdown` - Markdown rendering in chat messages
- `framer-motion` - Character animations
- `@tanstack/react-query` - Data fetching and caching
- `shadcn/ui` components via Radix primitives