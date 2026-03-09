import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, password, phone } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    // 1. Cek apakah email sudah terdaftar di MongoDB
    const existingUser = await usersCol.findOne({ email: email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // 2. Buat user baru
    const newUser = { 
      id: `user_${Date.now()}`, 
      name, 
      email, 
      password, // Tips: Kedepannya sebaiknya di-hash pakai bcrypt ya!
      phone 
    }

    // 3. Simpan ke MongoDB (Bukan file JSON!)
    await usersCol.insertOne(newUser);

    const { password: _p, ...out } = newUser
    return NextResponse.json(out)

  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 })
  }
}
