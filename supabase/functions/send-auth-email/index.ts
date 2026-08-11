// Supabase Auth "Send Email" hook — Supabase calls this instead of its own
// (rate-limited to 2/hour) default mailer whenever it needs to send a
// signup-confirmation, magic-link, recovery, or email-change message. We
// verify the request really came from Supabase (Standard Webhooks HMAC,
// same scheme Svix uses) using SEND_EMAIL_HOOK_SECRET, then deliver the
// branded email via Resend — the same provider/pattern as send-ticket-email
// and send-invitation.
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ACTION_COPY: Record<string, { subject: string; heading: string; cta: string; blurb: string }> = {
  signup: {
    subject: '🎉 Confirmez votre compte OuiMoove',
    heading: 'Bienvenue sur OuiMoove !',
    cta: 'Confirmer mon compte',
    blurb: 'Cliquez ci-dessous pour activer votre compte et commencer à réserver des billets.',
  },
  recovery: {
    subject: '🔒 Réinitialisez votre mot de passe OuiMoove',
    heading: 'Réinitialisation du mot de passe',
    cta: 'Choisir un nouveau mot de passe',
    blurb: "Vous avez demandé à réinitialiser votre mot de passe. Si ce n'était pas vous, ignorez cet email.",
  },
  email_change: {
    subject: '✉️ Confirmez votre nouvelle adresse email',
    heading: 'Confirmation de changement d’email',
    cta: 'Confirmer la nouvelle adresse',
    blurb: 'Cliquez ci-dessous pour confirmer votre nouvelle adresse email OuiMoove.',
  },
  magiclink: {
    subject: '🔑 Votre lien de connexion OuiMoove',
    heading: 'Connexion à OuiMoove',
    cta: 'Me connecter',
    blurb: 'Cliquez ci-dessous pour vous connecter à votre compte.',
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? ''
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

  try {
    const wh = new Webhook(hookSecret)
    const { user, email_data } = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: {
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    if (!RESEND_KEY) {
      console.log('RESEND_API_KEY not configured — skipping auth email')
      return new Response(JSON.stringify({}), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const copy = ACTION_COPY[email_data.email_action_type] ?? ACTION_COPY.signup
    const confirmUrl = `${SUPABASE_URL}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#fbf7f3;font-family:sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid rgba(36,18,46,0.1)">
        <div style="font-size:26px;font-weight:800;color:#8b2276;margin-bottom:8px">OuiMoove</div>
        <h1 style="color:#241626;font-size:20px;margin:20px 0 8px">${copy.heading}</h1>
        <p style="color:#80708a;margin-bottom:28px;line-height:1.6">${copy.blurb}</p>
        <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#f49a0e,#d97f0a);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">${copy.cta} →</a>
        <p style="color:#a89aad;font-size:12px;margin-top:32px;border-top:1px solid rgba(36,18,46,0.1);padding-top:16px">
          Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email sans risque.<br/>
          OuiMoove — La billetterie des événements d'Afrique de l'Ouest
        </p>
      </div>
    </body></html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'OuiMoove <noreply@ouimoove.app>',
        reply_to: 'ouimoovellc@gmail.com',
        to: [user.email],
        subject: copy.subject,
        html,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend error: ${errText}`)
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: (err as Error).message } }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(JSON.stringify({}), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
})
