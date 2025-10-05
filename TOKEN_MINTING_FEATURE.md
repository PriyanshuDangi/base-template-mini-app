# 🪙 Token Minting Feature

## Overview

Players can now mint SUR tokens as rewards for their game performance! The minting system is integrated directly into the SmashKarts game.

## How It Works

### Game Flow

```
┌─────────────────┐
│   Play Game     │
│   Get Kills     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Game Over      │
│  Show Score     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mint Button    │
│  (if score > 0) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Call       │
│  /mint-tokens   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Smart Contract │
│  Mints Tokens   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Success! 🎉    │
│  Tokens in      │
│  Wallet         │
└─────────────────┘
```

## Features

✅ **Score-Based Rewards**: 1 Kill = 1 SUR Token  
✅ **Participation Reward**: Minimum 1 token even with 0 kills  
✅ **Direct to Wallet**: Tokens minted directly to player's connected wallet  
✅ **Server-Side Security**: Private key never exposed to client  
✅ **Mobile Friendly**: Works on all devices  
✅ **Transaction Verification**: Returns transaction hash for transparency  
✅ **Error Handling**: Clear error messages and validation  

## User Interface

### Game Over Screen

When a game ends, players see:

1. **Score Summary**: Shows kills for all players
2. **Rewards Card** (if player has kills):
   - Shows how many tokens earned
   - "Mint Tokens to Wallet" button
   - Loading state while minting
   - Success confirmation
   - Error messages if something goes wrong

### States

**Before Minting:**
```
┌────────────────────────────────┐
│  🎁 Claim Your Rewards!        │
│                                │
│  You earned 5 SUR tokens       │
│  for your 5 kills!             │
│                                │
│  [ 🪙 Mint Tokens to Wallet ]  │
└────────────────────────────────┘
```

**During Minting:**
```
┌────────────────────────────────┐
│  🎁 Claim Your Rewards!        │
│                                │
│  You earned 5 SUR tokens       │
│  for your 5 kills!             │
│                                │
│  [    ⏳ Minting...        ]   │
└────────────────────────────────┘
```

**After Success:**
```
┌────────────────────────────────┐
│  🎁 Claim Your Rewards!        │
│                                │
│  You earned 5 SUR tokens       │
│  for your 5 kills!             │
│                                │
│  ✅ Tokens minted successfully!│
└────────────────────────────────┘
```

## Technical Implementation

### API Endpoint

**File**: `src/app/api/mint-tokens/route.ts`

**Method**: POST

**Request**:
```json
{
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": 5
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "amount": 5,
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Successfully minted 5 tokens!"
}
```

### Smart Contract Integration

- **Contract**: `0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5`
- **Network**: Base Sepolia
- **Function**: `mint(address to, uint256 amount)`
- **Access Control**: Requires `MINTER_ROLE`

### Frontend Integration

**File**: `src/components/SmashKarts.tsx`

**Key Functions**:
- `handleMintTokens()`: Handles the minting process
- `initGame()`: Resets mint state when starting new game

**State Management**:
- `isMinting`: Loading state during mint
- `mintSuccess`: Success confirmation
- `mintError`: Error message display

## Setup Requirements

### Environment Variables

```bash
MINTER_PRIVATE_KEY=0x...
```

### Permissions

The minter wallet must have:
1. `MINTER_ROLE` on the token contract
2. Sufficient ETH for gas fees (Base Sepolia)

### Testing

Run the test script to verify setup:

```bash
npm run test:minter
```

This will check:
- ✅ Private key is configured
- ✅ Contract exists and is accessible
- ✅ Minter has MINTER_ROLE
- ✅ Minter has sufficient ETH for gas

## Security Features

### Server-Side Minting

- Private key stored securely in environment variables
- Never exposed to client-side code
- All minting happens on the backend

### Input Validation

- Validates recipient address format
- Ensures amount is positive
- Checks wallet connection before minting

### Error Handling

- Comprehensive error messages
- Transaction failure handling
- Network error recovery

### Access Control

- Smart contract enforces MINTER_ROLE
- Only authorized wallets can mint
- Role-based permissions on-chain

## Token Economics

### Reward Structure

| Kills | Tokens Earned | Reason |
|-------|--------------|--------|
| 0     | 1 SUR | Participation reward 🎮 |
| 1     | 1 SUR | 1 kill |
| 2     | 2 SUR | 2 kills |
| 3     | 3 SUR | 3 kills |
| 5     | 5 SUR | 5 kills |
| 10    | 10 SUR | 10 kills |

**Note:** Every player gets at least 1 token for participating, even with 0 kills!

### Token Details

- **Name**: Surr
- **Symbol**: SUR
- **Decimals**: 18 (standard ERC20)
- **Supply**: Unlimited (controlled by MINTER_ROLE)
- **Network**: Base Sepolia (testnet)
- **Minimum Reward**: 1 token (participation reward)

## User Experience

### Success Path

1. Player connects wallet (Privy)
2. Player plays game and gets kills
3. Game ends, shows score
4. Player sees "Claim Your Rewards" card
5. Player clicks "Mint Tokens to Wallet"
6. Button shows loading state (⏳ Minting...)
7. Transaction completes
8. Success message appears (✅)
9. Tokens appear in player's wallet

### Error Handling

**No Wallet Connected**:
```
❌ No wallet connected
```

**Minting Failed**:
```
❌ Failed to mint tokens
[Detailed error message]
```

## Monitoring & Debugging

### Console Logs

The API logs important events:
```
Minting 5 tokens to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb...
Mint transaction sent: 0x...
```

### Transaction Verification

Players can verify their mint on Base Sepolia:
```
https://sepolia.basescan.org/tx/[TRANSACTION_HASH]
```

### Error Logs

Errors are logged with full details:
```
Minting error: [Error details]
```

## Future Enhancements

Possible improvements:
- [ ] Add cooldown period between mints
- [ ] Implement bonus multipliers for win streaks
- [ ] Add leaderboard with token rewards
- [ ] Enable token burning for in-game items
- [ ] Add NFT rewards for high scores
- [ ] Implement token staking for benefits

## Support

For issues:
1. Check console logs for errors
2. Run `npm run test:minter` to verify setup
3. Verify wallet has MINTER_ROLE
4. Check Base Sepolia network status
5. Ensure sufficient ETH for gas

## Resources

- [Setup Guide](./MINTING_SETUP.md)
- [Architecture Docs](./docs/architecture.md)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Token Contract](https://sepolia.basescan.org/address/0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5)
