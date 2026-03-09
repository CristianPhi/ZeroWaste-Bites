import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let client;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return NextResponse.json({ error: "DB URI Missing" }, { status: 500 });

    const { email, password } = await req.json();

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    // Cari user yang email DAN password-nya cocok
    const user = await usersCol.findOne({ email, password });

    if (!user) {
      await client.close();
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    // Berhasil login, kirim data user (tanpa password) ke frontend
    const { password: _p, ...userWithoutPassword } = user;
    
    await client.close();
    return NextResponse.json({ ok: true, user: userWithoutPassword });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
