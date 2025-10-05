import { NextResponse } from 'next/server';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Token contract ABI - only the mint function we need
const TOKEN_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

const TOKEN_CONTRACT_ADDRESS = '0x839386A0Be9136Ce7d3b07Ba154153F0F65805e5';

export async function POST(request: Request) {
  try {
    const { recipientAddress, amount } = await request.json();

    // Validate inputs
    if (!recipientAddress || !amount) {
      return NextResponse.json(
        { error: 'Recipient address and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Use the configured minter private key
    const minterPrivateKey = '0xf2f288cc03e2b9bb216e65cc00ea31f5b88e1f8c32d435d14ebc7ba893071cc3';
    
    // Create wallet client with minter account
    const account = privateKeyToAccount(minterPrivateKey as `0x${string}`);
    
    // Verify the account address matches expected minter
    const expectedAddress = '0x117A3E11a93B2C88713bd35bE47FaFb81E4461C5';
    if (account.address.toLowerCase() !== expectedAddress.toLowerCase()) {
      console.error('Minter address mismatch');
      return NextResponse.json(
        { error: 'Minting service configuration error' },
        { status: 500 }
      );
    }
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    // Convert amount to wei (assuming 18 decimals for ERC20)
    const amountInWei = parseEther(amount.toString());

    console.log(`Minting ${amount} tokens to ${recipientAddress}...`);
    console.log(`Minter address: ${account.address}`);

    // Call mint function on the token contract
    const hash = await walletClient.writeContract({
      address: TOKEN_CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'mint',
      args: [recipientAddress as `0x${string}`, amountInWei],
    });

    console.log(`Mint transaction sent: ${hash}`);

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      amount: amount,
      recipient: recipientAddress,
      message: `Successfully minted ${amount} tokens!`
    });

  } catch (error: unknown) {
    console.error('Minting error:', error);
    
    // Type guard for error object
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to mint tokens',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
