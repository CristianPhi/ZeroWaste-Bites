import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/storage";
import { connectMongo, hasMongoConfig } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  createdAt?: string | Date;
};

export async function POST(req: Request) {
  let client;
  try {
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

    const body = await req.json();
    const { name, email, password, phone } = body || {};

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!hasMongoConfig() && isProduction) {
      return NextResponse.json(
        { error: "MongoDB config belum lengkap di environment deployment." },
        { status: 503 }
      );
    }

    // Cara aman memproses nomor tanpa startsWith di awal
    let p = String(phone).trim();
    if (p.substring(0, 1) === '0') {
      p = "+62" + p.substring(1);
    }

    if (hasMongoConfig()) {
      try {
        const mongo = await connectMongo();
        client = mongo.client;
        const db = mongo.db;
        const usersCol = db.collection("users");

        const existingUser = await usersCol.findOne({ email: normalizedEmail });
        if (existingUser) {
          return NextResponse.json({ error: "Email exists" }, { status: 409 });
        }

        await usersCol.insertOne({
          id: `user_${Date.now()}`,
          name,
          email: normalizedEmail,
          password,
          phone: p,
          createdAt: new Date(),
        });

        return NextResponse.json({ ok: true });
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

    if (isProduction) {
      return NextResponse.json(
        { error: "Database belum terhubung. Cek MONGODB_URI di environment deployment." },
        { status: 503 }
      );
    }

    const users = await readJsonFile<UserRecord[]>("users.json", []);
    const exists = users.some((u) => String(u.email).trim().toLowerCase() === normalizedEmail);
    if (exists) {
      return NextResponse.json({ error: "Email exists" }, { status: 409 });
    }

    users.push({
      id: `user_${Date.now()}`,
      name,
      email: normalizedEmail,
      password,
      phone: p,
      createdAt: new Date().toISOString(),
    });

    await writeJsonFile("users.json", users);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
