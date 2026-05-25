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

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

function needsLiveCivicVerification(
  message: string,
  history: OrivooHistoryItem[] = []
) {
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
];

if (
  noSearchPhrases.includes(text.trim()) ||
  text.trim().length < 3
) {
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
  ];

  const isCivicFollowUp =
    followUpTriggers.some((word) => text.includes(word)) &&
    civicContextWords.some((word) => recentContext.includes(word));

  return (
    liveKeywords.some((keyword) => text.includes(keyword)) ||
    isCivicFollowUp
  );
}

function getRecentTopicFromHistory(history: OrivooHistoryItem[]) {
  const recent = history
    .slice(0, 3)
    .reverse()
    .map((item) => {
      const question = typeof item?.question === "string" ? item.question : "";
      const answer = typeof item?.answer === "string" ? item.answer : "";
      return `${question}\n${answer}`;
    })
    .join("\n\n")
    .trim();

  return recent;
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
    lowerMessage.includes("who are they");

  const asksWhatAbout = lowerMessage.includes("what about");

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
  return [
    `${searchMessage} official government website current`,
    `${searchMessage} official court website current judges officials`,
    `${searchMessage} official election legislative government source current`,
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
  const results: TavilyResult[] = Array.isArray(data?.results)
    ? data.results
    : [];

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

      if (allResults.length >= 2) {
        break;
      }
    }

    return allResults.join("\n\n---\n\n");
  } catch (error) {
    console.error("Live civic search error:", error);
    return "";
  }
}

async function getSavedMemory(sessionId: string) {
  if (!supabase || !sessionId) return [];

  const { data, error } = await supabase
    .from("orivoo_memory")
    .select("user_message, orivoo_reply")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("ORIVOO memory read error:", error);
    return [];
  }

  return (data || []) as OrivooMemoryRow[];
}

async function saveMemory(
  sessionId: string,
  userMessage: string,
  orivooReply: string
) {
  if (!supabase || !sessionId) return;

  const { error } = await supabase.from("orivoo_memory").insert({
    session_id: sessionId,
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

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const savedMemory = sessionId ? await getSavedMemory(sessionId) : [];

    const memoryHistory: OrivooHistoryItem[] = savedMemory.map((item) => ({
      question: item.user_message,
      answer: item.orivoo_reply,
    }));

    const combinedHistory = [...history, ...memoryHistory];

    const cleanHistory = combinedHistory
      .slice(0, 12)
      .reverse()
      .flatMap((item: OrivooHistoryItem) => {
        const question =
          typeof item?.question === "string" ? item.question.trim() : "";
        const answer =
          typeof item?.answer === "string" ? item.answer.trim() : "";

        if (!question || !answer) return [];

        return [
          { role: "user" as const, content: question },
          { role: "assistant" as const, content: answer },
        ];
      });

    const shouldVerifyLive = needsLiveCivicVerification(
      message,
      combinedHistory
    );

    const liveCivicContext = shouldVerifyLive
      ? await searchLiveCivicWeb(message, combinedHistory)
      : "";

    const groqMessages = [
      { role: "system" as const, content: ORIVOO_SYSTEM_PROMPT },
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

SEARCH RESULTS:
${liveCivicContext}
`
          : `
LIVE CIVIC VERIFICATION STATUS:
No live source context was found.
If the question requires current civic facts, current officials, judges, court membership, election rules, bill status, laws, or public office details, do not answer as if verified.
Briefly say current verification may be needed.
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
          temperature: 0.12,
          max_tokens: 1100,
        }),
      }
    );

    if (!groqResponse.ok) {
      console.error("Groq error:", await groqResponse.text());

      return NextResponse.json(
        { error: "ORIVOO could not answer right now." },
        { status: 500 }
      );
    }

    const data = await groqResponse.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I don’t have enough verified information on that yet.";

    if (sessionId) {
      await saveMemory(sessionId, message, reply);
    }

    return NextResponse.json({
      reply,
      verified: Boolean(liveCivicContext),
      memory: Boolean(sessionId),
    });
  } catch (error) {
    console.error("ORIVOO API error:", error);

    return NextResponse.json(
      { error: "Something went wrong with ORIVOO." },
      { status: 500 }
    );
  }
}