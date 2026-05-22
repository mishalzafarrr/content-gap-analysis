export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, niche, audience, platforms, contentTypes, goal, struggle } = req.body;
  if (!name || !email || !niche || !audience || !platforms || !goal) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const platformList = platforms.join(', ');

  const prompt = `You are a senior social media strategist with 10+ years of experience helping service-based businesses get real results from organic content. You are direct, specific, and you never give generic advice.

You are analysing the following brand:

Name: ${name}
Niche: ${niche}
Ideal Client: ${audience}
Active Platforms: ${platformList}
Current Content: ${contentTypes || 'Not specified'}
Main Goal: ${goal}
What feels like it's not working: ${struggle || 'Not specified'}

Write a personalised Content Gap Analysis report. Your job is to identify EXACTLY what is missing from their strategy and give them content ideas that will actually work for their specific niche, audience, and platform combination.

RULES:
- Never give generic advice like "post consistently" or "engage with your audience"
- Every content idea must include: the hook or angle, the format, and a specific reason why it will work for THIS person's niche and audience
- Be direct and honest, even if it means calling out what they're doing wrong
- Write like a real person talking, not a report generator
- No em dashes anywhere
- No fluff, no filler sentences

Use this exact structure:

### What you're already doing well
One short honest paragraph. Acknowledge what's working based on what they told you. Keep it genuine, not generic.

### What's missing from your strategy
3 to 5 specific gaps as bullet points. Each one should name the exact content type or strategy that's missing and why it matters for their goal. Be specific to their niche.

### The buyer journey stage you're ignoring
One paragraph explaining which stage (awareness, consideration, or decision) they're neglecting and what effect that has on their results. Give one concrete example of the kind of content missing from that stage.

### Your biggest opportunity right now
One paragraph identifying the single highest-impact content type or series they should start immediately. Explain specifically why it works for their niche, their audience, and their platform. Make it feel obvious by the end.

### 5 content ideas that will actually work for you
Five bullet points. Each idea must include:
- The specific hook or title to use
- The format (reel, carousel, talking head video, story series, etc.)
- Why it will work for this specific person's niche and audience
Make these so specific that ${name} could start creating them tomorrow.

### Your next step
Two to three sentences. Tell them exactly what to do first. Be direct. Make them feel ready to act.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 1400 }
        })
      }
    );

    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) return res.status(500).json({ error: 'AI generation failed' });

    const report = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!report) return res.status(500).json({ error: 'Empty response from AI' });

    try { await sendEmail(email, name, niche, platformList, report); } catch (e) { console.error('Email failed:', e); }

    return res.status(200).json({ report });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendEmail(email, name, niche, platforms, report) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) return;

  const reportHtml = report
    .replace(/### (.+)/g, '<h3 style="color:#2D6A4F;font-family:sans-serif;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;margin:24px 0 8px;padding-bottom:8px;border-bottom:1px solid #E0E0D8;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#2D6A4F;">$1</strong>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:8px;padding:8px 12px 8px 28px;background:#F0F0EC;border-radius:6px;position:relative;font-size:13px;line-height:1.6;">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/gs, m => `<ul style="list-style:none;padding:0;margin-bottom:12px;">${m}</ul>`)
    .replace(/\n\n/g, '</p><p style="margin:10px 0;font-size:14px;line-height:1.75;color:#3a3a3a;">');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#FAFAF7;">
  <div style="background:#2D6A4F;padding:32px 40px;border-radius:12px 12px 0 0;">
    <p style="color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 8px;">Social Mishal</p>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">${name}'s Content Gap Report</h1>
    <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;">Personalised for ${niche} on ${platforms}</p>
  </div>
  <div style="background:#fff;padding:40px;border:1px solid #E0E0D8;border-top:none;border-radius:0 0 12px 12px;">
    <p style="color:#6B6B6B;font-size:14px;line-height:1.7;margin:0 0 28px;">Hi ${name}, here's your personalised Content Gap Analysis. Read through carefully. Your biggest opportunities are waiting.</p>
    <div style="font-size:14px;line-height:1.8;color:#1A1A1A;">
      <p style="margin:10px 0;font-size:14px;line-height:1.75;color:#3a3a3a;">${reportHtml}</p>
    </div>
    <div style="margin-top:36px;background:#2D6A4F;border-radius:14px;padding:28px;text-align:center;">
      <h3 style="font-size:18px;font-weight:800;color:#fff;margin:0 0 8px;">Want help actually implementing this?</h3>
      <p style="font-size:13px;color:rgba(255,255,255,0.78);margin:0 0 20px;line-height:1.6;">Book a free 30 minute call and we'll map out your full content strategy together. No pitch, just strategy.</p>
      <a href="https://calendly.com/mishalzafar0/discovery-call" style="display:inline-block;background:#F4C542;color:#1a1a1a;font-weight:800;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">Book Your Free Call</a>
    </div>
    <p style="text-align:center;margin-top:24px;font-size:12px;color:#6B6B6B;">Made with care by <a href="https://mishalzafarrr.github.io/socialmishal" style="color:#2D6A4F;font-weight:600;text-decoration:none;">Social Mishal</a></p>
  </div>
</body></html>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Mishal | Social Mishal', email: 'mishalzafar0@gmail.com' },
      to: [{ email, name }],
      subject: `${name}, your Content Gap Analysis is here`,
      htmlContent: html
    })
  });
}
