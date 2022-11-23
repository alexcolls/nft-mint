import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber } from "@metaplex-foundation/js";
import * as fs from "fs";
import sendToken from "./sendToken";
import { Buffer } from "buffer";
import axios from "axios";

const secret = require("./keypair.json");

const QUICKNODE_RPC = 'https://warmhearted-winter-river.solana-devnet.discover.quiknode.pro/f0a750831d453a3e404bfcd2017bbe0f601242a3/';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));

const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
  .use(keypairIdentity(WALLET))
  .use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: QUICKNODE_RPC,
    timeout: 60000,
  }));

const CONFIG = {
  uploadPath: 'https://www.isdi.education/uploads/media/21-9-medium/07/557-meme_marketing_0.png?v=1-0',
  imgFileName: 'Meme',
  imgType: 'image/png',
  imgName: 'TRINITY',
  description: 'Solucky token to play in https://www.soluckygames.com',
  attributes: [
      {trait_type: 'VALUE', value: '1 SOL'},
      {trait_type: 'WEBSITE', value: 'https://soluckygames.com'},
      {trait_type: 'TWITTER', value: 'https://www.twitter.com/solucky__games'}
  ],
  sellerFeeBasisPoints: 500, // 500 bp = 5%
  symbol: 'TRINITY',
  creators: [
      {address: WALLET.publicKey, share: 100}
  ]
};

async function uploadImage(filePath: string,fileName: string): Promise<string>  {
  console.log(`Step 1 - Uploading Image`);
  const { data } = await axios.get(filePath, { responseType: "arraybuffer", });
  const imgBuffer = Buffer.from(data);
  const imgMetaplexFile = toMetaplexFile(imgBuffer, fileName);
  const imgUri = await METAPLEX.storage().upload(imgMetaplexFile);
  console.log(`   Image URI:`,imgUri);
  return imgUri
}

async function uploadMetadata(imgUri: string, imgType: string, nftName: string, description: string, attributes: {trait_type: string, value: string}[]) {
  console.log(`Step 2 - Uploading Metadata`);
  const { uri } = await METAPLEX
    .nfts()
    .uploadMetadata({
        name: nftName,
        description: description,
        image: imgUri,
        attributes: attributes,
        properties: {
            files: [
                {
                    type: imgType,
                    uri: imgUri,
                },
            ]
        }
    });
  console.log('   Metadata URI:',uri);
  return uri;  
}

async function mintNft(metadataUri: string, name: string, sellerFee: number, symbol: string, creators: {address: PublicKey, share: number}[]) {
  console.log(`Step 3 - Minting NFT`);
  const { nft } = await METAPLEX
    .nfts()
    .create({
        uri: metadataUri,
        name: name,
        sellerFeeBasisPoints: sellerFee,
        symbol: symbol,
        creators: creators,
        isMutable: false,
        maxSupply: toBigNumber(1)
    });
  console.log(`   Success!🎉`);
  console.log(`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
  return nft;
}
  
const DESTINATION_WALLET = '2TyAp92s7TEksnycmYY2Fk5i1j5anwFTqECyuFMVhomP'; 

async function main() {
  console.log(`Minting ${CONFIG.imgName} to an NFT in Wallet ${WALLET.publicKey.toBase58()}.`);
  // Step 1 - Upload Image
  const imgUri = await uploadImage(CONFIG.uploadPath, CONFIG.imgFileName);
  // Step 2 - Upload Metadata
  const metadataUri = await uploadMetadata(imgUri, CONFIG.imgType, CONFIG.imgName, CONFIG.description, CONFIG.attributes); 
  // Step 3 - Mint NFT
  const nft = await mintNft(metadataUri, CONFIG.imgName, CONFIG.sellerFeeBasisPoints, CONFIG.symbol, CONFIG.creators);
  // Step 4 - Send Token
  sendToken(DESTINATION_WALLET, String(nft.address) )
}

main();