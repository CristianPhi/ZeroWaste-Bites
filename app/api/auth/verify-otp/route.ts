import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return NextResponse.json({ error: "DB URI Missing" }, { status: 500 });

    const body = await req.json();
    // Gunakan trim() untuk hapus spasi yang tidak sengaja terketik
    const phone = String(body.phone || "").trim();
    const code = String(body.code || "").trim();

    if (!phone || !code) {
      return NextResponse.json({ error: "Nomor HP dan kode wajib diisi" }, { status: 400 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("zerowaste_db");
    const otpsCol = db.collection("otps");

    // Cari OTP yang paling baru berdasarkan nomor HP dan Kode
    const otpRecord = await otpsCol.findOne({ 
      phone: phone, 
      code: code 
    });

    if (!otpRecord) {
      await client.close();
      // Tips: Cek di MongoDB Atlas apakah phone tersimpan dengan format yang sama (+62 atau 0)
      return NextResponse.json({ error: "Kode OTP salah atau tidak terdaftar" }, { status: 400 });
    }

    // Cek kadaluarsa
    if (otpRecord.expiresAt < Date.now()) {
      await client.close();
      return NextResponse.json({ error: "OTP sudah kadaluarsa, silakan kirim ulang" }, { status: 400 });
    }

    // Jika sukses, hapus agar tidak bisa dipakai ulang
    await otpsCol.deleteOne({ _id: otpRecord._id });
    
    await client.close();
    return NextResponse.json({ ok: true, message: "Verifikasi Berhasil" });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}
