exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  let data;
  try { data = JSON.parse(event.body); } catch(e) {
    const p = new URLSearchParams(event.body);
    data = Object.fromEntries(p.entries());
  }

  // ── Receipt email ──────────────────────────────────────────────────────────
  if (data.type === 'autocare-receipt') {
    const { to, customerName, receiptNum, date, vehicle, plate, mileage,
            items, subtotal, tax, taxRate, total, notes } = data;
    if (!to) return { statusCode: 400, body: 'No email' };

    let rowsHTML = (items || []).map(i =>
      `<tr><td style="padding:7px 10px;border-bottom:1px solid #eee;">${i.desc}</td>
       <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(i.price).toFixed(2)}</td></tr>`
    ).join('');

    const vehicleStr = [vehicle, plate ? `Plate: ${plate}` : '', mileage ? `Mileage: ${mileage}` : ''].filter(Boolean).join(' · ');

    const receiptHTML = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#cc0000;padding:20px 28px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">SafeHands Auto Care</h1>
        <p style="margin:4px 0 0;color:#ffaaaa;font-size:13px;">Mobile Mechanic · Somerset County, NJ</p>
      </div>
      <div style="background:#111;padding:16px 28px;display:flex;justify-content:space-between;">
        <div style="color:#aaa;font-size:13px;"><strong style="color:#fff;">Receipt #:</strong> ${receiptNum}<br><strong style="color:#fff;">Date:</strong> ${date}</div>
        <div style="color:#aaa;font-size:13px;text-align:right;"><strong style="color:#fff;">Customer:</strong> ${customerName}<br><strong style="color:#fff;">Vehicle:</strong> ${vehicleStr}</div>
      </div>
      <div style="padding:20px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#111;"><th style="padding:8px 10px;color:#fff;text-align:left;">Description</th><th style="padding:8px 10px;color:#fff;text-align:right;">Amount</th></tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
        <table style="margin-left:auto;margin-top:12px;font-size:13px;">
          <tr><td style="padding:4px 12px;color:#555;">Subtotal</td><td style="padding:4px 12px;text-align:right;">$${subtotal}</td></tr>
          ${parseFloat(taxRate) > 0 ? `<tr><td style="padding:4px 12px;color:#555;">NJ Tax (6.625%)</td><td style="padding:4px 12px;text-align:right;">$${tax}</td></tr>` : ''}
          <tr style="border-top:2px solid #111;"><td style="padding:8px 12px;font-weight:bold;font-size:15px;">TOTAL</td><td style="padding:8px 12px;font-weight:bold;font-size:15px;text-align:right;">$${total}</td></tr>
        </table>
        ${notes ? `<div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;font-size:13px;color:#555;"><strong>Notes:</strong> ${notes}</div>` : ''}
      </div>
      <div style="background:#f4f4f4;padding:14px 28px;text-align:center;font-size:12px;color:#888;border-top:1px solid #ddd;">
        Thank you for choosing SafeHands Auto Care!<br>
        Aydan Ohlson · Warren, NJ · SafeHands Home & Tech Repair LLC<br>
        <a href="https://autocare.safehandshomeandtechrepair.com" style="color:#cc0000;">autocare.safehandshomeandtechrepair.com</a>
      </div>
    </div>`;

    const body = {
      personalizations: [{ to: [{ email: to, name: customerName || 'Customer' }] }],
      from: { email: 'soulturnaround@icloud.com', name: 'SafeHands Auto Care' },
      reply_to: { email: 'soulturnaround@icloud.com' },
      subject: `Your SafeHands Auto Care Receipt — ${receiptNum}`,
      content: [{ type: 'text/html', value: receiptHTML }]
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return { statusCode: res.ok ? 200 : 500, body: res.ok ? 'OK' : 'Error' };
  }

  // ── Contact form auto-reply ────────────────────────────────────────────────
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
