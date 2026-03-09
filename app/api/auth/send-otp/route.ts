import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri!);

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = body
    let phone = body.phone

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // LOGIKA AUTO-CONVERT 0 KE +62 BIAR USER BISA INPUT 08...
    phone = phone.toString().trim();
    if (phone.startsWith("0")) {
      phone = "+62" + phone.substring(1);
    } else if (phone.startsWith("62") && !phone.startsWith("+62")) {
      phone = "+" + phone;
    }

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    // Cek apakah email sudah terdaftar
    const existingUser = await usersCol.findOne({ email: email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const newUser = { 
      id: `user_${Date.now()}`, 
      name, 
      email, 
      password, 
      phone 
    }

    await usersCol.insertOne(newUser);

    const { password: _p, ...out } = newUser
    return NextResponse.json({ ok: true, user: out })

  } catch (err: any) {
    console.error("🔥 REGISTER ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 })
  }
}