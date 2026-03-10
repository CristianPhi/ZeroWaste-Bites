import { NextResponse } from "next/server"
import { confirmPaymentByAmount } from "@/lib/payments"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { paymentId, paidAmount } = body as {
      paymentId?: string
      paidAmount?: number
    }

    if (!paymentId || typeof paidAmount !== "number") {
      return NextResponse.json(
        { error: "paymentId and paidAmount are required" },
        { status: 400 }
      )
    }

    const result = await confirmPaymentByAmount({ paymentId, paidAmount })

    if (!result.ok && result.reason === "not_found") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (!result.ok && result.reason === "amount_mismatch") {
      return NextResponse.json(
        {
          ok: false,
          status: "pending",
          message: "Amount mismatch. Please transfer the exact total amount.",
          expectedAmount: result.payment.totalAmount,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      ok: true,
      status: result.payment.status,
      alreadyPaid: result.alreadyPaid,
      payment: result.payment,
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: err?.message || "Unknown error" }, { status: 500 })
  }
}
