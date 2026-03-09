import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import nodemailer from "nodemailer"

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri!);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let phone = body.phone || body.phoneNumber; 
    const email = body.email

    if (!client.connect) await client.connect();
    const db = client.db("zerowaste_db");
    const usersCol = db.collection("users");
    const otpsCol = db.collection("otps");

    // 1. Cari user di MongoDB jika inputnya email
    if (!phone && email) {
      const user = await usersCol.findOne({ email: email });
      if (!user || !user.phone) {
        return NextResponse.json({ error: "No phone for this user" }, { status: 404 });
      }
      phone = user.phone;
    }

    if (!phone) return NextResponse.json({ error: "Phone required" }, { status:
