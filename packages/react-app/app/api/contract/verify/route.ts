import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';
import UnwrapABI from '@/abis/unWrap.json';

const UNWRAP_CONTRACT_ADDRESS = "0x349a3172D4D8e3fFdd96De7736F622442FF14A24";

// Define the type for our contract functions results
type ContractFunctions = {
  calculateFee: bigint | null;
  feePercentage: bigint | null;
  feeCollector: `0x${string}` | null;
  cUSDToken: `0x${string}` | null;
};

type VerificationResult = {
  address: string;
  isContract: boolean;
  functions: ContractFunctions;
};

export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: celoAlfajores,
      transport: http(),
    });

    // Check if the address is a contract
    const code = await publicClient.getBytecode({
      address: UNWRAP_CONTRACT_ADDRESS,
    });

    if (!code || code === '0x') {
      return NextResponse.json({
        error: 'No contract found at this address',
        address: UNWRAP_CONTRACT_ADDRESS,
      }, { status: 404 });
    }

    // Initialize results with proper typing
    const results: VerificationResult = {
      address: UNWRAP_CONTRACT_ADDRESS,
      isContract: true,
      functions: {
        calculateFee: null,
        feePercentage: null,
        feeCollector: null,
        cUSDToken: null,
      },
    };

    try {
      // Try to read feePercentage
      const feePercentage = await publicClient.readContract({
        address: UNWRAP_CONTRACT_ADDRESS,
        abi: UnwrapABI,
        functionName: 'feePercentage',
      });
      results.functions.feePercentage = feePercentage as bigint;
    } catch (e) {
      console.warn('Failed to read feePercentage:', e);
    }

    try {
      // Try to read feeCollector
      const feeCollector = await publicClient.readContract({
        address: UNWRAP_CONTRACT_ADDRESS,
        abi: UnwrapABI,
        functionName: 'feeCollector',
      });
      results.functions.feeCollector = feeCollector as `0x${string}`;
    } catch (e) {
      console.warn('Failed to read feeCollector:', e);
    }

    try {
      // Try to read cUSDToken
      const cUSDToken = await publicClient.readContract({
        address: UNWRAP_CONTRACT_ADDRESS,
        abi: UnwrapABI,
        functionName: 'cUSDToken',
      });
      results.functions.cUSDToken = cUSDToken as `0x${string}`;
    } catch (e) {
      console.warn('Failed to read cUSDToken:', e);
    }

    // Try calculateFee with a test amount
    try {
      const testAmount = BigInt(1000000000000000000); // 1 cUSD
      const calculateFee = await publicClient.readContract({
        address: UNWRAP_CONTRACT_ADDRESS,
        abi: UnwrapABI,
        functionName: 'calculateFee',
        args: [testAmount],
      });
      results.functions.calculateFee = calculateFee as bigint;
    } catch (e) {
      console.warn('Failed to read calculateFee:', e);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error verifying contract:', error);
    return NextResponse.json(
      { error: 'Failed to verify contract' },
      { status: 500 }
    );
  }
} 