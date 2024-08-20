import { randomBytes } from 'node:crypto';
import * as anchor from '@coral-xyz/anchor';
import { BN, type Program } from '@coral-xyz/anchor';
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  type TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, type TransactionInstruction } from '@solana/web3.js';
import { assert } from 'chai';
import type { Escrow } from '../target/types/escrow';

import { confirmTransaction, makeKeypairs } from '@solana-developers/helpers';

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

const getRandomBigNumber = (size = 8) => {
  return new BN(randomBytes(size));
};

describe('escrow', async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();

  const connection = provider.connection;

  const program = anchor.workspace.Escrow as Program<Escrow>;

  // We're going to reuse these accounts across multiple tests
  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM,
  };

  const [alice, bob, tokenMintA, tokenMintB] = makeKeypairs(4);

  before('Creates Alice and Bob accounts, 2 token mints, and associated token accounts for both tokens for both users', async () => {
    const [aliceTokenAccountA, aliceTokenAccountB, bobTokenAccountA, bobTokenAccountB] = [alice, bob].flatMap((keypair) =>
      [tokenMintA, tokenMintB].map((mint) => getAssociatedTokenAddressSync(mint.publicKey, keypair.publicKey, false, TOKEN_PROGRAM)),
    );

    // Airdrops to users, and creates two tokens mints 'A' and 'B'"
    const minimumLamports = await getMinimumBalanceForRentExemptMint(connection);

    const sendSolInstructions: Array<TransactionInstruction> = [alice, bob].map((account) =>
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: account.publicKey,
        lamports: 10 * LAMPORTS_PER_SOL,
      }),
    );

    const createMintInstructions: Array<TransactionInstruction> = [tokenMintA, tokenMintB].map((mint) =>
      SystemProgram.createAccount({
        fromPubkey: provider.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: minimumLamports,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM,
      }),
    );

    // Make tokenA and tokenB mints, mint tokens and create ATAs
    const mintTokensInstructions: Array<TransactionInstruction> = [
      {
        mint: tokenMintA.publicKey,
        authority: alice.publicKey,
        ata: aliceTokenAccountA,
      },
      {
        mint: tokenMintB.publicKey,
        authority: bob.publicKey,
        ata: bobTokenAccountB,
      },
    ].flatMap((mintDetails) => [
      createInitializeMint2Instruction(mintDetails.mint, 6, mintDetails.authority, null, TOKEN_PROGRAM),
      createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, mintDetails.ata, mintDetails.authority, mintDetails.mint, TOKEN_PROGRAM),
      createMintToInstruction(mintDetails.mint, mintDetails.ata, mintDetails.authority, 1_000_000_000, [], TOKEN_PROGRAM),
    ]);

    // Add all these instructions to our transaction
    const tx = new Transaction();
    tx.instructions = [...sendSolInstructions, ...createMintInstructions, ...mintTokensInstructions];

    await provider.sendAndConfirm(tx, [tokenMintA, tokenMintB, alice, bob]);

    // Save the accounts for later use
    accounts.maker = alice.publicKey;
    accounts.taker = bob.publicKey;
    accounts.tokenMintA = tokenMintA.publicKey;
    accounts.makerTokenAccountA = aliceTokenAccountA;
    accounts.takerTokenAccountA = bobTokenAccountA;
    accounts.tokenMintB = tokenMintB.publicKey;
    accounts.makerTokenAccountB = aliceTokenAccountB;
    accounts.takerTokenAccountB = bobTokenAccountB;
  });

  const tokenAOfferedAmount = new BN(1_000_000);
  const tokenBWantedAmount = new BN(1_000_000);


// We'll call this function from multiple tests, so let's seperate it out
const make = async () => {
  // Pick a random ID for the offer we'll make
  const offerId = getRandomBigNumber();

  // Then determine the account addresses we'll use for the offer and the vault
  const offer = PublicKey.findProgramAddressSync(
    [Buffer.from('offer'), accounts.maker.toBuffer(), offerId.toArrayLike(Buffer, 'le', 8)],
    program.programId,
  )[0];

  const vault = getAssociatedTokenAddressSync(accounts.tokenMintA, offer, true, TOKEN_PROGRAM);

  accounts.offer = offer;
  accounts.vault = vault;

  const transactionSignature = await program.methods
    .makeOffer(offerId, tokenAOfferedAmount, tokenBWantedAmount)
    .accounts({...accounts})
    .signers([alice])
    .rpc();
  console.log(transactionSignature);
  await confirmTransaction(connection, transactionSignature);

  const vaultBalanceResponse = await connection.getTokenAccountBalance(vault);
  const vaultBalance = new BN(vaultBalanceResponse.value.amount);
  assert(vaultBalance.eq(tokenAOfferedAmount));

  // Check our Offer account contains the correct data
  const offerAccount = await program.account.offer.fetch(offer);

  assert(offerAccount.maker.equals(alice.publicKey));
  assert(offerAccount.tokenMintA.equals(accounts.tokenMintA));
  assert(offerAccount.tokenMintB.equals(accounts.tokenMintB));
  assert(offerAccount.tokenBWantedAmount.eq(tokenBWantedAmount));
}

it('Puts the tokens Alice offers into the vault when Alice makes an offer', async () => {
  await make();
});

it('Transfers the tokens to Bob and completes the offer when Bob takes the offer', async () => {
  // Ensure an offer has been made first
  await make();

  const offerAccountBefore = await program.account.offer.fetch(accounts.offer);

  // Check Bob's initial balances
  const bobTokenAccountABalanceBefore = new BN((await connection.getTokenAccountBalance(accounts.takerTokenAccountA)).value.amount);
  const bobTokenAccountBBalanceBefore = new BN((await connection.getTokenAccountBalance(accounts.takerTokenAccountB)).value.amount);

  // Execute the take_offer instruction
  const transactionSignature = await program.methods
    .takeOffer(offerAccountBefore.id)
    .accounts({
      ...accounts,
      taker: bob.publicKey,
    })
    .signers([bob])
    .rpc();
  console.log(transactionSignature);
  await confirmTransaction(connection, transactionSignature);

  // Check Bob's balances after the offer is taken
  const bobTokenAccountABalanceAfter = new BN((await connection.getTokenAccountBalance(accounts.takerTokenAccountA)).value.amount);
  const bobTokenAccountBBalanceAfter = new BN((await connection.getTokenAccountBalance(accounts.takerTokenAccountB)).value.amount);

  // Check Alice's balance after the offer is taken
  const aliceTokenAccountABalanceAfter = new BN((await connection.getTokenAccountBalance(accounts.makerTokenAccountA)).value.amount);
  const aliceTokenAccountBBalanceAfter = new BN((await connection.getTokenAccountBalance(accounts.makerTokenAccountB)).value.amount);

  // The vault should now be empty
  const vaultBalanceAfter = new BN((await connection.getTokenAccountBalance(accounts.vault)).value.amount);
  assert(vaultBalanceAfter.eq(new BN(0)));

  // Bob's token A balance should increase by the offered amount
  assert(bobTokenAccountABalanceAfter.eq(bobTokenAccountABalanceBefore.add(tokenAOfferedAmount)));

  // Bob's token B balance should decrease by the wanted amount
  assert(bobTokenAccountBBalanceAfter.eq(bobTokenAccountBBalanceBefore.sub(tokenBWantedAmount)));

  // Alice's token A balance should not change
  const aliceTokenAccountABalanceBefore = new BN((await connection.getTokenAccountBalance(accounts.makerTokenAccountA)).value.amount);
  assert(aliceTokenAccountABalanceAfter.eq(aliceTokenAccountABalanceBefore));

  // Alice's token B balance should increase by the wanted amount
  assert(aliceTokenAccountBBalanceAfter.eq(aliceTokenAccountABalanceBefore.add(tokenBWantedAmount)));

  // The offer account should no longer exist or should be marked as completed
  let offerAccountAfter;
  try {
    offerAccountAfter = await program.account.offer.fetch(accounts.offer);
  } catch (error) {
    // The account no longer exists, which is expected after the offer is taken
    offerAccountAfter = null;
  }
  assert(offerAccountAfter === null);
});

})