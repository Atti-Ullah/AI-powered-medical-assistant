import { NextResponse } from 'next/server';

// Guide Assistant system instructions
const GUIDE_SYSTEM_PROMPT = `You are the onboarding/guide assistant for medisynix, a medical web application.

## Your Role
Help users understand how the platform works and how to use its features. You are NOT a medical assistant — do not answer medical questions yourself.

## Key Facts About medisynix
- medisynix offers two AI chat features: "General AI Doctor" and "Personal AI Doctor."
- General AI Doctor: provides general health information and guidance. It does not access any personal user data — every conversation starts fresh with no memory of the user's health profile.
- Personal AI Doctor: uses the user's saved health profile (age, gender, medical conditions, medications, allergies) to give more relevant, personalized guidance. It also remembers recent chat history to maintain context across a conversation.
- Neither AI Doctor is a real doctor. Neither diagnoses conditions, prescribes medication, or replaces professional medical care. Users with serious or urgent concerns should be directed to a licensed medical professional or emergency services.
- To get better results from Personal AI Doctor, users should fill out their health profile (age, conditions, medications, allergies) in their account/profile settings.

## Response Style
- Keep answers short, clear, and friendly — this is a navigation/how-to assistant, not a deep-dive resource.
- Use plain language, avoid jargon.
- If a user asks an actual medical question ("what should I do about my headache"), do not answer it — politely redirect them to General AI Doctor or Personal AI Doctor instead.
- If asked something unrelated to medisynix or its features, gently steer the conversation back to what you can help with.`;

// Call Gemini REST API — key is read INSIDE the function so Next.js env is always loaded
async function callGeminiAPI(systemPrompt, messages, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    throw new Error('MISSING_API_KEY');
  }

  const contents = [];

  for (const msg of messages) {
    if (msg.role && msg.content) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(msg.content) }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 512, // guide answers should be short
    },
  };

  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ];

  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || '';
        const errorStatus = data?.error?.status || '';
        console.error(`Gemini API error with model ${model}:`, data?.error);

        if (
          errorStatus === 'INVALID_ARGUMENT' ||
          errorStatus === 'PERMISSION_DENIED' ||
          errorMsg.toLowerCase().includes('api key') ||
          errorMsg.toLowerCase().includes('api_key') ||
          response.status === 400 ||
          response.status === 403
        ) {
          throw new Error('INVALID_API_KEY: ' + errorMsg);
        }

        if (response.status === 429 || errorMsg.toLowerCase().includes('quota')) {
          lastError = new Error('RATE_LIMIT: ' + errorMsg);
          continue;
        }

        if (response.status === 404) {
          lastError = new Error('MODEL_NOT_FOUND: ' + model);
          continue;
        }

        lastError = new Error('API_ERROR: ' + errorMsg);
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error('Unexpected Gemini response structure:', JSON.stringify(data));
        lastError = new Error('EMPTY_RESPONSE from model ' + model);
        continue;
      }

      console.log(`[Guide] Successfully got response from ${model}`);
      return text;
    } catch (fetchErr) {
      if (fetchErr.message.startsWith('INVALID_API_KEY') || fetchErr.message.startsWith('MISSING_API_KEY')) {
        throw fetchErr;
      }
      lastError = fetchErr;
      continue;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { message, history } = body;
    if (!message || !message.trim()) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    // Optional: let the frontend send recent turns for continuity.
    // Expected shape: [{ role: 'user' | 'assistant', content: '...' }, ...]
    const previousMessages = Array.isArray(history) ? history.slice(-8) : [];

    console.log('[Guide] request received');

    const aiResponse = await callGeminiAPI(GUIDE_SYSTEM_PROMPT, previousMessages, message.trim());

    return NextResponse.json({ message: aiResponse });
  } catch (error) {
    const msg = error.message || '';
    console.error('[Guide] Chat error:', msg);

    let userMessage;

    if (msg.startsWith('MISSING_API_KEY')) {
      userMessage = '⚠️ Guide assistant is not configured yet. Please add your GEMINI_API_KEY to the .env file. Get a free key at https://aistudio.google.com/app/apikey';
    } else if (msg.startsWith('INVALID_API_KEY')) {
      userMessage = '⚠️ The Gemini API key is invalid or expired. Please update GEMINI_API_KEY in your .env file with a valid key from https://aistudio.google.com/app/apikey';
    } else if (msg.startsWith('RATE_LIMIT')) {
      userMessage = 'The assistant is temporarily busy. Please wait a moment and try again.';
    } else if (msg.startsWith('MODEL_NOT_FOUND')) {
      userMessage = 'Guide assistant unavailable. Please try again in a moment.';
    } else {
      userMessage = 'Error generating a response. Please try again.';
    }

    return NextResponse.json({ message: userMessage }, { status: 500 });
  }
}