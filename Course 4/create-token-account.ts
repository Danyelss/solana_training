import "dotenv/config";
import {
    Connection,
    PublicKey,
    clusterApiUrl,
} from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const user = getKeypairFromEnvironment("SECRET_KEY");

console.log("User's publick key:", user.publicKey.toBase58());

const RECIPIENT_ADDRESS = "BYYx1B1xwAoQ9F5D2k5QXBjwDzpNCmyx73AEd16sY42F";
const TOKEN_MINT_ADDRESS = "AK1dsUC39QTCqKJXmCtHx3zFsPpAJwBfZUn729nRrvDx";
const recipient = new PublicKey(RECIPIENT_ADDRESS);
const tokenMintAccount = new PublicKey(TOKEN_MINT_ADDRESS);

const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    user,
    tokenMintAccount,
    recipient
);

console.log('Token Account: ', tokenAccount.address.toBase58());
