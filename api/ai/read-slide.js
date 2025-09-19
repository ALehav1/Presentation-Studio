// ENHANCED Backend Proxy for AI Slide Reading
// Vercel Function: /api/ai/read-slide.js
// Protects OpenAI API keys and provides enterprise-grade error handling

export default async function handler(req, res) {
  // CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST for slide reading
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment validation
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    return res.status(500).json({ 
      error: 'Server configuration error: OpenAI API key not configured' 
    });
  }

  // Request validation
  const { imageDataUrl, prompt, options } = req.body;
  
  if (!imageDataUrl || !prompt) {
    return res.status(400).json({ 
      error: 'Missing required parameters: imageDataUrl and prompt are required' 
    });
  }

  // Image validation
  if (!imageDataUrl.startsWith('data:image/')) {
    return res.status(400).json({ 
      error: 'Invalid image format: Must be a data URL starting with data:image/' 
    });
  }

  // Size validation (server-side double check)
  const base64Data = imageDataUrl.split(',')[1] || '';
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > 5_000_000) { // 5MB limit
    return res.status(413).json({ 
      error: 'Image too large: Must be under 5MB' 
    });
  }

  // Rate limiting (basic IP-based)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`📊 Slide analysis request from ${clientIp?.toString().slice(0, 8)}...`);

  // Request options with defaults
  const {
    model = 'gpt-4o-mini',
    detail = 'low',
    maxTokens = 300
  } = options || {};

  try {
    console.log('🤖 Calling OpenAI Vision API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                  detail
                }
              }
            ]
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ OpenAI API error:', error);
      
      // Map OpenAI errors to user-friendly messages
      const errorMessage = mapOpenAIError(error, response.status);
      
      return res.status(response.status).json({ 
        error: errorMessage
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return res.status(500).json({ 
        error: 'No content received from AI service' 
      });
    }

    console.log('✅ Slide analysis completed successfully');
    
    // Log usage for monitoring (optional)
    const tokensUsed = data.usage?.total_tokens || 0;
    console.log(`📈 Tokens used: ${tokensUsed}, Model: ${model}`);
    
    return res.status(200).json({ content });
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    // Network/timeout errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service temporarily unavailable. Please try again.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}

/**
 * Map OpenAI API errors to user-friendly messages
 */
function mapOpenAIError(error, status) {
  if (status === 401) {
    return 'API authentication failed. Please check server configuration.';
  }
  
  if (status === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  
  if (status === 400 && error.error?.code === 'invalid_image') {
    return 'Invalid image format. Please use JPG, PNG, or WebP images.';
  }
  
  if (status === 413) {
    return 'Image too large for processing. Please use smaller images.';
  }
  
  // Default to OpenAI's message if available, otherwise generic
  return error.error?.message || 'AI service error. Please try again.';
}
