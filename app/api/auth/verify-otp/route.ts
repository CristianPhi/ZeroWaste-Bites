import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return NextResponse.json({ error: "DB URI Missing" }, { status: 500 });

    const body = await req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: "Nomor HP dan kode wajib diisi" }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("zerowaste_db");
    const otpsCol = db.collection("otps");

    // 1. Cari OTP berdasarkan nomor HP dan kode yang COCOK
    // Pastikan tipe data 'code' konsisten (string)
    const otpRecord = await otpsCol.findOne({ 
      phone: String(phone), 
      code: String(code) 
    });

    if (!otpRecord) {
      await client.close();
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    // 2. Cek apakah OTP sudah kadaluarsa
    if (otpRecord.expiresAt < Date.now()) {
      await client.close();
      return NextResponse.json({ error: "OTP sudah kadaluarsa" }, { status: 400 });
    }

    // 3. Jika berhasil, hapus OTP agar tidak bisa dipakai dua kali
    await otpsCol.deleteOne({ _id: otpRecord._id });
    
    await client.close();
    return NextResponse.json({ ok: true, message: "Verifikasi Berhasil" });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
