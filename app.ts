import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber } from "@metaplex-foundation/js";
import * as fs from "fs";
// import * as secret from './keypair.json';
const secret = [4,58,161,182,185,42,208,25,189,53,91,18,153,38,17,208,238,252,229,74,113,124,184,22,20,41,112,222,103,36,4,53,7,84,97,87,88,109,49,183,87,144,123,212,59,189,34,81,164,130,35,91,112,78,166,194,211,87,193,242,219,255,178,193]

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
  uploadPath: './solucky.png',
  imgFileName: 'solucky.png',
  imgType: 'image/png',
  imgName: 'Solucky',
  description: 'Pixel infrastructure for everyone!',
  attributes: [
      {trait_type: 'Speed', value: 'Quick'},
      {trait_type: 'Type', value: 'Pixelated'},
      {trait_type: 'Background', value: 'QuickNode Blue'}
  ],
  sellerFeeBasisPoints: 500,//500 bp = 5%
  symbol: 'SOLUCKY',
  creators: [
      {address: WALLET.publicKey, share: 100}
  ]
};



async function uploadImage(filePath: string,fileName: string): Promise<string>  {
  console.log(`Step 1 - Uploading Image`);
  const imgBuffer = fs.readFileSync(filePath);
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
}
  

async function main() {
  console.log(`Minting ${CONFIG.imgName} to an NFT in Wallet ${WALLET.publicKey.toBase58()}.`);
  // Step 1 - Upload Image
  const imgUri = await uploadImage(CONFIG.uploadPath, CONFIG.imgFileName);
  // Step 2 - Upload Metadata
  const metadataUri = await uploadMetadata(imgUri, CONFIG.imgType, CONFIG.imgName, CONFIG.description, CONFIG.attributes); 

  // Step 3 - Mint NFT
  mintNft(metadataUri, CONFIG.imgName, CONFIG.sellerFeeBasisPoints, CONFIG.symbol, CONFIG.creators);
}

main();