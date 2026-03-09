import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri || "");

export async function POST(req) {
  try {
    const body = await req.json()
    // Beri nilai default {} agar tidak error saat destructuring
    const { name, email, password, phone } = body || {}

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Pastikan phone diubah ke string dan aman dari 'undefined'
    const phoneStr = String(phone || "").trim();
    let formattedPhone = phoneStr;

    if (phoneStr.startsWith("0")) {
      formattedPhone = "+62" + phoneStr.substring(1);
    } else if (phoneStr.startsWith("62") && !phoneStr.startsWith("+62")) {
      formattedPhone = "+" + phoneStr;
    }

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    const existingUser = await usersCol.findOne({ email: email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const newUser = { 
      id: `user_${Date.now()}`, 
      name, 
      email, 
      password, 
      phone: formattedPhone 
    }

    await usersCol.insertOne(newUser);
    return NextResponse.json({ ok: true, message: "User registered" })

  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err?.message }, { status: 500 })
  }
}

// BARIS INI WAJIB ADA BIAR GAK ERROR PAS BUILD
export const dynamic = 'force-dynamic'
