import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req) {
  try {
    const body = await req.json()
    let phone = body.phone
    const email = body.email

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    // 1. Cari data user jika inputnya email
    if (!phone && email) {
      const user = await usersCol.findOne({ email: email });
      if (!user || !user.phone) return NextResponse.json({ error: "No phone for this user" }, { status: 404 });
      phone = user.phone;
    }

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

if (!phone || !(phone.startsWith("0") || phone.startsWith("+62"))) {
  setLoading(false)
  return alert('Phone number must start with 0 or +62')
}

    const code = generateCode()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 menit

    // 2. Simpan/Update OTP ke MongoDB (Bukan file .json lagi!)
    await otpsCol.updateOne(
      { phone: phone },
      { $set: { phone, code, expiresAt } },
      { upsert: true }
    );

    // 3. Kirim Email via Gmail
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_PASS
    
    if (email && gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
      })

      await transporter.sendMail({
        from: `"ZeroWaste Bites" <${gmailUser}>`,
        to: email,
        subject: "Your Verification Code",
        text: `Your OTP code is: ${code}`,
      })
    }

    return NextResponse.json({ ok: true, message: "OTP sent successfully" })

  } catch (err) {
    console.error("🔥 DATABASE/MAIL ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 })
  } finally {
    // Tetap biarkan koneksi terbuka atau tutup jika perlu
  }
}