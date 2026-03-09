import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import nodemailer from "nodemailer"

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri!);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let phone = body.phone || body.phoneNumber; 
    const email = body.email

    if (!client.connect) await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    // 1. Cari user di MongoDB jika inputnya email
    if (!phone && email) {
      const user = await usersCol.findOne({ email: email });
      if (!user || !user.phone) {
        return NextResponse.json({ error: "No phone for this user" }, { status: 404 });
      }
      phone = user.phone;
    }

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 404 });
      }
      phone = user.phone;
    }

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    // LOGIKA AUTO-CONVERT 0 KE +62
    phone = phone.toString().trim();
    if (phone.startsWith("0")) {
      phone = "+62" + phone.substring(1);
    } else if (phone.startsWith("62") && !phone.startsWith("+62")) {
      phone = "+" + phone;
    }

    const code = generateCode()
    const expiresAt = Date.now() + 5 * 60 * 1000 

    await otpsCol.updateOne(
      { phone: phone },
      { $set: { phone, code, expiresAt } },
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

    return NextResponse.json({ ok: true, formattedPhone: phone })

  } catch (err: any) {
    console.error("🔥 ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 })
  }
}
