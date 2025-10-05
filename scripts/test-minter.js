#!/usr/bin/env node

/**
 * Test Minter Setup Script
 * 
 * This script helps verify that your minter wallet is properly configured
 * and has the necessary permissions to mint tokens.
 * 
 * Usage: node scripts/test-minter.js
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TOKEN_CONTRACT_ADDRESS = '0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5';

// Minimal ABI for testing
const TOKEN_ABI = [
  {
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' }
    ],
    name: 'hasRole',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// MINTER_ROLE hash
const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

async function testMinterSetup() {
  console.log('🔍 Testing Minter Setup...\n');

  // Use hardcoded private key (same as in API route)
  const privateKey = '0xf2f288cc03e2b9bb216e65cc00ea31f5b88e1f8c32d435d14ebc7ba893071cc3';
  const expectedAddress = '0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5';

  console.log('✅ Using configured minter credentials');

  try {
    // Create account from private key
    const account = privateKeyToAccount(privateKey);
    console.log(`✅ Minter Address: ${account.address}`);
    
    // Verify address matches
    if (account.address.toLowerCase() !== expectedAddress.toLowerCase()) {
      console.error('❌ Address mismatch!');
      console.log(`   Expected: ${expectedAddress}`);
      console.log(`   Got: ${account.address}`);
      process.exit(1);
    }
    console.log('✅ Address verification passed\n');

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    // Test 1: Check contract exists
    console.log('📋 Test 1: Checking if token contract exists...');
    const tokenName = await publicClient.readContract({
      address: TOKEN_CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'name',
    });
    const tokenSymbol = await publicClient.readContract({
      address: TOKEN_CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'symbol',
    });
    console.log(`✅ Contract found: ${tokenName} (${tokenSymbol})\n`);

    // Test 2: Check if account has MINTER_ROLE
    console.log('📋 Test 2: Checking MINTER_ROLE permissions...');
    const hasMinterRole = await publicClient.readContract({
      address: TOKEN_CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'hasRole',
      args: [MINTER_ROLE, account.address],
    });

    if (hasMinterRole) {
      console.log('✅ Minter wallet has MINTER_ROLE\n');
    } else {
      console.log('❌ Minter wallet does NOT have MINTER_ROLE\n');
      console.log('💡 To grant MINTER_ROLE, the contract owner must call:');
      console.log(`   grantRole(MINTER_ROLE, "${account.address}")\n`);
      console.log(`   MINTER_ROLE = ${MINTER_ROLE}`);
      process.exit(1);
    }

    // Test 3: Check balance (for gas)
    console.log('📋 Test 3: Checking ETH balance for gas...');
    const balance = await publicClient.getBalance({
      address: account.address,
    });
    const balanceInEth = Number(balance) / 1e18;
    console.log(`   Balance: ${balanceInEth.toFixed(6)} ETH`);

    if (balanceInEth < 0.001) {
      console.log('⚠️  Low balance! You may need more ETH for gas fees');
      console.log('   Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia\n');
    } else {
      console.log('✅ Sufficient balance for gas fees\n');
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ All tests passed!');
    console.log('═══════════════════════════════════════');
    console.log('Your minter is ready to mint tokens! 🎉\n');
    console.log('Contract Address:', TOKEN_CONTRACT_ADDRESS);
    console.log('Network: Base Sepolia');
    console.log('Minter Address:', account.address);
    console.log('\nYou can now start your app and mint tokens from the game!');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify the contract address is correct');
    console.log('   2. Ensure you have an internet connection');
    console.log('   3. Check Base Sepolia network status');
    console.log('   4. Verify minter has MINTER_ROLE on the contract');
    console.log('   5. Check minter balance: https://sepolia.basescan.org/address/0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5');
    process.exit(1);
  }
}

// Run the test
testMinterSetup().catch(console.error);
