import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Tambahkan ini agar Vercel tidak mencoba merender file ini saat build
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json({ error: "Database configuration missing" }, { status: 500 });
    }

    const client = new MongoClient(uri);
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
    }

    await client.connect();
    const db = client.db("zerowaste_db");
    const otpsCol = db.collection("otps");

    // Cari OTP yang cocok
    const otpRecord = await otpsCol.findOne({ phone, code });

    if (!otpRecord) {
      await client.close();
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    // Cek kadaluarsa
    if (otpRecord.expiresAt < Date.now()) {
      await client.close();
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Hapus OTP setelah sukses verifikasi
    await otpsCol.deleteOne({ _id: otpRecord._id });
    
    await client.close();
    return NextResponse.json({ ok: true, message: "Verified successfully" });

  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
