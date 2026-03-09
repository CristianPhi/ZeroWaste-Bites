import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    await client.connect();
    const db = client.db("zerowaste_db");
    const otpsCol = db.collection("otps");

    const otpRecord = await otpsCol.findOne({ phone, code });

    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Hapus OTP setelah berhasil digunakan
    await otpsCol.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ ok: true, message: "OTP verified" });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
