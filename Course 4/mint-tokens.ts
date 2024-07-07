import "dotenv/config";
import {
    Connection,
    PublicKey,
    clusterApiUrl,
} from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";
import { getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const user = getKeypairFromEnvironment("SECRET_KEY");

console.log("User's publick key:", user.publicKey.toBase58());

const RECIPIENT_ADDRESS = "BYYx1B1xwAoQ9F5D2k5QXBjwDzpNCmyx73AEd16sY42F";
const TOKEN_MINT_ADDRESS = "AK1dsUC39QTCqKJXmCtHx3zFsPpAJwBfZUn729nRrvDx";
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);

const recipient = new PublicKey(RECIPIENT_ADDRESS);
const tokenMintAccount = new PublicKey(TOKEN_MINT_ADDRESS);

console.log("🚀 ~ recipient:", recipient.toBase58())

const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    tokenMintAccount,
    recipient
);

console.log("🚀 ~ tokenAccount:", tokenAccount.address)

const mitxSig = await mintTo(
    connection,
    user,
   tokenMintAccount,
    tokenAccount.address,
    user,
    42 * 10 * MINOR_UNITS_PER_MAJOR_UNITS
)

const link = getExplorerLink("transaction", mitxSig, "devnet");

console.log("🚀 ~ link:", link)

