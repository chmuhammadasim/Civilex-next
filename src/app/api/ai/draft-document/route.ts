import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const DOCUMENT_SYSTEM_PROMPTS = {
  evidence: `You are a legal document assistant specialized in drafting EVIDENCE documents for Pakistani courts.

Requirements:
- Produce a formal, court-ready evidence document
- Use standard legal format with proper headings
- Include: Document title, case reference placeholder, numbered points
- Use Pakistani legal terminology and cite relevant provisions (Qanun-e-Shahadat Order 1984)
- Include placeholders like [Case Number], [Party Name], [Date], [CNIC] where needed
- End with verification/declaration clause
- Be concise and factual

Output ONLY the formatted document without any preamble or explanation.`,

  written_statement: `You are a legal document assistant specialized in drafting WRITTEN STATEMENTS for Pakistani courts under Order VIII CPC.

Requirements:
- Title: "WRITTEN STATEMENT"
- Opening: "IN THE COURT OF [Court Name]"
- Case title format: "[Plaintiff Name] vs [Defendant Name]"
- "Suit No. [___]" placeholder
- Numbered paragraphs responding to plaint allegations
- Each paragraph should admit, deny, or explain
- Include Prayer clause requesting dismissal of suit
- End with proper Verification clause
- Cite Order VIII CPC where relevant

Output ONLY the formatted document without any preamble or explanation.`,

  affidavit: `You are a legal document assistant specialized in drafting AFFIDAVITS for Pakistani courts.

Requirements:
- Title: "AFFIDAVIT"
- Opening: "IN THE COURT OF [Court Name]"
- Include deponent details: "I, [Name], S/O [Father Name], Aged [__], R/O [Address], CNIC [_____-_______-_]"
- Solemn declaration: "do hereby solemnly affirm and state on oath as under:"
- Numbered paragraphs (minimum 3-5 based on content)
- Each paragraph should be a clear factual statement
- End with deponent signature line and verification
- Include notary public section if relevant

Output ONLY the formatted document without any preamble or explanation.`,

  power_of_attorney: `You are a legal document assistant specialized in drafting POWER OF ATTORNEY documents for Pakistani legal proceedings.

Requirements:
- Title: "POWER OF ATTORNEY"
- Opening with principal's details: "I, [Principal Name], S/O [Father Name], Aged [__], R/O [Address], CNIC [_____-_______-_]"
- "do hereby appoint [Attorney Name], Advocate" clause
- Specific powers granted (appear in court, file documents, make submissions, etc.)
- Scope of authority clearly defined
- Duration/validity period
- Signature lines for Principal and Attorney
- Attestation section with witness details
- Include notarization clause if needed

Output ONLY the formatted document without any preamble or explanation.`,

  vakalatnama: `You are a legal document assistant specialized in drafting VAKALATNAMA (Lawyer Authorization) documents for Pakistani courts.

Requirements:
- Title: "VAKALATNAMA"
- Opening: "IN THE COURT OF [Court Name]"
- Case reference: "[Party Name] vs [Party Name]" and "Suit/Case No. [___]"
- Authorization clause: "I, [Client Name], S/O [Father Name], Aged [__], R/O [Address], CNIC [_____-_______-_]"
- "do hereby appoint and authorize [Advocate Name], Advocate" with enrollment number placeholder
- Powers: conduct case, file applications, make submissions, engage junior counsel, etc.
- Signature of client and acceptance by advocate
- Date and place fields
- Court fee stamp placeholder

Output ONLY the formatted document without any preamble or explanation.`,

  application: `You are a legal document assistant specialized in drafting COURT APPLICATIONS for Pakistani courts.

Requirements:
- Title: "APPLICATION UNDER [Section/Order/Rule]"
- Opening: "IN THE COURT OF [Court Name]"
- Case title and number format
- "MOST RESPECTFULLY SHEWETH:" followed by numbered paragraphs
- Clear statement of facts (Para 1-3)
- Grounds for application (subsequent paras)
- Legal basis with citations (CPC/CrPC orders/sections)
- PRAYER clause requesting specific relief
- Verification clause
- Applicant signature line with date and place
- Through Counsel section if applicable

Output ONLY the formatted document without any preamble or explanation.`,

  other: `You are a legal document assistant for Pakistani courts. Draft the requested legal document in proper court format.

Requirements:
- Use formal Pakistani court document structure
- Include appropriate headings and case reference placeholders
- Use numbered paragraphs for clarity
- Include placeholders for names, dates, case numbers, CNICs, etc.
- Cite relevant Pakistani law (CPC, CrPC, PPC, Qanun-e-Shahadat) where applicable
- Include verification/signature sections as appropriate
- Use clear, professional legal language

Output ONLY the formatted document without any preamble or explanation.`,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI document drafting is not configured. Please set OPENAI_API_KEY in the environment.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, documentType, caseContext } = body as {
      prompt?: unknown;
      documentType?: unknown;
      caseContext?: unknown;
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!documentType || typeof documentType !== "string") {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "evidence",
      "written_statement",
      "affidavit",
      "power_of_attorney",
      "vakalatnama",
      "application",
      "other",
    ];

    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    const systemPrompt =
      DOCUMENT_SYSTEM_PROMPTS[
        documentType as keyof typeof DOCUMENT_SYSTEM_PROMPTS
      ];

    // Build user message with case context if provided
    let userMessage = prompt.trim();
    if (caseContext && typeof caseContext === "object") {
      const ctx = caseContext as {
        caseNumber?: string;
        caseTitle?: string;
        caseType?: string;
        plaintiff?: string;
        defendant?: string;
      };
      const contextParts: string[] = [];
      if (ctx.caseNumber) contextParts.push(`Case Number: ${ctx.caseNumber}`);
      if (ctx.caseTitle) contextParts.push(`Case Title: ${ctx.caseTitle}`);
      if (ctx.caseType) contextParts.push(`Case Type: ${ctx.caseType}`);
      if (ctx.plaintiff) contextParts.push(`Plaintiff: ${ctx.plaintiff}`);
      if (ctx.defendant) contextParts.push(`Defendant: ${ctx.defendant}`);

      if (contextParts.length > 0) {
        userMessage = `Context:\n${contextParts.join("\n")}\n\nUser Request:\n${userMessage}`;
      }
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3, // Lower temperature for more consistent legal drafting
      max_tokens: 2000, // Allow longer documents
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const draftedDocument =
      completion.choices[0]?.message?.content?.trim() ??
      "I could not generate the document. Please try again.";

    return NextResponse.json({
      document: draftedDocument,
      documentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("AI draft error:", message);
    return NextResponse.json(
      { error: "AI document drafting failed. Please try again." },
      { status: 500 }
    );
  }
}
