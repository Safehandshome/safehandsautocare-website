exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  let data;
  try { data = JSON.parse(event.body); } catch(e) {
    const p = new URLSearchParams(event.body);
    data = Object.fromEntries(p.entries());
  }

  const { name, email, service, vehicle, message } = data;
  if (!email) return { statusCode: 400, body: 'No email' };

  const body = {
    personalizations: [{ to: [{ email, name: name || 'there' }] }],
    from: { email: 'soulturnaround@icloud.com', name: 'SafeHands Auto Care' },
    reply_to: { email: 'soulturnaround@icloud.com' },
    subject: 'We got your request — SafeHands Auto Care',
    content: [{
      type: 'text/html',
      value: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:#cc0000;padding:24px 32px;">
            <h1 style="margin:0;font-size:1.4rem;">SafeHands Auto Care</h1>
            <p style="margin:4px 0 0;opacity:0.85;font-size:0.9rem;">Mobile Auto Repair · Somerset County, NJ</p>
          </div>
          <div style="padding:32px;">
            <h2 style="margin-top:0;">Request Received! 🔧</h2>
            <p>Hi ${name || 'there'},</p>
            <p>Thanks for reaching out to SafeHands Auto Care. We received your quote request and Aydan will get back to you <strong>within 2 hours</strong> with pricing and availability.</p>
            <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;font-size:0.85rem;color:#aaa;">YOUR REQUEST SUMMARY</p>
              ${service ? `<p style="margin:4px 0;"><strong>Service:</strong> ${service}</p>` : ''}
              ${vehicle ? `<p style="margin:4px 0;"><strong>Vehicle:</strong> ${vehicle}</p>` : ''}
              ${message ? `<p style="margin:4px 0;"><strong>Details:</strong> ${message}</p>` : ''}
            </div>
            <p>In the meantime, feel free to reply to this email with any questions.</p>
            <p style="margin-top:32px;color:#aaa;font-size:0.85rem;">— Aydan Ohlson, SafeHands Auto Care<br>Operating under SafeHands Home & Tech Repair LLC</p>
          </div>
        </div>`
    }]
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return { statusCode: res.ok ? 200 : 500, body: res.ok ? 'OK' : 'Error' };
};
