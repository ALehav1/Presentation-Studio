/**
 * OpenAI API Edge Function for Vercel
 * Handles GPT-4 and GPT-4 Vision requests
 */
export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { 
      apiKey, 
      model, 
      messages, 
      max_tokens, 
      temperature = 0.7,
      reasoning_effort,
      verbosity 
    } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-5',
        messages: messages || [{ role: 'user', content: 'Hello' }],
        max_tokens: max_tokens || 100,
        temperature,
        ...(reasoning_effort && { reasoning_effort }),
        ...(verbosity && { verbosity }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error response:', response.status, data);
      return new Response(JSON.stringify({ 
        error: data.error?.message || `OpenAI API error: ${response.status}`,
        details: data 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
