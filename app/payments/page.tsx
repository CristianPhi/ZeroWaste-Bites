"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { setDealClaimed } from "@/lib/claims"
import { AppLogo } from "@/components/app-logo"

type PaymentStatus = "pending" | "success"

function PaymentsPageContent() {
  const router = useRouter()
  const search = useSearchParams()
  const dealId = search?.get("dealId") ?? undefined
  const initialAmount = Number(search?.get("amount") ?? 5000)
  const [amount, setAmount] = useState<number>(initialAmount)
  const [method, setMethod] = useState<string>("qris")
  const [loading, setLoading] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [paymentId, setPaymentId] = useState<string>("")
  const [uniqueCode, setUniqueCode] = useState<number>(0)
  const [status, setStatus] = useState<PaymentStatus>("pending")
  const [error, setError] = useState<string>("")
  const [paidAmountInput, setPaidAmountInput] = useState<string>("")

  const totalAmount = useMemo(() => amount + uniqueCode, [amount, uniqueCode])

  useEffect(() => {
    const createPayment = async () => {
      if (!dealId) return

      setLoading(true)
      setError("")
      setShowQr(false)
      setStatus("pending")
      setPaidAmountInput("")

      try {
        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, amount: initialAmount, method }),
        })

        const data = await res.json()
        if (!res.ok || !data?.payment) {
          throw new Error(data?.error ?? "Failed to create payment")
        }

        setPaymentId(data.payment.id)
        setAmount(data.payment.baseAmount)
        setUniqueCode(data.payment.uniqueCode)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create payment")
      } finally {
        setLoading(false)
      }
    }

    void createPayment()
  }, [dealId, initialAmount, method])

  const finishSuccess = () => {
    if (!dealId) return
    setDealClaimed(dealId)
    router.push(
      `/payments/success?dealId=${encodeURIComponent(dealId)}&amount=${totalAmount}&status=success`
    )
  }

  const confirmPayment = async (paidAmount: number) => {
    if (!paymentId) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, paidAmount }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error ?? "Payment confirmation failed")
      }

      if (!data?.ok || data?.status !== "success") {
        setStatus("pending")
        setError(data?.message ?? "Payment still pending.")
        return
      }

      setStatus("success")
      finishSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment confirmation failed")
    } finally {
      setLoading(false)
    }
  }

  const onPay = async () => {
    if (!dealId || !paymentId) return
    // For QRIS, pressing Pay should display the QR code for scanning
    if (method === "qris") {
      setShowQr(true)
      return
    }

    await confirmPayment(totalAmount)
  }

  const confirmQris = async () => {
    if (!dealId || !paymentId) return

    const paidAmount = Number(paidAmountInput.replace(/\D/g, ""))
    if (!paidAmount) {
      setError("Enter the paid amount first.")
      return
    }

    await confirmPayment(paidAmount)
  }

  return (
    <main className="w-full px-4 py-12">
      <header className="mb-4">
        <Link href="/" aria-label="Go to Feed">
          <AppLogo alt="ZeroWaste Bites" className="h-16 w-auto" priority />
        </Link>
        <h1 className="mt-2 text-center text-lg font-semibold tracking-tight text-foreground">Checkout</h1>
      </header>

      <label className="flex flex-col text-sm">
        <span className="mb-1 text-xs text-muted-foreground">Amount (IDR)</span>
        <input
          type="number"
          value={amount}
          className="rounded-md border px-3 py-2 disabled:opacity-60"
          disabled
        />
      </label>

      <div className="mt-3 rounded-md border bg-secondary/30 p-3 text-sm">
        <p className="font-medium">Unique payment code: {uniqueCode || "..."}</p>
        <p className="mt-1 text-muted-foreground">Please transfer exact total:</p>
        <p className="text-base font-semibold">IDR {totalAmount.toLocaleString("id-ID")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Status: {status === "success" ? "Success" : "Pending"}
        </p>
      </div>

      <div className="mt-4 rounded-md border p-4">
        <p className="text-sm text-muted-foreground">Choose payment method</p>
        <div className="mt-2 flex flex-col gap-2">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="method" checked={method === "qris"} onChange={() => setMethod("qris")} />
            <span>QRIS</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="method" checked={method === "ewallet"} onChange={() => setMethod("ewallet")} />
            <span>E-Wallet</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} />
            <span>Card</span>
          </label>
        </div>
      </div>

      {method === "qris" && (
        <div className="mt-4 rounded-md border p-4 text-center">
          {!showQr ? (
            <>
              <p className="mb-2 text-sm font-medium">QRIS payment selected</p>
              <p className="text-xs text-muted-foreground">Press Pay to display the QR code for scanning.</p>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium">Scan to pay (QRIS)</p>
                <img src="/images/QR.jpeg" alt="QRIS QR code" className="mx-auto w-48 h-48 object-contain" />
              <p className="mt-2 text-xs text-muted-foreground">Open your banking or QRIS app and scan the code above to complete payment.</p>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Pay exact amount IDR {totalAmount.toLocaleString("id-ID")}, then confirm.</p>
                <label className="mt-2 flex flex-col text-left text-xs">
                  <span className="mb-1 text-muted-foreground">Amount you paid (IDR)</span>
                  <input
                    type="number"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    className="rounded-md border px-3 py-2 text-sm"
                    placeholder="Example: 10345"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={confirmQris}
                  disabled={loading}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {loading ? "Checking…" : "I have paid — Check status"}
                </button>
                <button
                  onClick={() => setShowQr(false)}
                  disabled={loading}
                  className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={onPay}
        disabled={loading || !paymentId}
        className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Processing…" : `Pay IDR ${totalAmount.toLocaleString("id-ID")} (${method.toUpperCase()})`}
      </button>
    </main>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<main className="w-full px-4 py-12" />}>
      <PaymentsPageContent />
    </Suspense>
  )
}
