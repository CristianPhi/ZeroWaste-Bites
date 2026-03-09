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
    if (!uri) {
      return NextResponse.json({ error: "Database configuration missing" }, { status: 500 });
    }

    // Buat client di dalam fungsi agar tidak error saat build
    const client = new MongoClient(uri);
    const body = await req.json();
    let phone = body.phone || body.phoneNumber;
    const email = body.email;

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    if (!phone && email) {
      const user = await usersCol.findOne({ email });
      if (!user || !user.phone) {
        await client.close();
        return NextResponse.json({ error: "No phone for this user" }, { status: 404 });
      }
      phone = user.phone;
    }

    if (!phone) {
      await client.close();
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await otpsCol.updateOne(
      { phone },
      { $set: { phone, code, expiresAt } },
      { upsert: true }
    );

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (email && gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `"ZeroWaste Bites" <${gmailUser}>`,
        to: email,
        subject: "Your Verification Code",
        text: `Your OTP code is: ${code}`,
      });
    }

    await client.close();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
