import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, password } = body
    let phone = body.phone

    // Pastikan semua field terisi
    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // PROTEKSI: Cek apakah phone ada isinya sebelum pakai startsWith
    phone = phone.toString().trim();
    if (phone && phone.startsWith("0")) {
      phone = "+62" + phone.substring(1);
    } else if (phone && phone.startsWith("62") && !phone.startsWith("+62")) {
      phone = "+" + phone;
    }

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    // Cek apakah email sudah ada
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
    return NextResponse.json({ ok: true, message: "User registered" })

  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 })
  }
}
