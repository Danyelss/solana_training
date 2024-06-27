import "dotenv/config";
import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    clusterApiUrl,
} from '@solana/web3.js';
import { airdropIfRequired, getKeypairFromEnvironment } from "@solana-developers/helpers";
import bs58 from 'bs58';


const connection = new Connection(clusterApiUrl('devnet'));
console.log('Connected to devnet');

const publicAddress = 'BYYx1B1xwAoQ9F5D2k5QXBjwDzpNCmyx73AEd16sY42F';
const publicKey = new PublicKey(publicAddress);

const balanceInLamport = await connection.getBalance(publicKey);
const balanceInSOL = balanceInLamport / LAMPORTS_PER_SOL;

console.log(`You got ${balanceInSOL}.`);

try {
    const signature = await connection.requestAirdrop(publicKey, 1);
    await connection.confirmTransaction(signature);
} catch (error) {
    console.log("🚀 ~ error:", error)
}

console.log('1 SOL requested.');

const balanceInLamportAfterRequest = await connection.getBalance(publicKey);
const balanceInSOLAfterRequest = balanceInLamportAfterRequest / LAMPORTS_PER_SOL;

await airdropIfRequired(connection, publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);

console.log(`You got now ${balanceInSOLAfterRequest}.`);

const keypair = getKeypairFromEnvironment("SECRET_KEY");
const newKey = bs58.encode(keypair.secretKey);

console.log("My new key is", newKey);

