/**
 * OpenAI API Proxy for Vercel
 * Hybrid: supports both server-side and client-side API keys
 * Priority: client key > server key
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key with priority: client > server
    const clientKey = req.body.apiKey;  
    const serverKey = process.env.OPENAI_API_KEY;
    const apiKey = clientKey || serverKey;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'No API key available. Please provide a client key or configure server key.' 
      });
    }

    // Remove apiKey from body before sending to OpenAI
    const { apiKey: _, ...requestBody } = req.body;
    
    console.log(`🔑 Using ${clientKey ? 'client' : 'server'} API key`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: error.error?.message || 'OpenAI API error' 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
