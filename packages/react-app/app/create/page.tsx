'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useUnwrap } from '@/hooks/unWrap'
import { isValidEmail } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, AlertCircle as AlertCircleIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const templates = [
  { id: 'default', name: 'Default', description: 'A simple gift card for any occasion' },
  { id: 'birthday', name: 'Birthday', description: 'Perfect for birthday celebrations' },
  { id: 'holiday', name: 'Holiday', description: 'Great for holiday gifts and celebrations' },
] as const;

export default function CreateGiftCard() {
  const { isConnected } = useAccount()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [fee, setFee] = useState('0')
  const [template, setTemplate] = useState<typeof templates[number]['id']>('default')
  const [needsApproval, setNeedsApproval] = useState(false)
  const [creationStatus, setCreationStatus] = useState<'idle' | 'approving' | 'creating' | 'success' | 'error'>('idle')

  const {
    createGiftCard,
    isCreating,
    error,
    calculateFee,
    getCusdBalance,
    connected,
    connectWallet,
    approveCUSD,
    isApproving,
    checkAllowance,
    createSuccess,
    isWaitingForCreate,
  } = useUnwrap()

  // Reset status when component mounts or amount changes
  useEffect(() => {
    setCreationStatus('idle')
    setNeedsApproval(false)
  }, [amount])

  // Reset status when form changes
  useEffect(() => {
    if (creationStatus === 'success' || creationStatus === 'error') {
      setCreationStatus('idle')
    }
  }, [amount, email, message, template, creationStatus])

  // Update status based on transaction states
  useEffect(() => {
    if (isApproving && needsApproval) {
      setCreationStatus('approving')
    } else if (isCreating || isWaitingForCreate) {
      setCreationStatus('creating')
    } else if (createSuccess) {
      setCreationStatus('success')
    } else if (error) {
      setCreationStatus('error')
    } else if (!isApproving && !isCreating && !isWaitingForCreate && !createSuccess && !error) {
      setCreationStatus('idle')
    }
  }, [isApproving, isCreating, isWaitingForCreate, createSuccess, error, needsApproval])

  // Check allowance when amount changes
  useEffect(() => {
    const checkApproval = async () => {
      if (amount && connected) {
        const hasAllowance = await checkAllowance(amount)
        setNeedsApproval(!hasAllowance)
      } else {
        setNeedsApproval(false)
      }
    }
    checkApproval()
  }, [amount, connected, checkAllowance])

  // Update fee whenever amount changes
  useEffect(() => {
    const updateFee = async () => {
      if (amount) {
        const calculatedFee = await calculateFee(amount)
        setFee(calculatedFee)
      } else {
        setFee('0')
      }
    }
    updateFee()
  }, [amount, calculateFee])

  const handleApprove = async () => {
    if (!amount) {
      toast({
        title: 'Enter amount first',
        description: 'Please enter the gift card amount before approving',
        variant: 'destructive',
      })
      return
    }

    setCreationStatus('approving')
    try {
      const result = await approveCUSD(amount)
      
      if (result.success) {
        toast({
          title: 'Approval successful!',
          description: 'You can now create your gift card',
        })
        setNeedsApproval(false)
      } else {
        toast({
          title: 'Approval failed',
          description: result.error || 'Please try again',
          variant: 'destructive',
        })
        setCreationStatus('error')
      }
    } catch (error) {
      console.error('Error approving cUSD:', error)
      toast({
        title: 'Error approving cUSD',
        description: 'Please try again later',
        variant: 'destructive',
      })
      setCreationStatus('error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!connected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to create a gift card',
        variant: 'destructive',
      })
      return
    }

    if (needsApproval) {
      toast({
        title: 'Approval needed',
        description: 'Please approve the contract to spend your cUSD first',
        variant: 'destructive',
      })
      return
    }

    if (!amount || !email) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!isValidEmail(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    setCreationStatus('creating')
    try {
      const result = await createGiftCard(amount, email, message, template)
      
      if (result.success) {
        toast({
          title: 'Gift card created! 🎉',
          description: (
            <div className="mt-2">
              <p>Gift card created successfully with code: <strong>{result.code}</strong></p>
              <p className="mt-2">The recipient will receive an email with redemption instructions.</p>
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
        })
        // Reset form
        setAmount('')
        setEmail('')
        setMessage('')
        setTemplate('default')
        setNeedsApproval(false)
        setCreationStatus('success')
      } else {
        toast({
          title: 'Error creating gift card',
          description: result.error || 'Please try again later',
          variant: 'destructive',
        })
        setCreationStatus('error')
      }
    } catch (error) {
      console.error('Error creating gift card:', error)
      toast({
        title: 'Error creating gift card',
        description: 'Please try again later',
        variant: 'destructive',
      })
      setCreationStatus('error')
    }
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Create Gift Card</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium">
              Gift Amount (cUSD)
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in cUSD"
              required
            />
            {amount && (
              <p className="text-sm text-muted-foreground">
                Fee: {fee} cUSD (0.5%)
                <br />
                Total: {(parseFloat(amount) + parseFloat(fee)).toFixed(2)} cUSD
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Recipient's Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter recipient's email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Gift Card Template</Label>
            <Select value={template} onValueChange={(value: typeof template) => setTemplate(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-sm text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">
              Personal Message (Optional)
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your gift card"
              rows={4}
            />
          </div>

          {needsApproval ? (
            <Button
              type="button"
              className={cn(
                "w-full",
                creationStatus === 'approving' && "bg-yellow-500 hover:bg-yellow-600",
                creationStatus === 'error' && "bg-red-500 hover:bg-red-600"
              )}
              onClick={handleApprove}
              disabled={creationStatus === 'approving'}
            >
              {creationStatus === 'approving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve cUSD'
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              className={cn(
                "w-full",
                creationStatus === 'creating' && "bg-yellow-500 hover:bg-yellow-600",
                creationStatus === 'success' && "bg-green-500 hover:bg-green-600",
                creationStatus === 'error' && "bg-red-500 hover:bg-red-600"
              )}
              disabled={!connected || creationStatus === 'creating' || creationStatus === 'approving'}
              onClick={!connected ? connectWallet : undefined}
            >
              {!connected ? (
                'Connect Wallet'
              ) : creationStatus === 'creating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Gift Card...
                </>
              ) : creationStatus === 'success' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Gift Card Created!
                </>
              ) : creationStatus === 'error' ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Error
                </>
              ) : (
                'Create Gift Card'
              )}
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {creationStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your gift card has been created successfully. The recipient will receive an email with redemption instructions.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </div>
    </main>
  )
} 