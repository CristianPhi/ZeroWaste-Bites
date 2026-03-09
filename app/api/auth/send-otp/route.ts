import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

// Fungsi untuk membuat 6 digit angka acak
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || !uri.startsWith("mongodb")) {
      return NextResponse.json({ error: "Database URI invalid" }, { status: 500 });
    }

    const body = await req.json();
    const email = body.email;
    let phone = body.phone || body.phoneNumber;

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    // 1. Logika mencari nomor HP jika user hanya input Email
    if (!phone && email) {
      const user = await usersCol.findOne({ email });
      if (user && user.phone) {
        phone = user.phone;
      }
    }

    if (!phone) {
      await client.close();
      return NextResponse.json({ error: "Nomor HP tidak ditemukan" }, { status: 400 });
    }

    // 2. Buat OTP dan masa berlaku (5 menit)
    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // 3. Simpan/Update OTP di MongoDB
    await otpsCol.updateOne(
      { phone },
      { $set: { phone, code, expiresAt } },
      { upsert: true }
    );

    // 4. Proses Kirim Email menggunakan Nodemailer
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (email && gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass.replace(/\s+/g, ""), // Hapus spasi otomatis
        },
      });

      try {
        await transporter.sendMail({
          from: `"ZeroWaste Bites" <${gmailUser}>`,
          to: email,
          subject: "Kode OTP Verifikasi Anda",
          text: `Kode OTP Anda adalah: ${code}. Berlaku selama 5 menit.`,
        });
        console.log("✅ Email terkirim ke:", email);
      } catch (mailErr: any) {
        console.error("❌ Gagal kirim email:", mailErr.message);
      }
    }

    await client.close();
    return NextResponse.json({ ok: true, message: "OTP berhasil diproses" });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
