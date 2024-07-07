import "dotenv/config";
import {
    Connection,
    PublicKey,
    clusterApiUrl,
} from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const user = getKeypairFromEnvironment("SECRET_KEY");

console.log("User's publick key:", user.publicKey.toBase58());

const RECIPIENT_ADDRESS = "AMhdHJ83EQnFRp3DXKr9NCJxZCUjjoqpHf63XnuYT81G";
const TOKEN_MINT_ADDRESS = "AK1dsUC39QTCqKJXmCtHx3zFsPpAJwBfZUn729nRrvDx";
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);

const recipient = new PublicKey(RECIPIENT_ADDRESS);
const tokenMintAccount = new PublicKey(TOKEN_MINT_ADDRESS);

console.log("🚀 ~ recipient:", recipient)

const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    tokenMintAccount,
    user.publicKey
);

const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    tokenMintAccount,
    recipient
);

const txSig = await transfer(
    connection,
    user,
    senderTokenAccount.address,
    recipientTokenAccount.address,
    user,
    420 * 10 * MINOR_UNITS_PER_MAJOR_UNITS
)

const link = getExplorerLink("transaction", txSig, "devnet");

console.log("🚀 ~ link:", link)

