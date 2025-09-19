// Health check endpoint for AI slide reading service
// Vercel Function: /api/ai/read-slide/health.js

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept GET for health checks
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
  const status = hasApiKey ? 'ok' : 'misconfigured';

  console.log(`🏥 Health check: ${status} (API key: ${hasApiKey ? 'present' : 'missing'})`);

  return res.status(hasApiKey ? 200 : 500).json({ 
    status,
    hasApiKey,
    timestamp: new Date().toISOString(),
    service: 'ai-slide-reader'
  });
}
