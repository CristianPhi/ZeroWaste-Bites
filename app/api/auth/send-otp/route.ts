import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return NextResponse.json({ error: "DB URI Missing" }, { status: 500 });

    const body = await req.json();
    // DEFISINISIKAN email DI SINI AGAR TIDAK REFERENCE ERROR
    const email = body.email;
    let phone = body.phone || body.phoneNumber;

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    // Jika input hanya email, cari nomor HP-nya di database
    if (!phone && email) {
      const user = await usersCol.findOne({ email });
      if (user && user.phone) {
        phone = user.phone;
      }
    }

    if (!phone) {
      await client.close();
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Simpan ke MongoDB
    await otpsCol.updateOne(
      { phone },
      { $set: { phone, code, expiresAt } },
      { upsert: true }
    );

    // KIRIM EMAIL
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (email && gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { 
          user: gmailUser, 
          pass: gmailPass.replace(/\s+/g, "") 
        },
      });

      try {
        await transporter.verify();
        await transporter.sendMail({
          from: `"ZeroWaste Bites" <${gmailUser}>`,
          to: email,
          subject: "Kode OTP ZeroWaste Bites",
          text: `Kode verifikasi Anda adalah: ${code}`,
        });
      } catch (mailErr) {
        console.error("❌ Email Error:", mailErr);
      }
    }

    await client.close();
    return NextResponse.json({ ok: true, message: "OTP Sent" });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
