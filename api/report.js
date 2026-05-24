const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, niche, audience, platforms, contentTypes, goal, struggle } = req.body;

    if (!name || !email || !niche || !audience || !platforms || !goal) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const platformList = Array.isArray(platforms) ? platforms.join(', ') : platforms;

    const prompt = `You are a senior social media strategist. Analyse this brand and write a personalised Content Gap Analysis report.

Name: ${name}
Niche: ${niche}
Ideal Client: ${audience}
Platforms: ${platformList}
Current Content: ${contentTypes || 'Not specified'}
Goal: ${goal}
What is not working: ${struggle || 'Not specified'}

Rules:
- Be specific to their niche and audience, never generic
- No em dashes
- Write like a real person talking
- Every content idea must include the hook, format, and why it works for this specific person

Write the report with these exact sections:

### What you're already doing well
One honest paragraph based on what they told you.

### What's missing from your strategy
3 to 5 bullet points naming specific content gaps and why they matter for their goal.

### The buyer journey stage you're ignoring
One paragraph on which stage (awareness, consideration, decision) is being skipped and what content is missing.

### Your biggest opportunity right now
One paragraph on the single highest-impact content type they should start immediately and exactly why.

### 5 content ideas that will actually work for you
Five bullet points each with a specific hook or title, the format (reel, carousel, talking head, story series), and why it works for this person's specific niche and audience.

### Your next step
Two to three sentences telling them exactly what to do first.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1400
          }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini API error:', JSON.stringify(geminiData));
      return res.status(500).json({ error: 'Gemini API failed', details: geminiData });
    }

    const report = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!report) {
      console.error('No report text in response:', JSON.stringify(geminiData));
      return res.status(500).json({ error: 'No report generated' });
    }

    // Send email non-blocking
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (BREVO_API_KEY) {
      const emailHtml = `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2D6A4F;padding:32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;">${name}'s Content Gap Report</h1>
          <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;">Personalised for ${niche} on ${platformList}</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #E0E0D8;border-top:none;border-radius:0 0 12px 12px;">
          <pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;line-height:1.7;">${report}</pre>
          <div style="margin-top:28px;background:#2D6A4F;border-radius:12px;padding:24px;text-align:center;">
            <h3 style="color:#fff;margin:0 0 8px;">Want help implementing this?</h3>
            <p style="color:rgba(255,255,255,0.78);margin:0 0 16px;">Book a free 30 minute strategy call.</p>
            <a href="https://calendly.com/mishalzafar0/discovery-call" style="background:#F4C542;color:#1a1a1a;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Book Your Free Call</a>
          </div>
        </div>
      </body></html>`;

      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: 'Mishal | Social Mishal', email: 'mishalzafar0@gmail.com' },
          to: [{ email, name }],
          subject: `${name}, your Content Gap Analysis is here`,
          htmlContent: emailHtml
        })
      }).catch(e => console.error('Email error:', e));
    }

    return res.status(200).json({ report });

  } catch (err) {
    console.error('Unexpected error:', err.message, err.stack);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};

module.exports = handler;
