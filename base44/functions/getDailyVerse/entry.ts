import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
    Christianity: "Provide a meaningful Bible verse for a Christian's daily devotion. Include the exact verse text and its reference (book chapter:verse).",
    Catholicism: "Provide a meaningful Catholic Scripture verse for daily reflection. Include the exact verse text and its reference (book chapter:verse).",
    Judaism: "Provide a meaningful Torah or Tanakh passage for Jewish daily study. Include the exact text and its reference.",
    Islam: "Provide a meaningful Quranic verse (ayah) for daily reflection. Include the Arabic transliteration if possible, the English meaning, and the Surah and verse number.",
    Hinduism: "Provide a meaningful verse from the Bhagavad Gita or Upanishads for daily contemplation. Include the verse text and its reference.",
    Buddhism: "Provide a meaningful Buddhist teaching, sutra excerpt, or Dharma quote for daily meditation. Include the text and its source.",
    Sikhism: "Provide a meaningful passage from the Guru Granth Sahib (Hukamnama) for daily reflection. Include the text and its reference.",
  };

  const prompt = promptMap[religion] || `Provide a meaningful spiritual verse or teaching from ${religion} for daily reflection.`;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `${prompt}

Today's date is ${today}. Please select a verse that feels appropriate for this time of year or season.

Return a JSON object with these fields:
- "text": the full verse or teaching text
- "reference": the source reference (e.g. "John 3:16", "Quran 2:152", "Bhagavad Gita 2:47")
- "reflection": a brief 1-2 sentence reflection prompt to help the reader contemplate the verse's meaning in their daily life
- "theme": a single word theme like "hope", "gratitude", "peace", "courage", "love", "faith", "patience"`,
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