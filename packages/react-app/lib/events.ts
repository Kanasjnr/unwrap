import { createPublicClient, http, type Address } from 'viem';
import { celoAlfajores } from 'viem/chains';
import UnwrapABI from '../abis/unWrap.json';
import connectDB from './db';
import GiftCard from '../models/GiftCard';

const UNWRAP_CONTRACT_ADDRESS = "0x349a3172D4D8e3fFdd96De7736F622442FF14A24";

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

// Event signatures
const GIFT_CARD_CREATED_EVENT = 'GiftCardCreated(address,uint256,bytes32)';
const GIFT_CARD_REDEEMED_EVENT = 'GiftCardRedeemed(address,uint256,bytes32)';

export async function syncGiftCardEvents() {
  try {
    await connectDB();

    // Get the latest block number from the database
    const lastSyncedBlock = await GiftCard.findOne({}, {}, { sort: { 'blockNumber': -1 } });
    const fromBlock = lastSyncedBlock?.blockNumber || 0;

    // Get current block number
    const currentBlock = await publicClient.getBlockNumber();

    // Fetch GiftCardCreated events
    const createdEvents = await publicClient.getLogs({
      address: UNWRAP_CONTRACT_ADDRESS as Address,
      event: {
        type: 'event',
        name: 'GiftCardCreated',
        inputs: [
          { type: 'address', name: 'creator', indexed: true },
          { type: 'uint256', name: 'amount', indexed: false },
          { type: 'bytes32', name: 'codeHash', indexed: false },
        ],
      },
      fromBlock,
      toBlock: currentBlock,
    });

    // Fetch GiftCardRedeemed events
    const redeemedEvents = await publicClient.getLogs({
      address: UNWRAP_CONTRACT_ADDRESS as Address,
      event: {
        type: 'event',
        name: 'GiftCardRedeemed',
        inputs: [
          { type: 'address', name: 'redeemer', indexed: true },
          { type: 'uint256', name: 'amount', indexed: false },
          { type: 'bytes32', name: 'codeHash', indexed: false },
        ],
      },
      fromBlock,
      toBlock: currentBlock,
    });

    // Process created events
    for (const event of createdEvents) {
      const { creator, amount, codeHash } = event.args;
      
      // Add type checking for required fields
      if (!creator || !amount || !codeHash) {
        console.warn('Skipping event with missing required fields:', event);
        continue;
      }
      
      // Check if gift card already exists in database
      const existingCard = await GiftCard.findOne({ codeHash });
      if (!existingCard) {
        await GiftCard.create({
          codeHash,
          amount: amount.toString(),
          creator: creator as string,
          status: 'pending',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      }
    }

    // Process redeemed events
    for (const event of redeemedEvents) {
      const { redeemer, codeHash } = event.args;
      
      // Add type checking for required fields
      if (!redeemer || !codeHash) {
        console.warn('Skipping event with missing required fields:', event);
        continue;
      }
      
      // Update gift card status
      await GiftCard.findOneAndUpdate(
        { codeHash },
        {
          status: 'redeemed',
          redeemedBy: redeemer as string,
          redeemedAt: new Date(),
          redemptionBlockNumber: event.blockNumber,
          redemptionTransactionHash: event.transactionHash,
        }
      );
    }

    console.log(`Synced events from block ${fromBlock} to ${currentBlock}`);
    return { success: true, syncedToBlock: currentBlock };
  } catch (error) {
    console.error('Error syncing events:', error);
    throw error;
  }
}

// Function to start event monitoring
export function startEventMonitoring() {
  // Initial sync
  syncGiftCardEvents().catch(console.error);

  // Set up polling for new events
  const POLLING_INTERVAL = 10000; // 10 seconds
  setInterval(() => {
    syncGiftCardEvents().catch(console.error);
  }, POLLING_INTERVAL);
}

// Function to get gift card details including blockchain and database data
export async function getGiftCardDetails(code: string) {
  try {
    await connectDB();

    // Get database record
    const dbRecord = await GiftCard.findOne({ redemptionCode: code });
    if (!dbRecord) {
      return null;
    }

    // Get blockchain data
    const result = await publicClient.readContract({
      address: UNWRAP_CONTRACT_ADDRESS as Address,
      abi: UnwrapABI as any,
      functionName: 'checkGiftCard',
      args: [dbRecord.codeHash],
    }) as [boolean, bigint]; // Type assertion for the return value

    const [valid, amount] = result;

    return {
      ...dbRecord.toObject(),
      valid,
      blockchainAmount: amount.toString(),
    };
  } catch (error) {
    console.error('Error getting gift card details:', error);
    throw error;
  }
} 