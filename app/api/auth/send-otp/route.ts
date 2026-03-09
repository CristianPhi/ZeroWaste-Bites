import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Definisikan client di luar agar bisa digunakan kembali
const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Gunakan destructuring dengan default value kosong agar tidak undefined
    const { name = "", email = "", password = "", phone = "" } = body || {};

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Pastikan phone diolah hanya di DALAM fungsi POST
    let formattedPhone = String(phone).trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+62" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("62") && !formattedPhone.startsWith("+62")) {
      formattedPhone = "+" + formattedPhone;
    }

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    const existingUser = await usersCol.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      phone: formattedPhone,
    };

    await usersCol.insertOne(newUser);
    return NextResponse.json({ ok: true, message: "User registered" });

  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}

// Tambahkan ini sebagai pengaman tambahan agar Vercel tidak render saat build
export const dynamic = "force-dynamic";
