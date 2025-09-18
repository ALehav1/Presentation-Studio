// api/claude.js
// Vercel Edge Function for Claude API calls - PROPER SOLUTION

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { messages, apiKey, model = 'claude-3-5-sonnet-20241022', max_tokens = 1024 } = body;

    // Validate required fields
    if (!messages || !apiKey) {
      return Response.json({ 
        error: { message: 'Missing required fields: messages and apiKey' } 
      }, { status: 400 });
    }

    // Call Anthropic API server-side (no CORS issues!)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey, // User's API key passed securely
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages
      })
    });

    const data = await response.json();
    
    // Return the response (success or error)
    return Response.json(data, { status: response.status });

  } catch (error) {
    console.error('Edge function error:', error);
    return Response.json({ 
      error: { message: 'Internal server error' } 
    }, { status: 500 });
  }
}
