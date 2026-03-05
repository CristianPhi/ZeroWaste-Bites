import { NextResponse } from "next/server"
import { createPaymentRequest, type PaymentMethod } from "@/lib/payments"

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === "qris" || value === "ewallet" || value === "card"
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { dealId, amount, method } = body as {
      dealId?: string
      amount?: number
      method?: string
    }

    if (!dealId || typeof amount !== "number" || !isPaymentMethod(method ?? "")) {
      return NextResponse.json(
        { error: "dealId, amount, method are required" },
        { status: 400 }
      )
    }

    const payment = await createPaymentRequest({
      dealId,
      amount,
      method,
    })

    return NextResponse.json({ ok: true, payment })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
