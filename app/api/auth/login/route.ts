import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let client;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is missing in Vercel settings");

    const { email, password } = await req.json();

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db("zerowaste_db");
    const user = await db.collection("users").findOne({ email, password });

    if (!user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const { password: _p, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (err: any) {
    // Pesan ini akan muncul di Vercel Logs untuk memberitahu alasan pastinya
    console.error("DATABASE_ERROR_LOG:", err.message);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
