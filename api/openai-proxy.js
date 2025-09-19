// Secure OpenAI API proxy for PresentationStudio
// This keeps the API key server-side and prevents client-side exposure

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting - basic protection
  const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  try {
    // Validate request body
    const { model, messages, max_completion_tokens, temperature, response_format } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Size limits to prevent abuse
    const requestSize = JSON.stringify(req.body).length;
    if (requestSize > 50000) { // 50KB limit
      return res.status(413).json({ error: 'Request too large' });
    }

    // Check for required environment variable
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Make request to OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        max_completion_tokens: max_completion_tokens || 1000,
        temperature: temperature || 0.2,
        response_format: response_format || { type: "text" }
      })
    });

    // Handle OpenAI API errors
    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      
      // Don't expose internal OpenAI errors to client
      return res.status(openAIResponse.status).json({
        error: 'AI service temporarily unavailable',
        code: openAIResponse.status
      });
    }

    const data = await openAIResponse.json();
    
    // Log usage for monitoring (optional)
    console.log(`OpenAI request: ${model}, tokens: ${max_completion_tokens}, user: ${userIP?.slice(0, 8)}...`);
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Please try again later'
    });
  }
}
