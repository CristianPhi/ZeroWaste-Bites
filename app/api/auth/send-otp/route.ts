import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    
    // Validasi skema secara manual sebelum dicolok ke MongoClient
    if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
      console.error("❌ Link MongoDB salah atau kosong!");
      return NextResponse.json({ error: "Database URI invalid" }, { status: 500 });
    }

    const client = new MongoClient(uri);
    const body = await req.json();
    const { email } = body;
    let phone = body.phone || body.phoneNumber;

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    // ... (sisa logika pencarian user dan kirim email tetap sama) ...
    
    await client.close();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
