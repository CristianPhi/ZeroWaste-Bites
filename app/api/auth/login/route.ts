import { NextResponse } from "next/server";
import { readJsonFile } from "@/lib/storage";
import { connectMongo, hasMongoConfig } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  username?: string;
  password: string;
  phone?: string;
  createdAt?: string | Date;
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function emailLocalPart(email: string) {
  const idx = email.indexOf("@");
  return idx > 0 ? email.slice(0, idx).toLowerCase() : "";
}

export async function POST(req: Request) {
  let client;
  try {
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

    const body = await req.json();
    const { email, identifier, password } = body;
    const loginId = String(identifier || email || "").trim();

    if (!loginId || !password) {
      return NextResponse.json({ error: "Email/username dan password wajib diisi" }, { status: 400 });
    }

    const normalizedLoginId = loginId.toLowerCase();
    const isEmailLogin = normalizedLoginId.includes("@");

    if (!hasMongoConfig() && isProduction) {
      return NextResponse.json(
        { error: "MongoDB config belum lengkap di environment deployment." },
        { status: 503 }
      );
    }

    // Prefer MongoDB when available.
    if (hasMongoConfig()) {
      try {
        const mongo = await connectMongo();
        client = mongo.client;
        const db = mongo.db;
        const usersCol = db.collection("users");

        const user = await usersCol.findOne(
          isEmailLogin
            ? { email: normalizedLoginId, password }
            : {
                password,
                $or: [
                  { username: normalizeUsername(normalizedLoginId) },
                  { email: { $regex: `^${normalizedLoginId}@`, $options: "i" } },
                ],
              }
        );
        if (!user) {
          return NextResponse.json({ error: "Email/username atau password salah" }, { status: 401 });
        }

        const { password: _p, ...userWithoutPassword } = user;
        return NextResponse.json({ ok: true, user: userWithoutPassword });
      } catch (mongoErr: any) {
        if (isProduction) {
          return NextResponse.json(
            { error: "Koneksi database gagal.", detail: mongoErr?.message || "Unknown Mongo error" },
            { status: 503 }
          );
        }
        // For local development only, fallback to local JSON.
      }
    }

    const users = await readJsonFile<UserRecord[]>("users.json", []);
    const user = users.find((u) => {
      if (u.password !== password) return false;
      const emailMatch = String(u.email).trim().toLowerCase() === normalizedLoginId;
      const usernameMatch = normalizeUsername(String(u.username || "")) === normalizeUsername(normalizedLoginId);
      const localPartMatch = emailLocalPart(String(u.email).trim().toLowerCase()) === normalizeUsername(normalizedLoginId);
      return isEmailLogin ? emailMatch : usernameMatch || localPartMatch;
    });

    if (!user) {
      return NextResponse.json({ error: "Email/username atau password salah" }, { status: 401 });
    }

    const { password: _p, ...userWithoutPassword } = user;
    return NextResponse.json({ ok: true, user: userWithoutPassword });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
