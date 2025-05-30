// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Unwrap
 * @dev A digital gift card system where users can send cryptocurrency as gifts to be unwrapped by recipients
 */
contract Unwrap is ReentrancyGuard {
    // cUSD token address on Celo
    IERC20 public cUSDToken;
    
    // Fee configuration
    uint256 public feePercentage = 50; // 0.5% in basis points (10000 = 100%)
    address public feeCollector;
    
    struct GiftCard {
        uint256 amount;
        address creator;
        bool redeemed;
    }
    
    // Mapping from code hash to gift card details
    mapping(bytes32 => GiftCard) public giftCards;
    
    // Events
    event GiftCardCreated(address indexed creator, uint256 amount, bytes32 codeHash);
    event GiftCardRedeemed(address indexed redeemer, uint256 amount, bytes32 codeHash);
    event FeeUpdated(uint256 newFeePercentage);
    event FeeCollectorUpdated(address newFeeCollector);
    
    /**
     * @dev Constructor sets the cUSD token address and fee collector
     * @param _cUSDToken Address of the cUSD token contract
     * @param _feeCollector Address that will receive fees
     */
    constructor(address _cUSDToken, address _feeCollector) {
        cUSDToken = IERC20(_cUSDToken);
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Creates a new gift card by locking cUSD tokens
     * @param _codeHash Hash of the redemption code (hashed off-chain for privacy)
     * @param _amount Amount of cUSD to lock in the gift card
     */
    function createGiftCard(bytes32 _codeHash, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(giftCards[_codeHash].amount == 0, "Code already used");
        
        // Calculate fee (paid by creator in addition to gift amount)
        uint256 fee = (_amount * feePercentage) / 10000;
        
        // Transfer fee to fee collector
        if (fee > 0) {
            require(cUSDToken.transferFrom(msg.sender, feeCollector, fee), "Fee transfer failed");
        }
        
        // Transfer gift amount to contract
        require(cUSDToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        // Store gift card details (full amount for recipient)
        giftCards[_codeHash] = GiftCard({
            amount: _amount,
            creator: msg.sender,
            redeemed: false
        });
        
        emit GiftCardCreated(msg.sender, _amount, _codeHash);
    }
    
    /**
     * @dev Redeems a gift card and transfers cUSD to the redeemer
     * @param _code The plain text redemption code
     */
    function redeemGiftCard(string calldata _code) external nonReentrant {
        // Hash the provided code
        bytes32 codeHash = keccak256(abi.encodePacked(_code));
        
        // Get gift card details
        GiftCard storage giftCard = giftCards[codeHash];
        
        // Validate gift card
        require(giftCard.amount > 0, "Gift card does not exist");
        require(!giftCard.redeemed, "Gift card already redeemed");
        
        // Mark as redeemed
        giftCard.redeemed = true;
        
        // Transfer cUSD to redeemer (full gift amount)
        require(cUSDToken.transfer(msg.sender, giftCard.amount), "Token transfer failed");
        
        emit GiftCardRedeemed(msg.sender, giftCard.amount, codeHash);
    }
    
    /**
     * @dev Checks if a gift card is valid and available for redemption
     * @param _codeHash Hash of the redemption code
     * @return valid Whether the gift card is valid and available
     * @return amount The amount of cUSD in the gift card
     */
    function checkGiftCard(bytes32 _codeHash) external view returns (bool valid, uint256 amount) {
        GiftCard memory giftCard = giftCards[_codeHash];
        
        if (giftCard.amount == 0 || giftCard.redeemed) {
            return (false, 0);
        }
        
        return (true, giftCard.amount);
    }
    
    /**
     * @dev Updates the fee percentage
     * @param _newFeePercentage New fee percentage in basis points (10000 = 100%)
     */
    function updateFeePercentage(uint256 _newFeePercentage) external {
        require(msg.sender == feeCollector, "Only fee collector can update fee");
        require(_newFeePercentage <= 500, "Fee cannot exceed 5%"); // Safety cap at 5%
        
        feePercentage = _newFeePercentage;
        emit FeeUpdated(_newFeePercentage);
    }
    
    /**
     * @dev Updates the fee collector address
     * @param _newFeeCollector New address to collect fees
     */
    function updateFeeCollector(address _newFeeCollector) external {
        require(msg.sender == feeCollector, "Only current fee collector can update");
        require(_newFeeCollector != address(0), "Invalid address");
        
        feeCollector = _newFeeCollector;
        emit FeeCollectorUpdated(_newFeeCollector);
    }
    
    /**
     * @dev Calculates the fee for a given amount
     * @param _amount Amount to calculate fee for
     * @return fee The calculated fee amount
     */
    function calculateFee(uint256 _amount) external view returns (uint256 fee) {
        return (_amount * feePercentage) / 10000;
    }
}