import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ORIVOO_SYSTEM_PROMPT } from "@/app/lib/orivooBrain";

type OrivooHistoryItem = {
  question?: string;
  answer?: string;
};

type OrivooMemoryRow = {
  user_message: string;
  orivoo_reply: string;
};

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

type Lang = "en" | "es";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

function getLanguageInstruction(language: Lang) {
  if (language === "es") {
    return `
LANGUAGE MODE:
The user selected Spanish.
Respond in clear, natural Spanish unless the user specifically asks for another language.
Keep civic terms understandable for everyday people.
If citing U.S. civic offices, you may keep official titles in English when needed, but explain them in Spanish.
`;
  }

  return `
LANGUAGE MODE:
The user selected English.
Respond in clear, natural English unless the user specifically asks for another language.
`;
}

function fallbackText(language: Lang, key: "required" | "orivooError" | "notEnough" | "somethingWrong") {
  const copy = {
    en: {
      required: "Message is required.",
      orivooError: "ORIVOO could not answer right now.",
      notEnough: "I don’t have enough verified information on that yet.",
      somethingWrong: "Something went wrong with ORIVOO.",
    },
    es: {
      required: "El mensaje es obligatorio.",
      orivooError: "ORIVOO no pudo responder ahora.",
      notEnough: "Todavía no tengo suficiente información verificada sobre eso.",
      somethingWrong: "Algo salió mal con ORIVOO.",
    },
  };

  return copy[language][key];
}

function needsLiveCivicVerification(message: string, history: OrivooHistoryItem[] = []) {
  const text = message.toLowerCase();

  const noSearchPhrases = [
    "thanks",
    "thank you",
    "ok thanks",
    "cool",
    "bet",
    "lol",
    "haha",
    "hey",
    "hello",
    "hi",
    "good morning",
    "good night",
    "gn",
    "gracias",
    "ok gracias",
    "hola",
    "buenos días",
    "buenas noches",
  ];

  if (noSearchPhrases.includes(text.trim()) || text.trim().length < 3) {
    return false;
  }

  const liveKeywords = [
    "current",
    "now",
    "today",
    "latest",
    "updated",
    "present",
    "who is",
    "who's",
    "who are",
    "judge",
    "judges",
    "justice",
    "justices",
    "chief justice",
    "chief judge",
    "court",
    "court of appeals",
    "appeals court",
    "supreme court",
    "district court",
    "circuit court",
    "probate court",
    "family court",
    "magistrate",
    "municipal court",
    "mayor",
    "sheriff",
    "governor",
    "senator",
    "representative",
    "council",
    "commissioner",
    "clerk",
    "attorney general",
    "secretary of state",
    "law",
    "bill",
    "statute",
    "ordinance",
    "code",
    "legislation",
    "election",
    "deadline",
    "polling",
    "ballot",
    "hearing",
    "meeting",
    "agenda",
    "minutes",
    "county",
    "city",
    "state",
    "zip",
    "official",
    "makeup",
    "list",
    "members",
    "officeholder",
    "who handles",
    "who represents",

    "actual",
    "ahora",
    "hoy",
    "último",
    "ultima",
    "última",
    "actualizado",
    "quién es",
    "quien es",
    "quiénes son",
    "quienes son",
    "juez",
    "jueces",
    "justicia",
    "corte",
    "tribunal",
    "alcalde",
    "sheriff",
    "gobernador",
    "senador",
    "representante",
    "concejo",
    "comisionado",
    "secretario de estado",
    "ley",
    "proyecto de ley",
    "estatuto",
    "ordenanza",
    "legislación",
    "elección",
    "votación",
    "boleta",
    "audiencia",
    "reunión",
    "condado",
    "ciudad",
    "estado",
    "oficial",
    "lista",
    "miembros",
    "funcionarios",
    "quién me representa",
    "quien me representa",
  ];

  const followUpTriggers = [
    "yes",
    "no",
    "continue",
    "go on",
    "what about",
    "the list",
    "list",
    "in order",
    "who else",
    "what the list",
    "members",
    "makeup",
    "current list",
    "current makeup",
    "who are they",
    "who handles",
    "same thing",
    "what about that",
    "what about this",
    "what about them",
    "break it down",
    "go deeper",
    "sí",
    "si",
    "continúa",
    "continua",
    "sigue",
    "qué pasa con",
    "que pasa con",
    "la lista",
    "lista",
    "en orden",
    "quién más",
    "quien más",
    "miembros",
    "quiénes son",
    "quienes son",
    "desglósalo",
    "explica más",
  ];

  const recentContext = history
    .slice(0, 3)
    .map((item) => `${item?.question || ""} ${item?.answer || ""}`)
    .join(" ")
    .toLowerCase();

  const civicContextWords = [
    "judge",
    "judges",
    "justice",
    "justices",
    "court",
    "appeals",
    "chief justice",
    "chief judge",
    "supreme court",
    "probate",
    "magistrate",
    "circuit",
    "family court",
    "mayor",
    "sheriff",
    "governor",
    "senator",
    "representative",
    "council",
    "election",
    "bill",
    "law",
    "ordinance",
    "juez",
    "jueces",
    "corte",
    "tribunal",
    "alcalde",
    "gobernador",
    "senador",
    "representante",
    "elección",
    "ley",
  ];

  const isCivicFollowUp =
    followUpTriggers.some((word) => text.includes(word)) &&
    civicContextWords.some((word) => recentContext.includes(word));

  return liveKeywords.some((keyword) => text.includes(keyword)) || isCivicFollowUp;
}

function getRecentTopicFromHistory(history: OrivooHistoryItem[]) {
  const recent = history
    .slice(0, 2)
    .reverse()
    .map((item) => (typeof item?.question === "string" ? item.question : ""))
    .join(" | ")
    .trim();

  return recent.slice(0, 180);
}

function buildSearchMessage(message: string, history: OrivooHistoryItem[]) {
  const lowerMessage = message.toLowerCase();
  const recentTopic = getRecentTopicFromHistory(history);
  const isShortFollowUp = message.trim().length < 45;

  const asksForList =
    lowerMessage.includes("list") ||
    lowerMessage.includes("in order") ||
    lowerMessage.includes("makeup") ||
    lowerMessage.includes("members") ||
    lowerMessage.includes("who else") ||
    lowerMessage.includes("who are they") ||
    lowerMessage.includes("lista") ||
    lowerMessage.includes("en orden") ||
    lowerMessage.includes("miembros") ||
    lowerMessage.includes("quién más") ||
    lowerMessage.includes("quien más") ||
    lowerMessage.includes("quiénes son") ||
    lowerMessage.includes("quienes son");

  const asksWhatAbout =
    lowerMessage.includes("what about") ||
    lowerMessage.includes("qué pasa con") ||
    lowerMessage.includes("que pasa con");

  if (recentTopic && asksForList) {
    return `${recentTopic}\n\nFollow-up request: current official members list in order.`;
  }

  if (recentTopic && asksWhatAbout) {
    return `${recentTopic}\n\nFollow-up request: ${message}. Find current official information for this new related civic topic.`;
  }

  if (recentTopic && isShortFollowUp) {
    return `${recentTopic}\n\nFollow-up request: ${message}.`;
  }

  return message;
}

function buildUniversalCivicQueries(searchMessage: string) {
  const text = searchMessage.toLowerCase();

  if (
    text.includes("u.s. president") ||
    text.includes("us president") ||
    text.includes("president of the united states") ||
    text.includes("presidente de estados unidos")
  ) {
    return [
      `${searchMessage} current official site:whitehouse.gov`,
      `${searchMessage} current president official White House`,
      `${searchMessage} official government website current`,
    ];
  }

  if (
    text.includes("u.s. supreme court") ||
    text.includes("us supreme court") ||
    text.includes("supreme court justice") ||
    text.includes("supreme court justices") ||
    text.includes("corte suprema")
  ) {
    return [
      `${searchMessage} current justices official site:supremecourt.gov`,
      `${searchMessage} biographies current members site:supremecourt.gov`,
      `${searchMessage} official court website current justices`,
    ];
  }

  if (
    text.includes("court") ||
    text.includes("judge") ||
    text.includes("justice") ||
    text.includes("corte") ||
    text.includes("tribunal") ||
    text.includes("juez")
  ) {
    return [
      `${searchMessage} official court website current judges justices members`,
      `${searchMessage} official judiciary website current judges justices`,
      `${searchMessage} official government website current court`,
    ];
  }

  if (
    text.includes("election") ||
    text.includes("vote") ||
    text.includes("ballot") ||
    text.includes("polling") ||
    text.includes("deadline") ||
    text.includes("elección") ||
    text.includes("eleccion") ||
    text.includes("votar") ||
    text.includes("boleta")
  ) {
    return [
      `${searchMessage} official election office current`,
      `${searchMessage} secretary of state election official current`,
      `${searchMessage} official government election source current`,
    ];
  }

  return [
    `${searchMessage} official government website current`,
    `${searchMessage} official court election legislative government source current`,
    `${searchMessage} official public agency source current`,
  ];
}

async function runTavilySearch(query: string) {
  if (!process.env.TAVILY_API_KEY) return "";

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      include_answer: true,
      include_raw_content: false,
      max_results: 6,
    }),
  });

  if (!response.ok) {
    console.error("Tavily error:", await response.text());
    return "";
  }

  const data = await response.json();
  const results: TavilyResult[] = Array.isArray(data?.results) ? data.results : [];

  if (results.length === 0) return "";

  return results
    .slice(0, 6)
    .map((result, index) =>
      [
        `SOURCE ${index + 1}`,
        `Title: ${result.title || "Untitled"}`,
        `URL: ${result.url || "No URL"}`,
        `Content: ${result.content || "No content snippet available."}`,
      ].join("\n")
    )
    .join("\n\n");
}

const KNOWN_BILLS = {
  "hr 1": { congress: "119", type: "hr", number: "1" },
  "one big beautiful bill": { congress: "119", type: "hr", number: "1" },
  "s 5": { congress: "119", type: "s", number: "5" },
  "laken riley act": { congress: "119", type: "s", number: "5" },
};

function detectCongressBill(message: string) {
  const text = message.toLowerCase();

  for (const [name, bill] of Object.entries(KNOWN_BILLS)) {
    if (text.includes(name)) return bill;
  }

  const hrMatch =
    text.match(/\bhr\.?\s*(\d+)\b/i) ||
    text.match(/\bh\.r\.\s*(\d+)\b/i);

  if (hrMatch) {
    return { congress: "119", type: "hr", number: hrMatch[1] };
  }

  const senateMatch = text.match(/\bs\.?\s*(\d+)\b/i);

  if (senateMatch) {
    return { congress: "119", type: "s", number: senateMatch[1] };
  }

  return null;
}

async function getCongressBillContext(message: string) {
  try {
    const bill = detectCongressBill(message);
    if (!bill) return "";

    const apiKey = process.env.CONGRESS_API_KEY;
    if (!apiKey) return "";

    const billResponse = await fetch(
      `https://api.congress.gov/v3/bill/${bill.congress}/${bill.type}/${bill.number}?api_key=${apiKey}`
    );

    if (!billResponse.ok) return "";

    const billData = await billResponse.json();

    const summaryResponse = await fetch(
      `https://api.congress.gov/v3/bill/${bill.congress}/${bill.type}/${bill.number}/summaries?api_key=${apiKey}`
    );

    let summaryText = "";

    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();

      summaryText = (summaryData?.summaries?.[0]?.text || "")
        .replace(/<[^>]*>/g, "")
        .slice(0, 5000);
    }

    return `
CONGRESS BILL DATA

Title:
${billData?.bill?.title || ""}

Bill:
${billData?.bill?.type || ""} ${billData?.bill?.number || ""}

Policy Area:
${billData?.bill?.policyArea?.name || ""}

Summary:
${summaryText}

Latest Action:
${billData?.bill?.latestAction?.text || ""}

Congress:
${billData?.bill?.congress || ""}
`;
  } catch (error) {
    console.error("Congress lookup error:", error);
    return "";
  }
}

async function searchLiveCivicWeb(message: string, history: OrivooHistoryItem[]) {
  try {
    const searchMessage = buildSearchMessage(message, history);
    const queries = buildUniversalCivicQueries(searchMessage);
    const allResults: string[] = [];

    for (const query of queries) {
      const result = await runTavilySearch(query);

      if (result) {
        allResults.push(`SEARCH QUERY: ${query}\n\n${result}`);
      }

      if (allResults.length >= 2) break;
    }

    return allResults.join("\n\n---\n\n");
  } catch (error) {
    console.error("Live civic search error:", error);
    return "";
  }
}

async function getSavedMemory(sessionId: string, userId?: string) {
  if (!supabase || !sessionId) return [];

  let query = supabase
    .from("orivoo_memory")
    .select("user_message, orivoo_reply")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;

  if (error) {
    console.error("ORIVOO memory read error:", error);
    return [];
  }

  return (data || []) as OrivooMemoryRow[];
}

async function saveMemory(
  sessionId: string,
  userId: string,
  userMessage: string,
  orivooReply: string
) {
  if (!supabase || !sessionId) return;

  const { error } = await supabase.from("orivoo_memory").insert({
    session_id: sessionId,
    user_id: userId || null,
    user_message: userMessage,
    orivoo_reply: orivooReply,
  });

  if (error) {
    console.error("ORIVOO memory save error:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body?.message;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const history = Array.isArray(body?.history) ? body.history : [];
    const userId = typeof body?.userId === "string" ? body.userId : "";

    const language: Lang = body?.language === "es" ? "es" : "en";

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: fallbackText(language, "required") },
        { status: 400 }
      );
    }

    const savedMemory = sessionId ? await getSavedMemory(sessionId, userId) : [];

    const memoryHistory: OrivooHistoryItem[] = savedMemory.map((item) => ({
      question: item.user_message,
      answer: item.orivoo_reply,
    }));

    const combinedHistory = [...history, ...memoryHistory];

    const cleanHistory = combinedHistory
      .slice(0, 12)
      .reverse()
      .flatMap((item: OrivooHistoryItem) => {
        const question = typeof item?.question === "string" ? item.question.trim() : "";
        const answer = typeof item?.answer === "string" ? item.answer.trim() : "";

        if (!question || !answer) return [];

        return [
          { role: "user" as const, content: question },
          { role: "assistant" as const, content: answer },
        ];
      });

    const shouldVerifyLive = needsLiveCivicVerification(message, combinedHistory);

    const congressContext = await getCongressBillContext(message);

    const liveCivicContext =
      congressContext ||
      (shouldVerifyLive ? await searchLiveCivicWeb(message, combinedHistory) : "");

    const groqMessages = [
      { role: "system" as const, content: ORIVOO_SYSTEM_PROMPT },
      { role: "system" as const, content: getLanguageInstruction(language) },
      {
        role: "system" as const,
        content: `
ORIVOO MEMORY CONTEXT:
Use recent conversation memory only to maintain continuity and understand follow-up questions.
Do not treat memory as verified civic fact if live/official source data conflicts with it.
For current civic facts, live official source context overrides memory.
Do not reveal memory storage details to users.
`,
      },
      {
        role: "system" as const,
        content: liveCivicContext
          ? `
LIVE CIVIC VERIFICATION CONTEXT:
Use these current search results to answer accurately.

IMPORTANT:
- This system is not limited to one state.
- Apply the same verification standard to all U.S. states, counties, cities, courts, legislatures, election offices, and public officials.
- Prefer official government, court, election, legislative, county, city, state, federal, and public agency sources.
- If a result URL/title is an official court "Judges", "Justices", "Members", "Officials", "Directory", or roster page, treat that as stronger than news articles, PDFs, biographies, old election notices, summaries, snippets, or cached information.
- For court lists, prefer the official court directory/list page over biography pages or older references.
- If an official source gives the answer, give the verified answer directly.
- If the source gives a current list of judges, justices, officials, officeholders, members, or representatives, use ONLY names supported by the source context.
- Do not add older names from model memory.
- Do not combine old officeholder lists with current source lists.
- Do not guess missing positions.
- If sources conflict, explain the conflict briefly.
- If the sources are weak, say what still needs verification.
- For follow-up questions, connect the user’s short follow-up to the recent civic topic and answer using current source context when available.
- Accuracy is more important than sounding confident.
- Never invent civic facts.
- Do not give a weak "check the website" answer when the provided source context already answers the question.

If Congressional Summary information is provided,
use that summary as the primary source when explaining
the bill in plain English.

Do not simply repeat the bill title.
Explain the major provisions, impacts,
and policy areas neutrally.

SEARCH RESULTS:
${liveCivicContext}
`
          : `
LIVE CIVIC VERIFICATION STATUS:
No live source context was found.

CRITICAL RULES:
- Do NOT refuse basic civic questions.
- Do NOT say "I don't have enough verified information" for widely known civic facts.
- Answer common civic facts directly from civic knowledge when safe.
- If the user selected Spanish, give these answers in Spanish.

Examples of things you SHOULD answer directly:
- Current U.S. President
- U.S. Vice President
- State Governors
- Number of Supreme Court Justices
- Current U.S. Supreme Court members
- Congress basics
- Constitutional facts
- Major civic structure

Examples of things that SHOULD try live verification:
- Current judges by county
- Court rosters
- Local officeholders
- Election deadlines
- Ballot issues
- Bill status
- Hearing schedules
- City council members
- County officials
- ZIP-code lookups

If live search fails:
- Give your best civic answer when reasonably known.
- Say "current verification may still be helpful" ONLY when uncertainty matters.
- Never freeze or refuse a common civic question.
- Never tell the user to "go check the website" unless absolutely necessary.
`,
      },
      ...cleanHistory,
      { role: "user" as const, content: message },
    ];

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.2,
          max_tokens: 1100,
        }),
      }
    );

    if (!groqResponse.ok) {
      console.error("Groq error:", await groqResponse.text());

      return NextResponse.json(
        { error: fallbackText(language, "orivooError") },
        { status: 500 }
      );
    }

    const data = await groqResponse.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      fallbackText(language, "notEnough");

    if (sessionId) {
      await saveMemory(sessionId, userId, message, reply);
    }

    return NextResponse.json({
      reply,
      verified: Boolean(liveCivicContext),
      memory: Boolean(sessionId),
      language,
    });
  } catch (error) {
    console.error("ORIVOO API error:", error);

    return NextResponse.json(
      { error: "Something went wrong with ORIVOO." },
      { status: 500 }
    );
  }
}