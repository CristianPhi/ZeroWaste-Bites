import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/storage"
// If `nodemailer` types aren't available in the environment, ignore the type error.
// @ts-ignore
import nodemailer from "nodemailer"

type Otp = { phone: string; code: string; expiresAt: number }
type User = { id: string; name: string; email: string; password?: string; phone?: string }

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendSmsViaTwilio(phone: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM
  if (!sid || !token || !from) return false

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const params = new URLSearchParams({ To: phone, From: from, Body: body })

  const auth = Buffer.from(`${sid}:${token}`).toString("base64")
  const res = await fetch(url, { method: "POST", body: params, headers: { Authorization: `Basic ${auth}` } })
  return res.ok
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Accept either phone or email; if email provided, look up user's phone
    let phone: string | undefined = body.phone
    const email: string | undefined = body.email

    if (!phone && email) {
      // lookup user
      const users = await readJsonFile<User[]>("users.json", [])
      const user = users.find((u) => u.email === email)
      if (!user || !user.phone) return NextResponse.json({ error: "No phone for this user" }, { status: 404 })
      phone = user.phone
    }

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 })

    // Basic validation: expect +62 prefix for Indonesian numbers
    if (!phone.startsWith("+62")) {
      return NextResponse.json({ error: "Phone must start with +62" }, { status: 400 })
    }

    const code = generateCode()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    const otps = await readJsonFile<Otp[]>("otps.json", [])
    // remove existing for phone
    const filtered = otps.filter((o) => o.phone !== phone)
    filtered.push({ phone, code, expiresAt })
    await writeJsonFile("otps.json", filtered)

    // If an email was provided and Gmail SMTP is configured, send OTP email
    const message = `Your verification code is ${code}`
    try {
      const gmailUser = process.env.GMAIL_USER
      const gmailPass = process.env.GMAIL_PASS
      if (email && gmailUser && gmailPass) {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: gmailUser, pass: gmailPass },
        })

        const mail = await transporter.sendMail({
          from: gmailUser,
          to: email,
          subject: "Your ZeroWaste Bites verification code",
          text: `OTP has been successfully sent to your email. Your code is: ${code}`,
        })

        if (mail.messageId) return NextResponse.json({ ok: true })
      }
    } catch (e) {
      // ignore email send errors and fallback
    }

    // Try to send SMS via Twilio if configured (fallback when no Gmail)
    try {
      const sent = await sendSmsViaTwilio(phone, message)
      if (sent) return NextResponse.json({ ok: true })
    } catch {
      // ignore
    }

    // Fallback for dev: return code in response so it can be used directly
    return NextResponse.json({ ok: true, code })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
