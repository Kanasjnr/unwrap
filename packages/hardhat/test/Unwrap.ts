import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Unwrap, Unwrap__factory, MockERC20, MockERC20__factory } from "../typechain-types";
import { parseUnits, keccak256, toUtf8Bytes } from "ethers";

describe("Unwrap Contract", function () {
  let unwrap: Unwrap;
  let mockCUSD: MockERC20;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let redeemer: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;

  // Convert string amounts to BigInt
  const INITIAL_BALANCE = BigInt(parseUnits("1000", 18).toString()); // 1000 tokens
  const GIFT_AMOUNT = BigInt(parseUnits("100", 18).toString()); // 100 tokens

  beforeEach(async function () {
    // Get signers
    [owner, creator, redeemer, addr1] = await ethers.getSigners();

    // Deploy mock cUSD token
    const mockCUSDFactory = await ethers.getContractFactory("MockERC20");
    mockCUSD = await mockCUSDFactory.deploy("Celo Dollar", "cUSD");
    await mockCUSD.waitForDeployment();

    // Mint initial tokens to creator
    await mockCUSD.mint(await creator.getAddress(), INITIAL_BALANCE);

    // Deploy Unwrap contract
    const unwrapFactory = await ethers.getContractFactory("Unwrap");
    unwrap = await unwrapFactory.deploy(await mockCUSD.getAddress());
    await unwrap.waitForDeployment();

    // Approve Unwrap contract to spend creator's tokens
    await mockCUSD.connect(creator).approve(await unwrap.getAddress(), INITIAL_BALANCE);
  });

  describe("Deployment", function () {
    it("Should set the correct cUSD token address", async function () {
      expect(await unwrap.cUSDToken()).to.equal(await mockCUSD.getAddress());
    });
  });

  describe("Gift Card Creation", function () {
    const code = "GIFT123";
    const codeHash = keccak256(toUtf8Bytes(code));

    it("Should create a gift card successfully", async function () {
      await expect(unwrap.connect(creator).createGiftCard(codeHash, GIFT_AMOUNT))
        .to.emit(unwrap, "GiftCardCreated")
        .withArgs(creator.address, GIFT_AMOUNT, codeHash);

      const giftCard = await unwrap.giftCards(codeHash);
      expect(giftCard.amount).to.equal(GIFT_AMOUNT);
      expect(giftCard.creator).to.equal(creator.address);
      expect(giftCard.redeemed).to.be.false;
    });

    it("Should fail when creating gift card with zero amount", async function () {
      await expect(
        unwrap.connect(creator).createGiftCard(codeHash, 0n)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail when creating gift card with insufficient balance", async function () {
      const largeAmount = BigInt(parseUnits("2000", 18).toString()); // More than initial balance
      await expect(
        unwrap.connect(creator).createGiftCard(codeHash, largeAmount)
      ).to.be.reverted;
    });

    it("Should fail when creating gift card with same code hash", async function () {
      await unwrap.connect(creator).createGiftCard(codeHash, GIFT_AMOUNT);
      await expect(
        unwrap.connect(creator).createGiftCard(codeHash, GIFT_AMOUNT)
      ).to.be.revertedWith("Code already used");
    });
  });

  describe("Gift Card Redemption", function () {
    const code = "GIFT123";
    const codeHash = keccak256(toUtf8Bytes(code));

    beforeEach(async function () {
      // Create a gift card first
      await unwrap.connect(creator).createGiftCard(codeHash, GIFT_AMOUNT);
    });

    it("Should redeem gift card successfully", async function () {
      const initialBalance = await mockCUSD.balanceOf(redeemer.address);
      
      await expect(unwrap.connect(redeemer).redeemGiftCard(code))
        .to.emit(unwrap, "GiftCardRedeemed")
        .withArgs(redeemer.address, GIFT_AMOUNT, codeHash);

      const finalBalance = await mockCUSD.balanceOf(redeemer.address);
      expect(finalBalance - initialBalance).to.equal(GIFT_AMOUNT);

      const giftCard = await unwrap.giftCards(codeHash);
      expect(giftCard.redeemed).to.be.true;
    });

    it("Should fail when redeeming non-existent gift card", async function () {
      const invalidCode = "INVALID";
      await expect(
        unwrap.connect(redeemer).redeemGiftCard(invalidCode)
      ).to.be.revertedWith("Gift card does not exist");
    });

    it("Should fail when redeeming already redeemed gift card", async function () {
      await unwrap.connect(redeemer).redeemGiftCard(code);
      await expect(
        unwrap.connect(redeemer).redeemGiftCard(code)
      ).to.be.revertedWith("Gift card already redeemed");
    });
  });

  describe("Gift Card Checking", function () {
    const code = "GIFT123";
    const codeHash = keccak256(toUtf8Bytes(code));

    beforeEach(async function () {
      // Create a gift card first
      await unwrap.connect(creator).createGiftCard(codeHash, GIFT_AMOUNT);
    });

    it("Should return correct status for valid gift card", async function () {
      const [valid, amount] = await unwrap.checkGiftCard(codeHash);
      expect(valid).to.be.true;
      expect(amount).to.equal(GIFT_AMOUNT);
    });

    it("Should return false for non-existent gift card", async function () {
      const invalidCodeHash = keccak256(toUtf8Bytes("INVALID"));
      const [valid, amount] = await unwrap.checkGiftCard(invalidCodeHash);
      expect(valid).to.be.false;
      expect(amount).to.equal(0n);
    });

    it("Should return false for redeemed gift card", async function () {
      await unwrap.connect(redeemer).redeemGiftCard(code);
      const [valid, amount] = await unwrap.checkGiftCard(codeHash);
      expect(valid).to.be.false;
      expect(amount).to.equal(0n);
    });
  });
}); 