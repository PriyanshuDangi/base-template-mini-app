# 🚀 Setup Checklist for Token Minting

Quick checklist to get your SmashKarts game with token rewards up and running!

## ✅ Pre-Deployment Checklist

### 1. Minter Wallet Setup
- [ ] Minter address: `0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5`
- [ ] Minter has MINTER_ROLE on token contract `0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5`
- [ ] Minter has ETH for gas on Base Sepolia

**To grant MINTER_ROLE (contract owner only):**
```solidity
grantRole(keccak256("MINTER_ROLE"), 0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5);
```

**To fund minter with testnet ETH:**
- Visit: https://www.alchemy.com/faucets/base-sepolia
- Send ETH to: `0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5`

### 2. Test Minter Setup
- [ ] Run test script: `npm run test:minter`
- [ ] Verify all tests pass ✅
- [ ] Check minter balance on explorer

### 3. Contract Verification
- [ ] Token contract deployed at: `0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5`
- [ ] Network: Base Sepolia
- [ ] Token: Surr (SUR)
- [ ] Contract has mint function with MINTER_ROLE access control

### 4. Code Review
- [ ] Minter private key hardcoded in `/src/app/api/mint-tokens/route.ts`
- [ ] Address verification check in place
- [ ] Error handling implemented
- [ ] Console logging for debugging

## 🧪 Testing

### Local Testing
1. [ ] Install dependencies: `npm install`
2. [ ] Run dev server: `npm run dev`
3. [ ] Connect wallet via Privy
4. [ ] Play game and get at least 1 kill
5. [ ] Click "Mint Tokens to Wallet" button
6. [ ] Verify tokens appear in wallet

### Verify Transaction
- [ ] Copy transaction hash from console
- [ ] Check on Base Sepolia explorer: https://sepolia.basescan.org/tx/[HASH]
- [ ] Confirm tokens minted to correct address

## 🚀 Deployment

### Vercel Deployment
1. [ ] Push code to GitHub
2. [ ] Connect repository to Vercel
3. [ ] Deploy (no environment variables needed!)
4. [ ] Test on production URL

### Post-Deployment
- [ ] Test minting on production
- [ ] Monitor minter wallet balance
- [ ] Check transaction logs
- [ ] Verify error handling

## 📊 Monitoring

### Minter Wallet
- **Address:** `0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5`
- **Explorer:** https://sepolia.basescan.org/address/0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5
- **Check:** Balance, transactions, token approvals

### Token Contract
- **Address:** `0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5`
- **Explorer:** https://sepolia.basescan.org/address/0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5
- **Check:** Total supply, minting events, role assignments

## 🔧 Troubleshooting

### Common Issues

**"Failed to mint tokens"**
- [ ] Check minter has MINTER_ROLE
- [ ] Verify minter has ETH for gas
- [ ] Check Base Sepolia network status
- [ ] Review console logs for detailed error

**"Minting service configuration error"**
- [ ] Private key/address mismatch
- [ ] Contact developer

**"No wallet connected"**
- [ ] User needs to connect wallet via Privy
- [ ] Refresh page and try again

**Minter out of gas**
- [ ] Check balance: https://sepolia.basescan.org/address/0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5
- [ ] Fund with testnet ETH from faucet

## 📝 Quick Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test minter setup
npm run test:minter

# Build for production
npm run build

# Deploy to Vercel
npm run deploy:vercel
```

## 🔗 Important Links

- **Minter Address:** https://sepolia.basescan.org/address/0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5
- **Token Contract:** https://sepolia.basescan.org/address/0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5
- **Base Sepolia Faucet:** https://www.alchemy.com/faucets/base-sepolia
- **Base Sepolia Explorer:** https://sepolia.basescan.org/

## 📚 Documentation

- [MINTING_SETUP.md](./MINTING_SETUP.md) - Detailed setup guide
- [TOKEN_MINTING_FEATURE.md](./TOKEN_MINTING_FEATURE.md) - Feature documentation
- [README.md](./README.md) - General project documentation
- [docs/architecture.md](./docs/architecture.md) - Game architecture

## ✨ Success Criteria

Your setup is complete when:
- ✅ `npm run test:minter` passes all tests
- ✅ You can play the game and earn kills
- ✅ Mint button appears on game over screen
- ✅ Clicking mint button successfully mints tokens
- ✅ Tokens appear in player's wallet
- ✅ Transaction hash is visible on Base Sepolia explorer

---

**Ready to launch?** 🚀

Once all items are checked, your game is ready to reward players with tokens!
