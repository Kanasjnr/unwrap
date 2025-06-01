# Unwrap

<h2 align="center">Unwrap - Digital Gift Cards on Celo</h2>
<p align="center">A decentralized platform for creating and redeeming digital gift cards using cUSD on the Celo network</p>

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Use Cases](#use-cases)
- [Technical Architecture](#technical-architecture)
- [Smart Contract System](#smart-contract-system)
- [Frontend Implementation](#frontend-implementation)
- [Security](#security)
- [Getting Started](#getting-started)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

Unwrap is a decentralized gift card platform that revolutionizes the way people send and receive digital gifts using cryptocurrency. Built on the Celo network, it leverages the stability of cUSD (Celo Dollar) to provide a secure, private, and efficient way to send digital gift cards.

### Core Concepts

1. **Digital Gift Cards**: Convert cUSD into redeemable gift cards with unique codes
2. **Non-Custodial**: Users maintain full control of their funds until redemption
3. **Privacy-Focused**: Gift card codes are hashed for security
4. **Fee-Efficient**: Low 0.5% transaction fee structure
5. **Mobile-First**: Optimized for mobile wallets, especially MiniPay

## Features

### Gift Card Management
- 🎁 Create gift cards with custom amounts
- 🔑 Generate secure, unique redemption codes
- 📊 Track gift card status (created, redeemed, expired)
- 💰 Support for various cUSD amounts
- 🔄 Batch gift card creation (coming soon)

### Security & Privacy
- 🔒 End-to-end encrypted redemption codes
- 🔐 Non-custodial design
- 🛡️ Reentrancy protection
- 📝 Transparent transaction history
- 🔍 Code verification system

### User Experience
- 📱 Mobile-first interface
- 🌐 Multi-wallet support (MiniPay, MetaMask, Valora)
- ⚡ Fast transaction processing
- 📊 Real-time status updates
- 🎨 Intuitive design

### Technical Features
- ⚡ Gas-optimized smart contracts
- 🔄 Event-driven architecture
- 📱 Progressive Web App (PWA) support
- 🌐 Cross-browser compatibility
- 📊 Comprehensive analytics

## Use Cases

### Personal Gifting
- Send birthday gifts in cUSD
- Share holiday presents
- Gift money for special occasions
- Support family members
- Educational gifts

### Business Applications
- Employee rewards
- Customer loyalty programs
- Gift card distribution
- Event tickets
- Promotional campaigns

### Community Use
- Community rewards
- Event participation gifts
- Educational incentives
- Social impact initiatives
- Community support

## Technical Architecture

### Smart Contract System

#### Core Contract (`Unwrap.sol`)
```solidity
contract Unwrap is ReentrancyGuard {
    // State Variables
    IERC20 public cUSDToken;
    uint256 public feePercentage;
    address public feeCollector;
    
    // Data Structures
    struct GiftCard {
        uint256 amount;
        address creator;
        bool redeemed;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    // Mappings
    mapping(bytes32 => GiftCard) public giftCards;
}
```

#### Key Functions
1. **Gift Card Creation**
   - `createGiftCard(bytes32 _codeHash, uint256 _amount)`
   - Handles token transfers
   - Calculates and collects fees
   - Emits creation events

2. **Gift Card Redemption**
   - `redeemGiftCard(string calldata _code)`
   - Verifies code validity
   - Processes token transfer
   - Updates card status

3. **Administrative Functions**
   - `updateFeePercentage(uint256 _newFeePercentage)`
   - `updateFeeCollector(address _newFeeCollector)`
   - `calculateFee(uint256 _amount)`

### Frontend Implementation

#### Core Components
1. **Wallet Integration**
   - Web3 provider management
   - Wallet connection handling
   - Transaction signing
   - Network detection

2. **Gift Card Interface**
   - Creation form
   - Redemption interface
   - Status tracking
   - Transaction history

3. **User Dashboard**
   - Gift card management
   - Transaction history
   - Wallet balance
   - Network status

#### Technical Stack
- **Framework**: Next.js
- **State Management**: React Context + Hooks
- **Styling**: Tailwind CSS
- **Web3 Integration**: viem
- **Testing**: Jest + React Testing Library

## Security

### Smart Contract Security
1. **Access Control**
   - Role-based permissions
   - Fee collector management
   - Emergency pause functionality

2. **Transaction Safety**
   - ReentrancyGuard implementation
   - Secure token transfers
   - Fee caps and limits

3. **Code Security**
   - Secure hashing of redemption codes
   - Input validation
   - Event emission for tracking

### Frontend Security
1. **Wallet Security**
   - Secure connection handling
   - Transaction signing
   - Network validation

2. **Data Protection**
   - Local storage encryption
   - Secure code generation
   - Input sanitization

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- Git
- A Celo-compatible wallet
- cUSD tokens for gift cards
- CELO tokens for gas fees

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/kanas/unwrap.git
cd unwrap
```

2. **Install Dependencies**
```bash
yarn install
```

3. **Environment Setup**
```bash
# Frontend
cd packages/react-app
cp .env.example .env
# Add required environment variables

# Smart Contracts
cd packages/hardhat
cp .env.example .env
# Add private key and network configuration
```

4. **Start Development**
```bash
# Frontend
yarn react-app:dev

# Smart Contract Testing
yarn hardhat test
```

## Development Guide

### Smart Contract Development

1. **Contract Structure**
   - `contracts/Unwrap.sol`: Main contract
   - `contracts/mocks/`: Test mocks
   - `test/`: Test files

2. **Testing**
```bash
# Run all tests
yarn hardhat test

# Run specific test file
yarn hardhat test test/Unwrap.test.js

# Gas reporting
yarn hardhat test --gas
```

3. **Deployment**
```bash
# Testnet
yarn hardhat deploy --network alfajores

# Mainnet
yarn hardhat deploy --network celo
```

### Frontend Development

1. **Component Structure**
   - `components/`: Reusable UI components
   - `hooks/`: Custom React hooks
   - `pages/`: Next.js pages
   - `utils/`: Utility functions

2. **Development Commands**
```bash
# Start development server
yarn react-app:dev

# Build for production
yarn react-app:build

# Run tests
yarn react-app:test

# Lint code
yarn react-app:lint
```

## Deployment

### Smart Contract Deployment

1. **Preparation**
   - Fund deployment wallet
   - Verify network configuration
   - Set environment variables

2. **Deployment Process**
   - Deploy to testnet first
   - Verify contract
   - Test functionality
   - Deploy to mainnet

### Frontend Deployment

1. **Build Process**
   - Optimize assets
   - Generate static files
   - Configure environment

2. **Deployment Options**
   - Vercel (recommended)
   - IPFS
   - Traditional hosting

## Contributing

1. **Development Process**
   - Fork repository
   - Create feature branch
   - Write tests
   - Submit PR

2. **Code Standards**
   - Follow Solidity style guide
   - Write comprehensive tests
   - Document changes
   - Update README

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support:
- Open an issue in the GitHub repository
- Contact the development team
- Check the documentation
