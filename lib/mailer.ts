import nodemailer from "nodemailer";

const senderEmail = (process.env.GMAIL_SENDER || "cristian.philander06@gmail.com").trim();

export async function sendResetOtpEmail(to: string, otp: string) {
  const appPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!appPassword) {
    throw new Error("GMAIL_APP_PASSWORD is not configured");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: senderEmail,
      pass: appPassword,
    },
  });

  try {
    await transporter.verify();
  } catch (err: any) {
    const msg = String(err?.message || "");
    if (/Invalid login|Username and Password not accepted|auth/i.test(msg)) {
      throw new Error("GMAIL auth failed: pastikan GMAIL_SENDER dan GMAIL_APP_PASSWORD berasal dari akun Gmail yang sama");
    }
    throw new Error(`SMTP verify failed: ${msg || "unknown"}`);
  }

  try {
    await transporter.sendMail({
      from: `ZeroWaste Bites <${senderEmail}>`,
      to,
      subject: "ZeroWaste Bites - Reset Password Code",
      text: `Kode reset password kamu adalah ${otp}. Kode ini berlaku selama 10 menit.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <h2 style="color:#1f2937;">Reset Password</h2>
          <p>Kode reset password kamu:</p>
          <p style="font-size:28px;letter-spacing:6px;font-weight:700;color:#16a34a;">${otp}</p>
          <p>Kode berlaku selama 10 menit.</p>
        </div>
      `,
    });
  } catch (err: any) {
    throw new Error(`SMTP send failed: ${String(err?.message || "unknown")}`);
  }
}
