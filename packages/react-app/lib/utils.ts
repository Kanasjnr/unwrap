import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(amount: bigint, decimals: number = 18): string {
  const formatted = Number(amount) / Math.pow(10, decimals)
  return formatted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  })
}

export function calculateFee(amount: bigint, feePercentage: number = 0.5): bigint {
  return (amount * BigInt(Math.floor(feePercentage * 100))) / BigInt(10000)
}

export function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const numSegments = 4
  const segmentLength = 4
  const codeSegments = Array.from({ length: numSegments }, () =>
    Array.from({ length: segmentLength }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  )
  return codeSegments.join('-')
}
