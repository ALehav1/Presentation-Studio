/**
 * OpenAI Edge Function for Vercel
 * 
 * Handles chat completions including vision requests
 * Based on OpenAI API v1 specification
 */
export const config = {
  runtime: 'edge',
  maxDuration: 30,
};

export default async function handler(request) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.apiKey) {
      return Response.json(
        { error: { message: 'API key is required' } }, 
        { status: 400 }
      );
    }

    if (!body.messages || !Array.isArray(body.messages)) {
      return Response.json(
        { error: { message: 'Messages array is required' } }, 
        { status: 400 }
      );
    }

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    console.log('🔄 OpenAI API call:', {
      model: body.model,
      messagesCount: body.messages.length,
      hasVision: body.messages.some(m => 
        Array.isArray(m.content) && 
        m.content.some(c => c.type === 'image_url')
      )
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${body.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model || 'gpt-4o-mini',
        max_tokens: body.max_tokens || 1000,
        messages: body.messages,
        temperature: body.temperature || 0.1,
        // Add stream: false explicitly for edge functions
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OpenAI API Error:', data);
      return Response.json(data, { 
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    console.log('✅ OpenAI API Success:', {
      model: data.model,
      usage: data.usage,
      contentLength: data.choices?.[0]?.message?.content?.length || 0
    });

    return Response.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('❌ OpenAI Edge Function Error:', error);
    
    return Response.json(
      { 
        error: { 
          message: error.name === 'AbortError' 
            ? 'Request timeout' 
            : error.message || 'Internal server error'
        }
      }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}
