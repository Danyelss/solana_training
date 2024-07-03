import "dotenv/config";
import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    clusterApiUrl,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import { Transaction } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

const sender = getKeypairFromEnvironment("SECRET_KEY");

console.log(sender.publicKey.toBase58());

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const receiver = new PublicKey(("AMhdHJ83EQnFRp3DXKr9NCJxZCUjjoqpHf63XnuYT81G"));
const balance = await connection.getBalance(receiver);

console.log('Balance of receiver: ', balance / LAMPORTS_PER_SOL);

const transaction = new Transaction();

const transferIntruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver,
    lamports: 0.1 * LAMPORTS_PER_SOL,
});

transaction.add(transferIntruction);

const memo = "Message.";

const memoInstruction = createMemoInstruction(memo);

transaction.add(memoInstruction);

const signature = await sendAndConfirmTransaction(connection, transaction, [sender,]);

console.log('Signature:', signature);

