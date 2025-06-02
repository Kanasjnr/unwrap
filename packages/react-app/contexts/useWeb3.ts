import { useState } from "react";
import StableTokenABI from "../abis/cusd-abi.json";
import UnWrapABI from "../abis/unWrap.json";
import {
    createPublicClient,
    createWalletClient,
    custom,
    getContract,
    http,
    parseEther,
    stringToHex,
    keccak256,
    type Abi,
} from "viem";
import { celoAlfajores } from "viem/chains";

// Define a type for the ABI
type ContractABI = readonly {
    inputs: readonly { internalType: string; name: string; type: string }[];
    stateMutability: string;
    type: string;
    name?: string;
    outputs?: readonly { internalType: string; name: string; type: string }[];
    anonymous?: boolean;
}[];

const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Testnet
const UNWRAP_CONTRACT = "0x349a3172D4D8e3fFdd96De7736F622442FF14A24"; 

export const useWeb3 = () => {
    const [address, setAddress] = useState<string | null>(null);

    const getUserAddress = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            let walletClient = createWalletClient({
                transport: custom(window.ethereum),
                chain: celoAlfajores,
            });

            let [address] = await walletClient.getAddresses();
            setAddress(address);
        }
    };

    const sendCUSD = async (to: string, amount: string) => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });

        let [address] = await walletClient.getAddresses();
        const amountInWei = parseEther(amount);

        const tx = await walletClient.writeContract({
            address: cUSDTokenAddress,
            abi: StableTokenABI.abi,
            functionName: "transfer",
            account: address,
            args: [to, amountInWei],
        });

        let receipt = await publicClient.waitForTransactionReceipt({
            hash: tx,
        });

        return receipt;
    };

    const createGiftCard = async (code: string, amount: string) => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });

        let [address] = await walletClient.getAddresses();
        const amountInWei = parseEther(amount);
        const codeHash = keccak256(stringToHex(code));

        // First approve the contract to spend cUSD
        const approveTx = await walletClient.writeContract({
            address: cUSDTokenAddress,
            abi: StableTokenABI.abi,
            functionName: "approve",
            account: address,
            args: [UNWRAP_CONTRACT, amountInWei],
        });

        await publicClient.waitForTransactionReceipt({
            hash: approveTx,
        });

        // Then create the gift card
        const tx = await walletClient.writeContract({
            address: UNWRAP_CONTRACT,
            abi: UnWrapABI as ContractABI,
            functionName: "createGiftCard",
            account: address,
            args: [codeHash, amountInWei],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: tx,
        });

        return receipt;
    };

    const redeemGiftCard = async (code: string) => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: celoAlfajores,
        });

        let [address] = await walletClient.getAddresses();
        const codeHash = keccak256(stringToHex(code));

        const tx = await walletClient.writeContract({
            address: UNWRAP_CONTRACT,
            abi: UnWrapABI as ContractABI,
            functionName: "redeemGiftCard",
            account: address,
            args: [codeHash],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: tx,
        });

        return receipt;
    };

    const checkGiftCard = async (code: string) => {
        const codeHash = keccak256(stringToHex(code));
        
        const unWrapContract = getContract({
            abi: UnWrapABI as ContractABI,
            address: UNWRAP_CONTRACT,
            client: publicClient,
        });

        const result = await unWrapContract.read.checkGiftCard([codeHash]) as [boolean, bigint];
        const [valid, amount] = result;
        return { valid, amount };
    };

    const getFeePercentage = async () => {
        const unWrapContract = getContract({
            abi: UnWrapABI as ContractABI,
            address: UNWRAP_CONTRACT,
            client: publicClient,
        });

        return await unWrapContract.read.feePercentage();
    };

    const calculateFee = async (amount: string) => {
        const unWrapContract = getContract({
            abi: UnWrapABI as ContractABI,
            address: UNWRAP_CONTRACT,
            client: publicClient,
        });

        const amountInWei = parseEther(amount);
        return await unWrapContract.read.calculateFee([amountInWei]);
    };

    return {
        address,
        getUserAddress,
        sendCUSD,
        createGiftCard,
        redeemGiftCard,
        checkGiftCard,
        getFeePercentage,
        calculateFee,
    };
};
