import { useState, useCallback, useEffect } from 'react';
import { 
  useAccount, 
  useConnect, 
  useDisconnect,
  useContractRead,
  useTransaction,
  useBalance,
  usePublicClient,
  useWalletClient,
  type Config,
  type UseReadContractParameters,
  type UseReadContractReturnType
} from 'wagmi';
import { parseUnits, formatUnits, keccak256, toBytes } from 'viem';
import { celoAlfajores } from 'viem/chains';
import type { Abi, Address } from 'viem';
import { sendGiftCardEmail } from '@/lib/email';

import UnwrapABI from '../abis/unWrap.json';
import CUSDABI from '../abis/cusd-abi.json';

// Extract the actual ABI array from CUSDABI since it's nested
const CUSD_ABI = CUSDABI.abi;

const UNWRAP_CONTRACT_ADDRESS = "0x349a3172D4D8e3fFdd96De7736F622442FF14A24"; // Your deployed contract address
const CUSD_CONTRACT_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD on Alfajores testnet

interface UnwrapHookReturn {
  // Connection states
  connected: boolean;
  connecting: boolean;
  account: string | undefined;
  chainId: number | undefined;
  
  // Contract interaction functions
  createGiftCard: (amount: string, recipientEmail: string, message?: string, template?: 'default' | 'birthday' | 'holiday') => Promise<{ 
    success: boolean; 
    code?: string; 
    txHash?: string; 
    error?: string 
  }>;
  redeemGiftCard: (code: string) => Promise<{ 
    success: boolean; 
    amount?: string; 
    txHash?: string; 
    error?: string;
    status: 'success' | 'invalid' | 'insufficient_funds' | 'rejected' | 'error';
  }>;
  checkGiftCard: (code: string) => Promise<{ 
    valid: boolean; 
    amount: string 
  }>;
  
  // Utility functions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getCusdBalance: () => Promise<string>;
  calculateFee: (amount: string) => Promise<string>;
  
  // Transaction states
  isCreating: boolean;
  isRedeeming: boolean;
  isChecking: boolean;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // Wait for transactions
  isWaitingForCreate: boolean;
  isWaitingForRedeem: boolean;
  createSuccess: boolean;
  redeemSuccess: boolean;
  
  // Add new approval function
  approveCUSD: (amount: string) => Promise<{ 
    success: boolean; 
    txHash?: string; 
    error?: string 
  }>;
  
  // Add approval state
  isApproving: boolean;
  
  // Add checkAllowance function
  checkAllowance: (amount: string) => Promise<boolean>;
}

export function useUnwrap(): UnwrapHookReturn {
  // Wagmi hooks for account and connection
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, status } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  
  // Transaction states
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);
  
  // Get cUSD balance
  const { data: balanceData } = useBalance({
    address,
    token: CUSD_CONTRACT_ADDRESS as Address,
  });
  
  // Get wallet client
  const { data: walletClient } = useWalletClient();
  
  // State for transaction tracking
  const [createTxHash, setCreateTxHash] = useState<`0x${string}` | undefined>();
  const [redeemTxHash, setRedeemTxHash] = useState<`0x${string}` | undefined>();
  
  // Add approval state
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  
  // Connect wallet function
  const connectWallet = useCallback(async () => {
    try {
      clearError();
      if (connectors[0]) {
        await connect({ connector: connectors[0] });
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet. Please try again.");
    }
  }, [connect, connectors]);
  
  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);
  
  // Generate a secure random code
  const generateSecureCode = useCallback(() => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 16;
    let code = '';
    
    // Create array of random values
    const randomValues = new Uint8Array(codeLength);
    window.crypto.getRandomValues(randomValues);
    
    // Convert to characters
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(randomValues[i] % characters.length);
    }
    
    // Format as XXXX-XXXX-XXXX-XXXX
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
  }, []);
  
  // Hash a code for storage
  const hashCode = useCallback((code: string) => {
    return keccak256(toBytes(code));
  }, []);
  
  // Get cUSD balance
  const getCusdBalance = useCallback(async () => {
    if (!balanceData) return "0";
    return balanceData.formatted;
  }, [balanceData]);
  
  // Calculate fee
  const calculateFee = useCallback(async (amount: string) => {
    if (!publicClient || !isConnected) return "0";
    
    try {
      const amountWei = parseUnits(amount, 18);
      
      try {
        const feeWei = await publicClient.readContract({
          address: UNWRAP_CONTRACT_ADDRESS as Address,
          abi: UnwrapABI as unknown as Abi,
          functionName: 'calculateFee',
          args: [amountWei]
        });
        
        return formatUnits(feeWei as bigint, 18);
      } catch (contractError) {
        console.warn('Contract fee calculation failed, using default fee:', contractError);
        // Use a default fee of 0.5% if contract call fails
        const defaultFeePercentage = 0.005; // 0.5%
        const feeWei = (amountWei * BigInt(Math.floor(defaultFeePercentage * 10000))) / BigInt(10000);
        return formatUnits(feeWei, 18);
      }
    } catch (err) {
      console.error("Error calculating fee:", err);
      return "0";
    }
  }, [publicClient, isConnected]);
  
  // Check allowance
  const checkAllowance = useCallback(async (amountToCheck: string) => {
    if (!publicClient || !address || !isConnected) return false;
    
    try {
      // Calculate total amount needed (including fee)
      const amountWei = parseUnits(amountToCheck, 18);
      const feeWei = await publicClient.readContract({
        address: UNWRAP_CONTRACT_ADDRESS as Address,
        abi: UnwrapABI as unknown as Abi,
        functionName: 'calculateFee',
        args: [amountWei]
      });
      
      const totalWei = (amountWei as bigint) + (feeWei as bigint);
      
      const allowance = await publicClient.readContract({
        address: CUSD_CONTRACT_ADDRESS as Address,
        abi: CUSD_ABI as unknown as Abi,
        functionName: 'allowance',
        args: [address, UNWRAP_CONTRACT_ADDRESS]
      });
      
      return (allowance as bigint) >= totalWei;
    } catch (err) {
      console.error("Error checking allowance:", err);
      return false;
    }
  }, [publicClient, address, isConnected]);
  
  // Remove contract write hooks since we'll use walletClient directly
  
  const approveContract = useCallback(async (spender: Address, amount: bigint) => {
    if (!walletClient) throw new Error("Wallet client not found");
    return walletClient.writeContract({
      abi: CUSD_ABI as unknown as Abi,
      functionName: 'approve',
      address: CUSD_CONTRACT_ADDRESS as Address,
      args: [spender, amount]
    });
  }, [walletClient]);

  const createGiftCardContract = useCallback(async (codeHash: string, amount: bigint) => {
    if (!walletClient) throw new Error("Wallet client not found");
    return walletClient.writeContract({
      abi: UnwrapABI as unknown as Abi,
      functionName: 'createGiftCard',
      address: UNWRAP_CONTRACT_ADDRESS as Address,
      args: [codeHash, amount]
    });
  }, [walletClient]);

  const redeemGiftCardContract = useCallback(async (code: string) => {
    if (!walletClient) throw new Error("Wallet client not found");
    const codeHash = hashCode(code);
    return walletClient.writeContract({
      abi: UnwrapABI as unknown as Abi,
      functionName: 'redeemGiftCard',
      address: UNWRAP_CONTRACT_ADDRESS as Address,
      args: [codeHash]
    });
  }, [walletClient, hashCode]);
  
  // Wait for transactions
  const { isLoading: isWaitingForCreate, isSuccess: createSuccess } = useTransaction({
    hash: createTxHash,
  });
  
  const { isLoading: isWaitingForRedeem, isSuccess: redeemSuccess } = useTransaction({
    hash: redeemTxHash,
  });
  
  // Add approval transaction tracking
  const { isLoading: isWaitingForApprove, isSuccess: approveSuccess } = useTransaction({
    hash: approveTxHash,
  });

  // Create gift card
  const createGiftCard = useCallback(async (amount: string, recipientEmail: string, message?: string, template?: 'default' | 'birthday' | 'holiday') => {
    if (!address || !isConnected || !walletClient) {
      setError("Please connect your wallet first");
      return { success: false, error: "Wallet not connected" };
    }

    setIsCreating(true);
    clearError();

    try {
      console.log('Starting gift card creation process...');
      console.log('Generating redemption code...');
      
      // Generate redemption code
      const redemptionCode = generateSecureCode();
      const codeHash = hashCode(redemptionCode);
      console.log('Generated code hash:', codeHash);

      // Calculate fee
      console.log('Calculating fee for amount:', amount);
      const fee = await calculateFee(amount);
      const totalAmount = parseUnits(amount, 18) + parseUnits(fee, 18);
      console.log('Total amount (including fee):', formatUnits(totalAmount, 18), 'cUSD');

      // Check allowance and balance
      console.log('Checking allowance...');
      const allowance = await checkAllowance(amount);
      if (!allowance) {
        console.log('Insufficient allowance');
        setError("Please approve the contract to spend your cUSD");
        return { success: false, error: "Insufficient allowance" };
      }
      console.log('Allowance check passed');

      console.log('Checking balance...');
      const balance = await getCusdBalance();
      if (parseFloat(balance) < parseFloat(amount) + parseFloat(fee)) {
        console.log('Insufficient balance');
        setError("Insufficient cUSD balance");
        return { success: false, error: "Insufficient balance" };
      }
      console.log('Balance check passed');

      // Create gift card in contract
      console.log('Creating gift card on blockchain...');
      const txHash = await createGiftCardContract(codeHash, parseUnits(amount, 18));
      console.log('Transaction sent:', txHash);
      setCreateTxHash(txHash);

      // Wait for transaction and verify it was successful
      console.log('Waiting for transaction confirmation...');
      const receipt = await publicClient?.waitForTransactionReceipt({ 
        hash: txHash 
      });
      console.log('Transaction confirmed:', receipt?.transactionHash);

      if (!receipt || receipt.status === 'reverted') {
        throw new Error('Transaction failed or was reverted');
      }

      // Add a small delay to allow blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the gift card was created on the blockchain with retries
      let isValid = false;
      let giftAmount: bigint | undefined;
      let retries = 3;

      while (retries > 0 && !isValid) {
        console.log(`Verifying gift card on blockchain (attempt ${4 - retries}/3)...`);
        const result = await publicClient?.readContract({
          address: UNWRAP_CONTRACT_ADDRESS as Address,
          abi: UnwrapABI as unknown as Abi,
          functionName: 'checkGiftCard',
          args: [codeHash],
        });

        if (!result) {
          throw new Error('Failed to verify gift card on blockchain');
        }

        [isValid, giftAmount] = result as [boolean, bigint];

        if (!isValid) {
          retries--;
          if (retries > 0) {
            console.log('Gift card not found yet, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!isValid) {
        throw new Error('Gift card was not created on the blockchain after multiple attempts');
      }

      // Verify the amount matches
      if (giftAmount !== parseUnits(amount, 18)) {
        throw new Error('Gift card amount mismatch on blockchain');
      }

      // Only create database entry after confirming blockchain creation
      console.log('Creating gift card in database...');
      const response = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redemptionCode,
          codeHash,
          amount,
          sender: address,
          creator: address,
          recipientEmail,
          message,
          template,
          status: 'pending',
          transactionHash: receipt.transactionHash,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Database creation failed:', error);
        throw new Error(error.error || 'Failed to create gift card in database');
      }
      console.log('Gift card created in database');

      // Send email
      console.log('Sending gift card email...');
      await sendGiftCardEmail({
        to: recipientEmail,
        redemptionCode,
        amount,
        sender: address,
        message,
        template,
      });
      console.log('Email sent successfully');

      return { 
        success: true, 
        code: redemptionCode,
        txHash: receipt.transactionHash 
      };
    } catch (err: any) {
      console.error("Error in gift card creation process:", err);
      let errorMessage = "Failed to create gift card";
      
      if (err.message?.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (err.message?.includes("database")) {
        errorMessage = "Failed to save gift card in database";
      } else if (err.message?.includes("blockchain")) {
        errorMessage = "Failed to create gift card on blockchain";
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  }, [address, isConnected, walletClient, publicClient, generateSecureCode, hashCode, calculateFee, checkAllowance, getCusdBalance, createGiftCardContract]);
  
  // Check gift card
  const checkGiftCard = useCallback(async (code: string) => {
    setIsChecking(true);
    clearError();

    try {
      const response = await fetch(`/api/gift-cards?code=${code}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check gift card');
      }

      const giftCard = await response.json();
      
      // Check blockchain status
      const result = await publicClient?.readContract({
        address: UNWRAP_CONTRACT_ADDRESS as Address,
        abi: UnwrapABI as unknown as Abi,
        functionName: 'checkGiftCard',
        args: [giftCard.codeHash],
      }) as [boolean, bigint];

      const [valid, amount] = result;

      return {
        valid,
        amount: formatUnits(amount, 18),
      };
    } catch (err: any) {
      console.error("Error checking gift card:", err);
      setError(err.message || "Failed to check gift card");
      return { valid: false, amount: "0" };
    } finally {
      setIsChecking(false);
    }
  }, [publicClient]);
  
  // Redeem gift card
  const redeemGiftCard = useCallback(async (code: string) => {
    if (!isConnected || !address || !publicClient) {
      return { 
        success: false, 
        error: "Wallet not connected",
        status: 'error' as const
      };
    }
    
    setIsRedeeming(true);
    clearError();
    
    try {
      console.log('Starting gift card redemption process...');
      console.log('Checking gift card validity...');
      
      // First check if the gift card exists in MongoDB
      const checkResponse = await fetch('/api/gift-card/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const checkResult = await checkResponse.json();
      console.log('Database check result:', checkResult);

      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
          console.log('Gift card not found in database');
          return { 
            success: false, 
            error: "This gift card code does not exist",
            status: 'invalid' as const
          };
        }
        throw new Error(checkResult.error || 'Failed to check gift card');
      }

      if (checkResult.status === 'redeemed') {
        console.log('Gift card already redeemed');
        return { 
          success: false, 
          error: "This gift card has already been redeemed",
          status: 'invalid' as const
        };
      }

      // Check blockchain status
      console.log('Checking blockchain status...');
      const { valid, amount } = await checkGiftCard(code);
      
      if (!valid) {
        console.log('Gift card invalid on blockchain');
        return { 
          success: false, 
          error: "Invalid or already redeemed gift card",
          status: 'invalid' as const
        };
      }

      console.log('Gift card is valid, amount:', amount);
      console.log('Initiating redemption transaction...');
      
      // Redeem gift card
      const txHash = await redeemGiftCardContract(code);
      console.log('Redemption transaction sent:', txHash);
      setRedeemTxHash(txHash);
      
      // Wait for transaction
      console.log('Waiting for transaction confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: txHash 
      });
      console.log('Transaction confirmed:', receipt.transactionHash);

      // Update database
      console.log('Updating gift card status in database...');
      const updateResponse = await fetch('/api/gift-cards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redeemer: address,
          redemptionTransactionHash: receipt.transactionHash
        }),
      });

      if (!updateResponse.ok) {
        console.error('Failed to update database:', await updateResponse.json());
        // Don't fail the whole process if database update fails
        console.warn('Database update failed, but blockchain transaction was successful');
      }
      
      return { 
        success: true, 
        amount,
        txHash: receipt.transactionHash,
        status: 'success' as const
      };
    } catch (err: any) {
      console.error("Error in gift card redemption process:", err);
      let errorMessage = "Failed to redeem gift card";
      let status: 'error' | 'invalid' | 'insufficient_funds' | 'rejected' = 'error';
      
      if (err.message?.includes("execution reverted")) {
        if (err.message?.includes("Gift card does not exist")) {
          errorMessage = "This gift card code does not exist";
          status = 'invalid';
        } else if (err.message?.includes("already redeemed")) {
          errorMessage = "This gift card has already been redeemed";
          status = 'invalid';
        } else {
          errorMessage = "Invalid or already redeemed gift card";
          status = 'invalid';
        }
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
        status = 'insufficient_funds';
      } else if (err.message?.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
        status = 'rejected';
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        status
      };
    } finally {
      setIsRedeeming(false);
    }
  }, [isConnected, address, publicClient, redeemGiftCardContract, checkGiftCard]);
  
  // Add approveCUSD function
  const approveCUSD = useCallback(async (amount: string) => {
    if (!address || !isConnected || !walletClient) {
      setError("Please connect your wallet first");
      return { success: false, error: "Wallet not connected" };
    }

    setIsApproving(true);
    clearError();

    try {
      // Calculate total amount needed (including fee)
      const fee = await calculateFee(amount);
      const totalAmount = parseUnits(amount, 18) + parseUnits(fee, 18);

      // Approve the contract to spend cUSD
      const txHash = await approveContract(UNWRAP_CONTRACT_ADDRESS as Address, totalAmount);
      setApproveTxHash(txHash);

      // Wait for transaction
      const receipt = await publicClient?.waitForTransactionReceipt({ 
        hash: txHash 
      });

      return { 
        success: true, 
        txHash: receipt?.transactionHash 
      };
    } catch (err: any) {
      console.error("Error approving cUSD:", err);
      let errorMessage = "Failed to approve cUSD";
      
      if (err.message?.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsApproving(false);
    }
  }, [address, isConnected, walletClient, publicClient, calculateFee, approveContract]);
  
  return {
    // Connection states
    connected: isConnected,
    connecting: status === 'pending',
    account: address,
    chainId,
    
    // Contract interaction functions
    createGiftCard,
    redeemGiftCard,
    checkGiftCard,
    
    // Utility functions
    connectWallet,
    disconnectWallet,
    getCusdBalance,
    calculateFee,
    
    // Transaction states
    isCreating: isCreating || isWaitingForCreate,
    isRedeeming: isRedeeming || isWaitingForRedeem,
    isChecking,
    
    // Error handling
    error,
    clearError,
    
    // Wait for transactions
    isWaitingForCreate,
    isWaitingForRedeem,
    createSuccess,
    redeemSuccess,
    
    // Add new approval function and state
    approveCUSD,
    isApproving: isApproving || (isWaitingForApprove && approveTxHash !== undefined),
    
    // Add checkAllowance to return value
    checkAllowance,
  };
}