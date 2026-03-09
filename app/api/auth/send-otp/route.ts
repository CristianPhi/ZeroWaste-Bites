Import { NextResponse } from "next/server"
import { readJsonFile, writeJsonFile } from "@/lib/storage"

type User = { id: string; name: string; email: string; password: string; phone?: string }

export async function POST(req) {
  try {
    const body = await req.json()
    // Ambil phone atau email dari body
    let phone = body.phone || body.phoneNumber; // Antisipasi kalau namanya beda
    const email = body.email

    await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");

    // 1. Cari user di MongoDB jika inputnya email
    if (!phone && email) {
      const user = await usersCol.findOne({ email: email });
      if (!user || !user.phone) {
        return NextResponse.json({ error: "No phone for this user" }, { status: 404 });
      }
      phone = user.phone;
    }

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    // 2. LOGIKA AUTO-CONVERT 0 KE +62
    phone = phone.toString().trim();
    if (phone.startsWith("0")) {
      phone = "+62" + phone.substring(1);
    } else if (phone.startsWith("62") && !phone.startsWith("+62")) {
      phone = "+" + phone;
    }

    const users = await readJsonFile<User[]>("users.json", [])

    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const id = `user_${Date.now()}`
    const newUser: User = { id, name, email, password, phone }
    users.push(newUser)
    await writeJsonFile("users.json", users)

    const { password: _p, ...out } = newUser
    return NextResponse.json({ ok: true, formattedPhone: phone }) // Kirim balik phone buat debug

  } catch (err) {
    console.error("🔥 ERROR:", err);
    return NextResponse.json({ error: "Server error", detail: err.message }, { status: 500 })
  }
}