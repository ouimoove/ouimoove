import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// User-controlled fields (display name, event/ticket titles) are
// interpolated into the email HTML below — escape them so a crafted name
// or event title can't inject markup into the confirmation email.
function escapeHtml(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { to, userName: userNameRaw, orderId, items, total, method } = await req.json()
    const userName = escapeHtml(userNameRaw)
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_KEY) {
      console.log('RESEND_API_KEY not configured — skipping email')
      return new Response(JSON.stringify({ ok: false, reason: 'no_key' }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const rows = (items ?? []).map((i: any) =>
      `<tr style="border-bottom:1px solid #2d2d4a">
        <td style="padding:10px 0;color:#e0e0f0">${escapeHtml(i.eventTitle)} — ${escapeHtml(i.ticketName)}</td>
        <td style="text-align:center;padding:10px 0;color:#e0e0f0">×${Number(i.qty) || 0}</td>
        <td style="text-align:right;padding:10px 0;color:#e0e0f0">${(Number(i.price) * Number(i.qty) || 0).toLocaleString('fr-FR')} FCFA</td>
      </tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#07070e;font-family:sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#0a0a0f;border-radius:16px;padding:32px;border:1px solid #1a1a2e">
        <div style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#ff6b35,#ff9f1c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px">OuiMoove</div>
        <h1 style="color:#fff;font-size:22px;margin:20px 0 8px">🎉 Paiement confirmé !</h1>
        <p style="color:#a0a0b0;margin-bottom:24px">Bonjour <strong style="color:#fff">${userName}</strong>, vos billets sont réservés.</p>
        <div style="background:#13131e;border-radius:12px;padding:20px;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr><th style="text-align:left;padding-bottom:12px;color:#6b6b8a;font-weight:500">Billet</th><th style="text-align:center;padding-bottom:12px;color:#6b6b8a;font-weight:500">Qté</th><th style="text-align:right;padding-bottom:12px;color:#6b6b8a;font-weight:500">Prix</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="2" style="padding-top:14px;font-weight:700;color:#ff6b35;font-size:15px">TOTAL</td><td style="text-align:right;padding-top:14px;font-weight:700;color:#ff6b35;font-size:15px">${total.toLocaleString('fr-FR')} FCFA</td></tr></tfoot>
          </table>
        </div>
        <p style="color:#6b6b8a;font-size:13px;margin-bottom:4px">📄 Référence : <code style="color:#a0a0b0">${orderId}</code></p>
        <p style="color:#6b6b8a;font-size:13px;margin-bottom:24px">💳 Méthode : ${method}</p>
        <p style="color:#a0a0b0;margin-bottom:20px">Retrouvez vos billets et QR codes dans <strong style="color:#fff">Mes Billets</strong> sur OuiMoove.</p>
        <a href="https://ouimoove.app" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#e85d04);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Voir mes billets →</a>
        <p style="color:#3a3a5a;font-size:12px;margin-top:32px;border-top:1px solid #1a1a2e;padding-top:16px">OuiMoove — Vos billets, partout au Togo</p>
      </div>
    </body></html>`

    const res  = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:     'OuiMoove <tickets@ouimoove.app>',
        to:      [to],
        subject: `🎫 Vos billets OuiMoove — Réf. ${String(orderId).slice(0,8).toUpperCase()}`,
        html,
      }),
    })
    const data = await res.json()
    return new Response(JSON.stringify({ ok: res.ok, data }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
