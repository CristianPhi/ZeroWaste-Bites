import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json({ error: "Database URI is missing" }, { status: 500 });
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    // Cari user berdasarkan email dan password
    const user = await usersCol.findOne({ email, password });

    if (!user) {
      await client.close();
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    // Hapus password dari data yang dikirim ke frontend demi keamanan
    const { password: _p, ...userWithoutPassword } = user;
    
    await client.close();
    return NextResponse.json(userWithoutPassword);
  } catch (err: any) {
    console.error("Login Error:", err.message);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
