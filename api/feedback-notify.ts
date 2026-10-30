// Vercel Serverless Function: Feedback Notification Dispatcher
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feedbackId, userId, userEmail, category, message, sessionId, createdAt } = req.body || {};

    console.log('====================================================');
    console.log('[ADMIN NOTIFICATION] NEW USER FEEDBACK RECEIVED');
    console.log(`ID: ${feedbackId}`);
    console.log(`User: ${userEmail || userId || 'Anonymous'}`);
    console.log(`Category: ${category}`);
    console.log(`Session ID: ${sessionId || 'None (General App Feedback)'}`);
    console.log(`Created: ${createdAt || new Date().toISOString()}`);
    console.log(`Message: ${message}`);
    console.log('====================================================');

    // Return success to client
    return res.status(200).json({
      success: true,
      notified: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Feedback notify handler error:', err);
    return res.status(500).json({ error: err.message || 'Notification error' });
  }
}
