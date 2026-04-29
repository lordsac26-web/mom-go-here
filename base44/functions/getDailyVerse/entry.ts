import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { religion } = await req.json();

  if (!religion || religion === "None") {
    return Response.json({ error: 'No religion selected' }, { status: 400 });
  }

  const promptMap = {
    Christianity: "Provide a meaningful Bible verse for a Christian's daily devotion. Include the exact verse text and its reference (book chapter:verse). Choose from ANY book in the Bible — Old or New Testament.",
    Catholicism: "Provide a meaningful Catholic Scripture verse for daily reflection. Include the exact verse text and its reference (book chapter:verse). Draw from the full Catholic canon including Deuterocanonical books.",
    Judaism: "Provide a meaningful Torah or Tanakh passage for Jewish daily study. Include the exact text and its reference. Choose from Torah, Nevi'im, or Ketuvim.",
    Islam: "Provide a meaningful Quranic verse (ayah) for daily reflection. Include the English meaning and the Surah name and verse number. Choose from any of the 114 Surahs.",
    Hinduism: "Provide a meaningful verse from the Bhagavad Gita, Upanishads, or Vedas for daily contemplation. Include the verse text and its reference.",
    Buddhism: "Provide a meaningful Buddhist teaching from the Dhammapada, Sutta Pitaka, Heart Sutra, or Diamond Sutra for daily meditation. Include the text and its source.",
    Sikhism: "Provide a meaningful passage from the Guru Granth Sahib for daily reflection. Include the text, the Ang (page) number, and which Guru or Bhagat composed it.",
  };

  const prompt = promptMap[religion] || `Provide a meaningful spiritual verse or teaching from ${religion} for daily reflection.`;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  // Generate a unique nonce so the LLM never caches/repeats the same output
  const nonce = crypto.randomUUID();

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `${prompt}

IMPORTANT RULES:
- Today's date is ${today}. Request ID: ${nonce}.
- You MUST pick a DIFFERENT verse than you would normally default to. Be creative and varied.
- Do NOT pick the most popular or well-known verses (e.g. avoid John 3:16, Psalm 23, Quran 2:255, Gita 2:47 unless specifically appropriate for the season).
- Select from a WIDE range of chapters and verses across the entire scripture.
- The verse should feel fresh and surprising, as if a wise teacher is sharing a hidden gem.
- Consider the current season, time of year, or any holidays/observances near ${today}.

Return a JSON object with these fields:
- "text": the full verse or teaching text
- "reference": the source reference (e.g. "Ecclesiastes 3:1", "Quran 55:13", "Bhagavad Gita 12:13")
- "reflection": a brief 1-2 sentence reflection prompt to help the reader contemplate the verse's meaning in their daily life
- "theme": a single word theme like "hope", "gratitude", "peace", "courage", "love", "faith", "patience", "wisdom", "joy", "strength"`,
    response_json_schema: {
      type: "object",
      properties: {
        text: { type: "string" },
        reference: { type: "string" },
        reflection: { type: "string" },
        theme: { type: "string" },
      },
      required: ["text", "reference", "reflection", "theme"],
    },
  });

  return Response.json({ verse: result, date: today });
});