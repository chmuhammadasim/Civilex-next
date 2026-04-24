# AI Document Drafting - Setup Guide

## Overview
The AI Document Drafting feature allows users to generate professionally formatted legal documents using OpenAI's GPT models. It supports drafting evidence, written statements, affidavits, power of attorney, vakalatnama, applications, and other legal documents specific to Pakistani courts.

## Features
- ✨ **AI-Powered Drafting**: Generate court-ready documents using natural language prompts
- 📄 **Multiple Document Types**: Support for 7+ legal document types
- 🔒 **Authentication Protected**: Only authenticated users can access the feature
- 📋 **Context-Aware**: Automatically includes case details in generated documents
- 📝 **Editable Drafts**: Review and edit generated documents before use
- 💾 **Export Options**: Copy to clipboard or download as text file
- 🎯 **Pakistani Law Focused**: All documents follow Pakistani court formats and cite relevant laws

## Supported Document Types
1. **Evidence** - Qanun-e-Shahadat Order 1984
2. **Written Statement** - Order VIII CPC
3. **Affidavit** - Sworn statements
4. **Power of Attorney** - Legal representation authorization
5. **Vakalatnama** - Lawyer authorization for court cases
6. **Application** - Court applications under various sections
7. **Other** - Generic legal documents

## Setup Instructions

### 1. Environment Configuration
Create or update your `.env.local` file in the project root:

```env
# OpenAI API Key (REQUIRED for AI drafting)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

**Important**: Keep your API key secure and never commit it to version control.

### 3. Verify Installation
The OpenAI SDK is already included in the project dependencies:
```json
"openai": "^6.34.0"
```

If you need to reinstall dependencies:
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## Usage

### From Case Documents Tab
1. Navigate to any case detail page
2. Click the "Documents" tab
3. Click the **"AI Draft Document"** button (with sparkle icon ✨)
4. Select document type from dropdown
5. Enter a description of what you want in the document
   - Example: "Draft a written statement denying allegations in a property dispute case"
6. Click **"Generate Draft"**
7. Review and edit the generated document
8. Options:
   - **Copy**: Copy to clipboard
   - **Download**: Save as text file
   - **Use This Draft**: Close and use the draft (you can then upload it as a document)

### Context Awareness
The AI automatically includes case context:
- Case Number
- Case Title
- Case Type (civil/criminal/family)
- Plaintiff Name
- Defendant Name

These details are injected into the AI prompt to generate more accurate and case-specific documents.

## API Endpoint

### POST `/api/ai/draft-document`

**Request Body:**
```json
{
  "prompt": "Draft a written statement denying property ownership claims",
  "documentType": "written_statement",
  "caseContext": {
    "caseNumber": "CIVIL/2024/001",
    "caseTitle": "Property Dispute",
    "caseType": "civil",
    "plaintiff": "John Doe",
    "defendant": "Jane Smith"
  }
}
```

**Response (Success):**
```json
{
  "document": "WRITTEN STATEMENT\n\nIN THE COURT OF...",
  "documentType": "written_statement"
}
```

**Response (Error):**
```json
{
  "error": "AI document drafting failed. Please try again."
}
```

## Technical Architecture

### Components
- **`AIDraftingModal.tsx`**: UI component for the drafting interface
- **`useAIDrafting.ts`**: React hook for API communication
- **`/api/ai/draft-document/route.ts`**: Next.js API route with OpenAI integration

### Flow
```
User Input → AIDraftingModal → useAIDrafting Hook → API Route → OpenAI GPT-4o-mini → Formatted Document → User
```

### AI Model Configuration
- **Model**: `gpt-4o-mini` (cost-effective, fast)
- **Temperature**: `0.3` (lower for consistent legal formatting)
- **Max Tokens**: `2000` (allows longer documents)

## Customization

### Modify System Prompts
Edit system prompts in `/src/app/api/ai/draft-document/route.ts`:

```typescript
const DOCUMENT_SYSTEM_PROMPTS = {
  evidence: `Your custom prompt for evidence documents...`,
  // ... other document types
};
```

### Add New Document Types
1. Add new type to `DOCUMENT_SYSTEM_PROMPTS` in API route
2. Update `validTypes` array in API route
3. Add label to `DOCUMENT_TYPE_LABELS` in `src/lib/constants.ts`

### Change AI Model
In `/src/app/api/ai/draft-document/route.ts`:

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o",  // Change to gpt-4o for better quality (higher cost)
  // or "gpt-4o-mini" for speed and cost efficiency
  temperature: 0.3,
  max_tokens: 2000,
  // ...
});
```

## Cost Considerations

### GPT-4o-mini Pricing (as of 2024)
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens

### Estimated Costs per Document
- Average draft: 500-1500 tokens
- Cost per draft: **$0.001 - $0.003** (less than a cent)

### Optimization Tips
- Use `gpt-4o-mini` for most documents (current default)
- Increase temperature (0.5-0.7) if you want more creative variation
- Decrease max_tokens if you need shorter documents
- Implement request rate limiting for production

## Troubleshooting

### "AI document drafting is not configured"
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Restart the development server after adding the key

### "Failed to draft document"
- Check your OpenAI API key is valid and has credits
- Verify your OpenAI account has API access enabled
- Check browser console and server logs for detailed errors

### Documents not formatting correctly
- Adjust the system prompt for the specific document type
- Increase max_tokens if documents are being cut off
- Lower temperature (0.2-0.3) for more consistent formatting

### API Rate Limits
- OpenAI has rate limits per account tier
- Implement caching for repeated requests
- Add retry logic with exponential backoff for production

## Security Best Practices

1. **Never expose API keys**:
   - Keep `.env.local` in `.gitignore`
   - Use environment variables in production
   - Rotate keys regularly

2. **Validate user input**:
   - API route validates authentication
   - Input sanitization is built-in

3. **Rate limiting** (recommended for production):
   ```typescript
   // Add to API route
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 10 // 10 requests per 15 minutes
   });
   ```

## Future Enhancements

- [ ] Save drafts to database for reuse
- [ ] Template library for common documents
- [ ] Multi-language support (Urdu)
- [ ] PDF export with proper formatting
- [ ] Document version history
- [ ] Collaborative editing
- [ ] Fine-tuned model on Pakistani legal documents

## Support

For issues or questions:
1. Check this README
2. Review API route logs
3. Check OpenAI status page
4. Review project documentation in CLAUDE.md

---

**Last Updated**: 2026-04-24
**Version**: 1.0.0
