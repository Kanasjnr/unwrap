'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useUnwrap } from '@/hooks/unWrap'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function RedeemGiftCard() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [redeemState, setRedeemState] = useState<'idle' | 'checking' | 'redeeming' | 'success' | 'error'>('idle')
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    description: string;
    status: 'error' | 'invalid' | 'insufficient_funds' | 'rejected';
  } | null>(null)

  const {
    redeemGiftCard,
    error,
    clearError,
    redeemSuccess,
    isRedeeming,
    isWaitingForRedeem,
  } = useUnwrap()

  // Respect user's motion preferences
  const prefersReducedMotion = useReducedMotion()

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: "easeOut"
      }
    }
  }

  const formVariants = {
    hidden: { 
      opacity: 0, 
      x: prefersReducedMotion ? 0 : -20,
      scale: prefersReducedMotion ? 1 : 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: "easeOut"
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : i * 0.1,
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: "easeOut"
      }
    })
  }

  // Reset states when component mounts
  useEffect(() => {
    setRedeemState('idle')
    clearError()
    setErrorDetails(null)
  }, [clearError])

  // Update state based on transaction states
  useEffect(() => {
    if (isRedeeming || isWaitingForRedeem) {
      setRedeemState('redeeming')
    } else if (redeemSuccess) {
      setRedeemState('success')
    } else if (error) {
      setRedeemState('error')
    }
  }, [isRedeeming, isWaitingForRedeem, redeemSuccess, error])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !redeemGiftCard) {
      setErrorDetails({
        title: "Invalid Code",
        description: "Please enter a valid redemption code",
        status: 'invalid'
      });
      setRedeemState('error');
      return;
    }

    setRedeemState('checking')
    try {
      // First check if the gift card exists in MongoDB
      const checkResponse = await fetch('/api/gift-card/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
          setErrorDetails({
            title: "Gift Card Not Found",
            description: "This gift card code does not exist in our system.",
            status: 'invalid'
          });
          setRedeemState('error')
          return;
        }
        throw new Error(checkResult.error || 'Failed to check gift card');
      }

      if (checkResult.status === 'redeemed') {
        setErrorDetails({
          title: "Already Redeemed",
          description: "This gift card has already been redeemed.",
          status: 'invalid'
        });
        setRedeemState('error')
        return;
      }

      // If gift card exists and is not redeemed, proceed with redemption
      setRedeemState('redeeming')
      const result = await redeemGiftCard(code);

      if (result.success) {
        toast({
          title: "Success! 🎉",
          description: (
            <div className="mt-2">
              <p>You've successfully redeemed {result.amount} cUSD!</p>
              {result.txHash && (
                <a
                  href={`https://alfajores.celoscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline mt-2 inline-block"
                >
                  View on CeloScan
                </a>
              )}
            </div>
          ),
        });
        setCode('');
        setRedeemState('success')
      } else {
        setErrorDetails({
          title: "Redemption Failed",
          description: result.error || "Failed to redeem gift card",
          status: result.status === 'success' ? 'error' : result.status
        });
        setRedeemState('error')
      }
    } catch (error: any) {
      console.error('Error during redemption:', error);
      setErrorDetails({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        status: 'error'
      });
      setRedeemState('error')
    }
  };

  return (
    <main className="container mx-auto px-4 py-6 sm:py-12">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-2xl"
      >
        <motion.h1 
          variants={itemVariants}
          custom={0}
          className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-center sm:text-left"
        >
          Redeem Gift Card
        </motion.h1>
        
        <AnimatePresence mode="wait">
          {errorDetails && (
            <motion.div
              variants={itemVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mb-4 sm:mb-6"
            >
              <Alert variant={errorDetails.status === 'error' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{errorDetails.title}</AlertTitle>
                <AlertDescription>{errorDetails.description}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.form
          variants={formVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleRedeem}
          className="space-y-4 sm:space-y-6"
        >
          <motion.div 
            variants={itemVariants}
            custom={2}
            className="space-y-2"
          >
            <label htmlFor="code" className="block text-sm font-medium">
              Redemption Code
            </label>
            <div className="relative">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter your redemption code"
                required
                className={cn(
                  "font-mono transition-all duration-200 text-base sm:text-lg",
                  redeemState === 'success' && "border-green-500",
                  redeemState === 'error' && "border-red-500",
                  redeemState === 'checking' && "border-yellow-500",
                  redeemState === 'redeeming' && "border-yellow-500"
                )}
                disabled={redeemState === 'redeeming' || redeemState === 'checking'}
              />
              <AnimatePresence>
                {redeemState === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </motion.div>
                )}
                {redeemState === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <XCircle className="h-5 w-5 text-red-500" />
                  </motion.div>
                )}
                {(redeemState === 'checking' || redeemState === 'redeeming') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the 16-character code from your gift card
            </p>
          </motion.div>

          <motion.div variants={itemVariants} custom={3}>
            <Button
              type="submit"
              className={cn(
                "w-full h-11 sm:h-12 text-base sm:text-lg transition-all duration-200",
                redeemState === 'success' && "bg-green-500 hover:bg-green-600",
                redeemState === 'error' && "bg-red-500 hover:bg-red-600",
                (redeemState === 'checking' || redeemState === 'redeeming') && "bg-yellow-500 hover:bg-yellow-600"
              )}
              disabled={!isConnected || redeemState === 'redeeming' || redeemState === 'checking' || redeemState === 'success'}
            >
              {!isConnected ? (
                'Connect Wallet'
              ) : redeemState === 'checking' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Checking Gift Card...
                </>
              ) : redeemState === 'redeeming' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Processing Redemption...
                </>
              ) : redeemState === 'success' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Redeemed Successfully
                </>
              ) : redeemState === 'error' ? (
                <>
                  <XCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {errorDetails?.title || 'Error'}
                </>
              ) : (
                'Redeem Gift Card'
              )}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </main>
  )
} 