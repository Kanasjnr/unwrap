import { ethers, run } from "hardhat";

async function main() {
  // Get the contract factory
  const Unwrap = await ethers.getContractFactory("Unwrap");

  // cUSD token addresses for different networks
  const cUSD_ADDRESSES = {
    celo: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Mainnet
    alfajores: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Testnet
  };

  // Get the network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "hardhat" : network.name;

  // Get the deployer's address to use as fee collector
  const [deployer] = await ethers.getSigners();
  const feeCollectorAddress = await deployer.getAddress();

  // Select the appropriate cUSD address based on the network
  const cUSDAddress = cUSD_ADDRESSES[networkName as keyof typeof cUSD_ADDRESSES];
  if (!cUSDAddress) {
    throw new Error(`No cUSD address configured for network: ${networkName}`);
  }

  console.log(`Deploying Unwrap contract on ${networkName}...`);
  console.log(`Using cUSD token address: ${cUSDAddress}`);
  console.log(`Using fee collector address: ${feeCollectorAddress} (deployer)`);

  // Deploy the contract
  const unwrap = await Unwrap.deploy(cUSDAddress, feeCollectorAddress);
  await unwrap.waitForDeployment();

  const address = await unwrap.getAddress();
  console.log(`Unwrap contract deployed to: ${address}`);

  // Wait for a few block confirmations before verifying
  console.log("Waiting for block confirmations...");
  await unwrap.deploymentTransaction()?.wait(5);

  // Verify the contract on Etherscan/Celoscan
  if (networkName !== "hardhat") {
    console.log("Verifying contract on block explorer...");
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [cUSDAddress, feeCollectorAddress],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 