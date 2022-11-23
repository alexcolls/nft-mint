import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { Connection, Keypair, ParsedAccountData, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

const secret = require('./keypair.json');

const QUICKNODE_RPC = 'https://warmhearted-winter-river.solana-devnet.discover.quiknode.pro/f0a750831d453a3e404bfcd2017bbe0f601242a3/';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
const DESTINATION_WALLET = '2TyAp92s7TEksnycmYY2Fk5i1j5anwFTqECyuFMVhomP'; 
const MINT_ADDRESS = 'DoJuta7joTSuuoozqQtjtnASRYiVsT435gh4srh5LLGK';
const TRANSFER_AMOUNT = 1;

async function getNumberDecimals(mintAddress: string):Promise<number> {
  const info = await SOLANA_CONNECTION.getParsedAccountInfo(new PublicKey(MINT_ADDRESS));
  const result = (info.value?.data as ParsedAccountData).parsed.info.decimals as number;
  return result;
}

async function sendToken( destination: string = DESTINATION_WALLET, token: string = MINT_ADDRESS ) {

  console.log(`Sending ${TRANSFER_AMOUNT} ${(MINT_ADDRESS)} from ${(WALLET.publicKey.toString())} to ${(DESTINATION_WALLET)}.`)
  
  //Step 1
  console.log(`1 - Getting Source Token Account`);
  let sourceAccount = await getOrCreateAssociatedTokenAccount(
      SOLANA_CONNECTION, 
      WALLET,
      new PublicKey(token),
      WALLET.publicKey
  );
  console.log(`    Source Account: ${sourceAccount.address.toString()}`);

  //Step 2
  console.log(`2 - Getting Destination Token Account`);
  let destinationAccount = await getOrCreateAssociatedTokenAccount(
      SOLANA_CONNECTION, 
      WALLET,
      new PublicKey(token),
      new PublicKey(destination)
  );
  console.log(`    Destination Account: ${destinationAccount.address.toString()}`);

  //Step 3
  console.log(`3 - Fetching Number of Decimals for Mint: ${MINT_ADDRESS}`);
  const numberDecimals = 0;// await getNumberDecimals(MINT_ADDRESS);
  console.log(`    Number of Decimals: ${numberDecimals}`);

  //Step 4
  console.log(`4 - Creating and Sending Transaction`);
  const tx = new Transaction();
  tx.add(createTransferInstruction(
      sourceAccount.address,
      destinationAccount.address,
      WALLET.publicKey,
      TRANSFER_AMOUNT * Math.pow(10, numberDecimals)
  ))

  const latestBlockHash = await SOLANA_CONNECTION.getLatestBlockhash('confirmed');
  tx.recentBlockhash = latestBlockHash.blockhash;    
  const signature = await sendAndConfirmTransaction(SOLANA_CONNECTION,tx,[WALLET]);
  console.log(
      '\x1b[32m', //Green Text
      `   Transaction Success!🎉`,
      `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

}

export default sendToken;