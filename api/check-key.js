/**
 * Check if server-side API key is available
 * Safe endpoint that doesn't expose the actual key
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hasServerKey = Boolean(process.env.OPENAI_API_KEY);
    
    return res.status(200).json({ 
      hasServerKey,
      message: hasServerKey ? 'Server key available' : 'No server key configured'
    });
  } catch (error) {
    console.error('Check key error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
