import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/storage";
import { connectMongo, hasMongoConfig } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

type OtpRecord = {
  email: string;
  code: string;
  purpose: "reset-password";
  expiresAt: string;
  createdAt: string;
};

type UserRecord = {
  id: string;
  email: string;
  password: string;
};

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();
    const newPassword = String(body?.newPassword || "");

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, kode OTP, dan password baru wajib diisi" }, { status: 400 });
    }

    const otps = await readJsonFile<OtpRecord[]>("otps.json", []);
    const otp = otps.find(
      (o) =>
        o.email === email &&
        o.code === code &&
        o.purpose === "reset-password" &&
        new Date(o.expiresAt).getTime() > Date.now()
    );

    if (!otp) {
      return NextResponse.json({ error: "Kode OTP tidak valid atau sudah kadaluarsa" }, { status: 400 });
    }

    if (hasMongoConfig()) {
      const mongo = await connectMongo();
      client = mongo.client;
      const usersCol = mongo.db.collection("users");
      const result = await usersCol.updateOne({ email }, { $set: { password: newPassword } });
      if (!result.matchedCount) {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
      }
    } else {
      const users = await readJsonFile<UserRecord[]>("users.json", []);
      const idx = users.findIndex((u) => String(u.email).trim().toLowerCase() === email);
      if (idx < 0) {
        return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
      }
      users[idx].password = newPassword;
      await writeJsonFile("users.json", users);
    }

    const nextOtps = otps.filter((o) => !(o.email === email && o.purpose === "reset-password"));
    await writeJsonFile("otps.json", nextOtps);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
