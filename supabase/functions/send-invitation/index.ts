import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { to, inviterName, eventTitle, eventDate, eventCity, inviteUrl } = await req.json()
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_KEY) {
      console.error('send-invitation: RESEND_API_KEY is not set')
      return new Response(JSON.stringify({ error: 'Email service is not configured' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #0a0a0f; color: #f1f1f5; margin: 0; padding: 0; }
  .wrap { max-width: 520px; margin: 0 auto; padding: 40px 24px; }
  .logo { font-size: 1.5rem; font-weight: 800; color: #ff6b35; margin-bottom: 32px; }
  .card { background: #16161e; border: 1px solid #2a2a3a; border-radius: 16px; padding: 32px; }
  h2 { margin: 0 0 8px; font-size: 1.3rem; }
  p { color: #a0a0b8; line-height: 1.6; margin: 12px 0; }
  .event-box { background: #1e1e2e; border: 1px solid #2a2a3a; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
  .event-title { font-size: 1.1rem; font-weight: 700; color: #f1f1f5; }
  .event-meta { color: #7c3aed; font-size: 0.88rem; margin-top: 4px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #ff6b35, #e85d04); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 1rem; margin-top: 24px; }
  .footer { color: #555; font-size: 0.78rem; margin-top: 28px; text-align: center; }
</style></head>
<body>
  <div class="wrap">
    <div class="logo">OuiMoove</div>
    <div class="card">
      <h2>🎉 Vous êtes invité(e) !</h2>
      <p><strong>${inviterName}</strong> vous invite à un événement privé :</p>
      <div class="event-box">
        <div class="event-title">${eventTitle}</div>
        <div class="event-meta">📅 ${eventDate} &nbsp;·&nbsp; 📍 ${eventCity}</div>
      </div>
      <p>Cliquez sur le bouton ci-dessous pour voir l'événement et réserver votre place.</p>
      <a href="${inviteUrl}" class="btn">Voir l'événement →</a>
    </div>
    <div class="footer">OuiMoove — Vos billets, partout au Togo<br>Si vous n'attendiez pas cette invitation, ignorez cet email.</div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'OuiMoove <billets@ouimoove.app>',
        to: [to],
        subject: `🎉 Invitation privée : ${eventTitle}`,
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('send-invitation: Resend error', res.status, data)
      return new Response(JSON.stringify({ error: data?.message ?? 'Failed to send email' }), {
        status: res.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('send-invitation: unexpected error', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
