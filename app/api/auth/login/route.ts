import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { readJsonFile } from "@/lib/storage";

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
    const uri = process.env.MONGODB_URI;

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Prefer MongoDB when available.
    if (uri) {
      try {
        client = new MongoClient(uri);
        await client.connect();
        const db = client.db("zerowaste_db");
        const usersCol = db.collection("users");

        const user = await usersCol.findOne({ email: normalizedEmail, password });
        if (!user) {
          return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
        }

        const { password: _p, ...userWithoutPassword } = user;
        return NextResponse.json({ ok: true, user: userWithoutPassword });
      } catch {
        // If Mongo is unreachable, fallback to local JSON for development.
      }
    }

    const users = await readJsonFile<UserRecord[]>("users.json", []);
    const user = users.find(
      (u) => String(u.email).trim().toLowerCase() === normalizedEmail && u.password === password
    );

    if (!user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const { password: _p, ...userWithoutPassword } = user;
    return NextResponse.json({ ok: true, user: userWithoutPassword });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
