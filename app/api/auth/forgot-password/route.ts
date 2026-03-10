import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/storage";
import { connectMongo, hasMongoConfig } from "@/lib/mongodb";
import { sendResetOtpEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

type UserRecord = {
  id: string;
  email: string;
  username?: string;
};

type OtpRecord = {
  email: string;
  code: string;
  purpose: "reset-password";
  expiresAt: string;
  createdAt: string;
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function randomOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    const identifier = String(body?.identifier || "").trim().toLowerCase();

    if (!identifier) {
      return NextResponse.json({ error: "Email atau username wajib diisi" }, { status: 400 });
    }

    let targetEmail = "";

    if (hasMongoConfig()) {
      const mongo = await connectMongo();
      client = mongo.client;
      const usersCol = mongo.db.collection("users");

      const user = await usersCol.findOne(
        identifier.includes("@")
          ? { email: identifier }
          : {
              $or: [
                { username: normalizeUsername(identifier) },
                { email: { $regex: `^${identifier}@`, $options: "i" } },
              ],
            }
      );

      if (user?.email) {
        targetEmail = String(user.email).trim().toLowerCase();
      }
    } else {
      const users = await readJsonFile<UserRecord[]>("users.json", []);
      const user = users.find((u) => {
        const email = String(u.email).trim().toLowerCase();
        if (identifier.includes("@")) return email === identifier;
        return (
          normalizeUsername(String(u.username || "")) === normalizeUsername(identifier) ||
          email.startsWith(`${normalizeUsername(identifier)}@`)
        );
      });
      if (user?.email) {
        targetEmail = String(user.email).trim().toLowerCase();
      }
    }

    // Return a generic success response to avoid account enumeration.
    if (!targetEmail) {
      return NextResponse.json({ ok: true });
    }

    const code = randomOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const otps = await readJsonFile<OtpRecord[]>("otps.json", []);
    const nextOtps = otps
      .filter((o) => !(o.email === targetEmail && o.purpose === "reset-password"))
      .filter((o) => new Date(o.expiresAt).getTime() > Date.now());

    nextOtps.push({
      email: targetEmail,
      code,
      purpose: "reset-password",
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    await writeJsonFile("otps.json", nextOtps);
    await sendResetOtpEmail(targetEmail, code);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal mengirim email reset password", detail: err?.message || "Unknown error" },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
