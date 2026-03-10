import { readJsonFile, writeJsonFile } from "@/lib/storage"
import { connectMongo, hasMongoConfig } from "@/lib/mongodb"

export type PaymentMethod = "qris" | "ewallet" | "card"
export type PaymentStatus = "pending" | "success"

export interface PaymentRecord {
  id: string
  dealId: string
  method: PaymentMethod
  baseAmount: number
  uniqueCode: number
  totalAmount: number
  status: PaymentStatus
  createdAt: string
  paidAt?: string
}

const FILE_NAME = "payments.json"
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1"

async function readStore(): Promise<{ payments: PaymentRecord[] }> {
  const parsed = await readJsonFile<{ payments?: PaymentRecord[] }>(FILE_NAME, { payments: [] })
  if (!Array.isArray(parsed.payments)) {
    return { payments: [] }
  }
  return { payments: parsed.payments }
}

async function writeStore(data: { payments: PaymentRecord[] }) {
  await writeJsonFile(FILE_NAME, data)
}

function randomUniqueCode() {
  return Math.floor(Math.random() * 900) + 100
}

function makePaymentId() {
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `pay_${stamp}_${rand}`
}

export async function createPaymentRequest(input: {
  dealId: string
  amount: number
  method: PaymentMethod
}) {
  if (hasMongoConfig()) {
    let client
    try {
      const mongo = await connectMongo()
      client = mongo.client
      const col = mongo.db.collection("payments")

      const baseAmount = Math.max(1, Math.floor(input.amount))
      let uniqueCode = randomUniqueCode()
      let totalAmount = baseAmount + uniqueCode

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const collision = await col.findOne({
          status: "pending",
          method: input.method,
          totalAmount,
        })

        if (!collision) break

        uniqueCode = randomUniqueCode()
        totalAmount = baseAmount + uniqueCode
      }

      const payment: PaymentRecord = {
        id: makePaymentId(),
        dealId: input.dealId,
        method: input.method,
        baseAmount,
        uniqueCode,
        totalAmount,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      await col.insertOne(payment)
      return payment
    } finally {
      if (client) await client.close()
    }
  }

  if (isProduction) {
    throw new Error("Payments storage not configured")
  }

  const baseAmount = Math.max(1, Math.floor(input.amount))
  const store = await readStore()

  let uniqueCode = randomUniqueCode()
  let totalAmount = baseAmount + uniqueCode

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const collision = store.payments.some(
      (payment) =>
        payment.status === "pending" &&
        payment.method === input.method &&
        payment.totalAmount === totalAmount
    )

    if (!collision) break

    uniqueCode = randomUniqueCode()
    totalAmount = baseAmount + uniqueCode
  }

  const payment: PaymentRecord = {
    id: makePaymentId(),
    dealId: input.dealId,
    method: input.method,
    baseAmount,
    uniqueCode,
    totalAmount,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  store.payments.push(payment)
  await writeStore(store)

  return payment
}

export async function confirmPaymentByAmount(input: {
  paymentId: string
  paidAmount: number
}) {
  if (hasMongoConfig()) {
    let client
    try {
      const mongo = await connectMongo()
      client = mongo.client
      const col = mongo.db.collection("payments")

      const current = (await col.findOne({ id: input.paymentId })) as PaymentRecord | null
      if (!current) {
        return { ok: false as const, reason: "not_found" as const }
      }

      if (current.status === "success") {
        return { ok: true as const, payment: current, alreadyPaid: true as const }
      }

      if (Math.floor(input.paidAmount) !== current.totalAmount) {
        return { ok: false as const, reason: "amount_mismatch" as const, payment: current }
      }

      const updated: PaymentRecord = {
        ...current,
        status: "success",
        paidAt: new Date().toISOString(),
      }

      await col.updateOne(
        { id: input.paymentId },
        { $set: { status: "success", paidAt: updated.paidAt } }
      )

      return { ok: true as const, payment: updated, alreadyPaid: false as const }
    } finally {
      if (client) await client.close()
    }
  }

  if (isProduction) {
    throw new Error("Payments storage not configured")
  }

  const store = await readStore()
  const index = store.payments.findIndex((payment) => payment.id === input.paymentId)

  if (index < 0) {
    return { ok: false as const, reason: "not_found" as const }
  }

  const current = store.payments[index]

  if (current.status === "success") {
    return { ok: true as const, payment: current, alreadyPaid: true as const }
  }

  if (Math.floor(input.paidAmount) !== current.totalAmount) {
    return { ok: false as const, reason: "amount_mismatch" as const, payment: current }
  }

  const updated: PaymentRecord = {
    ...current,
    status: "success",
    paidAt: new Date().toISOString(),
  }

  store.payments[index] = updated
  await writeStore(store)

  return { ok: true as const, payment: updated, alreadyPaid: false as const }
}
