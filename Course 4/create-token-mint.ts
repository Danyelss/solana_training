import "dotenv/config";
import {
    Connection,
    clusterApiUrl,
} from '@solana/web3.js';
import { createMint } from "@solana/spl-token";
import { getExplorerLink, getKeypairFromEnvironment } from "@solana-developers/helpers";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const user = getKeypairFromEnvironment("SECRET_KEY");

console.log("User's publick key:", user.publicKey.toBase58());

const tokenMint = await createMint(
    connection,
    user,
    user.publicKey,
    null,
    2
);

const link = getExplorerLink("address", tokenMint.toString(), "devnet");

console.log('Token mint link:', link);



