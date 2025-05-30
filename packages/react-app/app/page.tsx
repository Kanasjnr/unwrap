"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "@/components/ui/button";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Gift Crypto with Ease
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Create digital gift cards with cUSD and send them to anyone via
              email. Perfect for birthdays, holidays, or any special occasion.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/create">Create Gift Card</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href="/redeem">Redeem Gift Card</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="mb-4 text-4xl">🎁</div>
              <h3 className="mb-2 text-xl font-semibold">Create</h3>
              <p className="text-muted-foreground">
                Choose an amount in cUSD and add a personal message
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="mb-4 text-4xl">📧</div>
              <h3 className="mb-2 text-xl font-semibold">Send</h3>
              <p className="text-muted-foreground">
                Enter recipient's email and we'll send them a unique redemption
                code
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="mb-4 text-4xl">💎</div>
              <h3 className="mb-2 text-xl font-semibold">Redeem</h3>
              <p className="text-muted-foreground">
                Recipient enters the code to receive cUSD directly to their
                wallet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-lg border bg-background p-6">
              <h3 className="mb-2 text-xl font-semibold">What is cUSD?</h3>
              <p className="text-muted-foreground">
                cUSD is a stablecoin on the Celo blockchain, pegged to the US
                Dollar. It's perfect for gift cards as its value remains stable.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <h3 className="mb-2 text-xl font-semibold">
                How do I redeem a gift card?
              </h3>
              <p className="text-muted-foreground">
                Click the "Redeem Gift Card" button above, connect your wallet,
                and enter the redemption code from your email.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <h3 className="mb-2 text-xl font-semibold">
                What wallets are supported?
              </h3>
              <p className="text-muted-foreground">
                We support MetaMask, Valora, and other Celo-compatible wallets.
                You'll need a wallet to create or redeem gift cards.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
