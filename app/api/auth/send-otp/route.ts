import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    // Cek URI agar tidak muncul alert "Database URI invalid"
    if (!uri || !uri.startsWith("mongodb")) {
      return NextResponse.json({ error: "Database URI invalid" }, { status: 500 });
    }

    const body = await req.json();
    const email = body.email; // Variabel email didefinisikan di sini
    let phone = body.phone || body.phoneNumber;

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("zerowaste_db");
    
    // ... proses simpan OTP dan kirim email ...
    
    await client.close();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
