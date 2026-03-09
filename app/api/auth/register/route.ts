import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

const uri = process.env.MONGODB_URI || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body || {};

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Cara aman memproses nomor tanpa startsWith di awal
    let p = String(phone).trim();
    if (p.substring(0, 1) === '0') {
      p = "+62" + p.substring(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    const existingUser = await usersCol.findOne({ email });
    if (existingUser) {
      await client.close();
      return NextResponse.json({ error: "Email exists" }, { status: 409 });
    }

    await usersCol.insertOne({
      id: `user_${Date.now()}`,
      name, email, password, phone: p,
      createdAt: new Date()
    });

    await client.close();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
