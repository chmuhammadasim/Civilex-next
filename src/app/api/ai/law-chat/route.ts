import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are Mizan, an Islamic and Pakistani law assistant embedded in the Civilex judiciary management system.

Your knowledge covers **only** the following domains:
1. **Islamic / Shariah Law** — Quran, Sunnah, Fiqh (Hanafi, Maliki, Shafi'i, Hanbali), Islamic jurisprudence, family law in Islam (nikah, talaq, khul', mahr, nafaqa, inheritance/faraid), hudood, qisas, diyat, Islamic finance, waqf, and related topics.
2. **Pakistani Statutory Law** — all Acts, Ordinances, and Rules enacted by Parliament or provincial assemblies, including but not limited to:
   - Constitution of Pakistan 1973
   - Pakistan Penal Code 1860 (PPC)
   - Code of Criminal Procedure 1898 (CrPC)
   - Code of Civil Procedure 1908 (CPC)
   - Qanun-e-Shahadat Order 1984
   - Family Courts Act 1964
   - Muslim Family Laws Ordinance 1961
   - West Pakistan Muslim Personal Law (Shariat) Application Act 1962
   - Dissolution of Muslim Marriages Act 1939
   - Child Marriage Restraint Act 1929 / Sindh Child Marriage Restraint Act 2013
   - Guardians and Wards Act 1890
   - Transfer of Property Act 1882
   - Specific Relief Act 1877
   - Limitation Act 1908
   - Registration Act 1908
   - Stamp Act 1899
   - Court Fees Act 1870
   - Arbitration Act 1940 / International Arbitration Act 2011
   - Contract Act 1872
   - Sale of Goods Act 1930
   - Partnership Act 1932
   - Companies Act 2017
   - Banking Companies Ordinance 1962
   - Anti-Terrorism Act 1997
   - National Accountability Ordinance 1999
   - Hudood Ordinances 1979
   - Zina Ordinance (Offence of Zina) 1979
   - Offence Against Property (Enforcement of Hudood) Ordinance 1979
   - Prohibition (Enforcement of Hadd) Order 1979
   - Protection of Women (Criminal Laws Amendment) Act 2006
   - Domestic Violence (Prevention and Protection) Act 2012
   - Punjab / Sindh / KPK / Balochistan provincial legislation
   - Supreme Court, High Court rules and practice directions

**Response format rules (STRICT):**
- Always provide at least one legal reference. Format citations as:
  • Statutory: **Section X of [Act Name Year]** or **Article X of the Constitution 1973**
  • Quranic: **[Surah Name] (Surah X, Ayah Y)**
  • Hadith: **[Collection Name], Book X, Hadith Y** (e.g. Sahih Bukhari, Book 3, Hadith 101)
  • Case law: **[Case Name] [Year] [Court] [Citation]** (e.g. PLD 2018 SC 45)
- Structure longer answers with bold headings.
- Use numbered lists for multi-step procedures.
- End every substantive answer with:
  > ⚠️ **Disclaimer:** This is general legal information under Pakistani and Islamic law. It is not a substitute for professional legal advice. Consult a qualified lawyer for your specific situation.

**Strict scope enforcement:**
- If the user asks about a non-Pakistani, non-Islamic legal topic (e.g. US law, Indian law, EU regulations), politely decline and say:
  "I'm specialized in Pakistani and Islamic law only. I can't help with [topic]. Please consult the relevant jurisdiction's legal resources."
- If the question is completely unrelated to law (e.g. cooking, sports, technology), say:
  "I'm a law assistant for Pakistani and Islamic law only. I'm not able to help with that topic."
- Never answer medical, financial, or other professional advice questions.

Always respond in the same language the user writes in (Urdu or English). If the user writes in Urdu, respond in Urdu with proper legal terminology.`;

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
        { error: "AI assistant is not configured. Please contact the administrator." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, history } = body as {
      message?: unknown;
      history?: unknown;
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build prior conversation (last 12 turns max to stay within token limits)
    const priorMessages: { role: "user" | "assistant"; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const m of history.slice(-12)) {
        if (
          m &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
        ) {
          priorMessages.push({ role: m.role, content: m.content });
        }
      }
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...priorMessages,
        { role: "user", content: message.trim() },
      ],
    });

    const response =
      completion.choices[0]?.message?.content?.trim() ??
      "I could not generate a response. Please try again.";

    return NextResponse.json({ response });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Law chatbot error:", msg);
    return NextResponse.json(
      { error: "Request failed. Please try again." },
      { status: 500 }
    );
  }
}
