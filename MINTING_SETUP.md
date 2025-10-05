# Token Minting Setup Guide

This guide explains how to set up the token minting feature for SmashKarts game rewards.

## Overview

Players can mint SUR tokens based on their game performance. The number of tokens minted equals the number of kills achieved in the game, with a minimum of 1 token as a participation reward (even with 0 kills).

## Smart Contract

- **Contract Address:** `0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5`
- **Network:** Base Sepolia
- **Token Name:** Surr (SUR)
- **Contract Type:** ERC20 with AccessControl (MINTER_ROLE required)

## Minter Configuration

The minting service is pre-configured with the following credentials:

- **Minter Address:** `0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5`
- **Network:** Base Sepolia Testnet
- **Private Key:** Hardcoded in the API route (server-side only)

⚠️ **Security Note:** The private key is hardcoded in the server-side API route and is never exposed to the client. This is a testnet setup for demonstration purposes.

## Setup Steps

### 1. Grant MINTER_ROLE to the Minter Wallet

The minter wallet `0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5` must have the `MINTER_ROLE` on the token contract.

If you're the contract owner, you can grant this role by calling:

```solidity
// Using the contract owner account
grantRole(MINTER_ROLE, 0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5);
```

Where `MINTER_ROLE = keccak256("MINTER_ROLE")`

### 2. Ensure Minter Has Gas

The minter wallet needs ETH on Base Sepolia for gas fees:
- Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia
- Send to: `0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5`

### 3. Deploy Your Application

No environment variables needed! The minter credentials are already configured in the code.

**Vercel:**
1. Push your code to GitHub
2. Connect to Vercel
3. Deploy - it's ready to go!

## How It Works

### Game Flow

1. **Play Game:** Player completes a game and earns kills
2. **Game Over Screen:** Shows score and mint button (if score > 0)
3. **Mint Tokens:** Player clicks "Mint Tokens to Wallet"
4. **Backend Processing:** 
   - API endpoint `/api/mint-tokens` receives request
   - Server uses minter wallet to call `mint()` on token contract
   - Tokens are minted directly to player's wallet
5. **Success:** Player receives confirmation and can view tokens in wallet

### API Endpoint

**POST** `/api/mint-tokens`

**Request Body:**
```json
{
  "recipientAddress": "0x...",
  "amount": 5
}
```

**Response (Success):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "amount": 5,
  "recipient": "0x...",
  "message": "Successfully minted 5 tokens!"
}
```

**Response (Error):**
```json
{
  "error": "Failed to mint tokens",
  "details": "Error message"
}
```

## Token Economics

- **1 Kill = 1 SUR Token**
- Tokens are minted with 18 decimals (standard ERC20)
- No maximum supply limit (controlled by MINTER_ROLE)
- Players must have at least 1 kill to mint

## Security Features

✅ Server-side minting (private key never exposed to client)  
✅ Input validation (address and amount)  
✅ Role-based access control on contract  
✅ Error handling and logging  
✅ Transaction hash returned for verification  

## Testing

### Local Testing

1. Set up your `.env` file with a test wallet private key
2. Ensure the test wallet has MINTER_ROLE on the contract
3. Run the development server: `npm run dev`
4. Play a game and test minting

### Verify Minting

After minting, verify the transaction on Base Sepolia:

1. Copy the transaction hash from the console or UI
2. Visit: `https://sepolia.basescan.org/tx/[TRANSACTION_HASH]`
3. Check that tokens were minted to the correct address

## Troubleshooting

### "Minting service configuration error"
- This indicates the private key doesn't match the expected address
- Contact the developer if you see this error

### "Failed to mint tokens"
- Check that the minter wallet `0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5` has MINTER_ROLE
- Ensure the minter wallet has enough ETH for gas fees (check on Base Sepolia explorer)
- Verify the contract address is correct: `0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5`
- Check Base Sepolia network status

### "No wallet connected"
- Player must connect their wallet before playing
- Use Privy authentication to connect wallet

### Check Minter Balance
Visit: https://sepolia.basescan.org/address/0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5

## Contract Interface

```solidity
interface ISurrToken {
    function mint(address to, uint256 amount) external;
    function grantRole(bytes32 role, address account) external;
    function hasRole(bytes32 role, address account) external view returns (bool);
}
```

## Additional Resources

- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Token Contract](https://sepolia.basescan.org/address/0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5)
- [Viem Documentation](https://viem.sh/)
- [OpenZeppelin AccessControl](https://docs.openzeppelin.com/contracts/4.x/access-control)

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the minter wallet has sufficient permissions and gas
