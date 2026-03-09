import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import nodemailer from "nodemailer"

// BAGIAN INI WAJIB ADA (Koneksi ke MongoDB)
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Please add your MONGODB_URI to .env.local");
const client = new MongoClient(uri);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let phone = body.phone || body.phoneNumber; 
    const email = body.email

    // SEKARANG 'client' SUDAH DIDEFINISIKAN DI ATAS
    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    if (!phone && email) {
      const user = await usersCol.findOne({ email: email });
      if (!user || !user.phone) {
        return NextResponse.json({ error: "No phone for this user" }, { status: 404 });
      }
      phone = user.phone;
    }

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    // LOGIKA AUTO-CONVERT 0 KE +62
    let formattedPhone = phone.toString().trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+62" + formattedPhone.substring(1);
    }

    const code = generateCode()
    const expiresAt = Date.now() + 5 * 60 * 1000 

    await otpsCol.updateOne(
      { phone: formattedPhone },
      { $set: { phone: formattedPhone, code, expiresAt } },
      { upsert: true }
    );

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

    return NextResponse.json({ ok: true, formattedPhone: formattedPhone })

  } catch (err: any) {
    console.error("🔥 ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 })
  }
}
