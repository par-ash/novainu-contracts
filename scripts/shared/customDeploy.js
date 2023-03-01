const { ethers } = require('ethers')
const { deployContract, contractAt, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")


const {
  ARBITRUM_URL,
  AVAX_URL,
  ARBITRUM_DEPLOY_KEY,
  AVAX_DEPLOY_KEY,
  ARBITRUM_TESTNET_DEPLOY_KEY,
  ARBITRUM_TESTNET_URL
} = require("../../env.json")

const address0 = '0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4' //Token //0x6bebc4925716945d46f0ec336d5c2564f419682c
const address1 = '0xEBbc3452Cc911591e4F18f3b36727Df45d6bd1f9' //WETH //0xaf4159A80B6Cc41ED517DB1c453d1Ef5C2e4dB72 //0x9A631675D75f4d8CCc9e48FFc993859F8536B644
const factoryAddress = '0x4893376342d5D7b3e31d4184c08b265e5aB2A3f6' //UNI

async function main() {

  const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_TESTNET_URL)
  const signer = new ethers.Wallet("e69680a36bbcbdc74ecc8afa4fc45ec74806a40b9e41dd2437812d8b5cffc456", provider);
  const accountAddr = "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79";
  const initialSupply = expandDecimals(1000, 18)
  const vault = await contractAt("Vault", "0x7386da1e66250c55e46310cde79eAd3d84d8A22d")
  const router = await contractAt("Router", "0x44F41ac9dbd8B17C8D94266E41359c4f8C412bed")
  const vaultPriceFeed = await contractAt("VaultPriceFeed", "0x8A87239a237c14e385b3D7289995AC48931F8a93")
  const nlp = await contractAt("NLP", "0xe7a7980CB7bE12baF7bc4f78F6b8f4d065Fa8838")
  const nova = await contractAt("NOVA", "0x0138b52369e2d5b2866c94Eb3b7088B427fFA0FE")
  const usdg = await contractAt("USDG", "0xE852Aaf6386cC5F5f00798A5dD2A3B7dAF4b9Efe")
  const btc = await contractAt("FaucetToken", "0xe628b3d6d5c2eC26092085784C5bD41d9fA3AF2a")
  const usdc = await contractAt("FaucetToken", "0x1a6863f6254308627254a14C06F20f8B952EF167")
  const wETH = await contractAt("WETH", "0xE575d758dDcC6e882aF755d3d678f32635B0D5f2")
  const orderBook = await contractAt("OrderBook", "0x45852110dD10c3C80822aBd25108D50BD923AB84")
  const positionRouter = await contractAt("PositionRouter", "0xe1C2e3a8753bA4581656d7E4a01e929E6B36E391")
  //console.log(vault.address)

  let txn;

  // txn = await usdg.setMinter(accountAddr, true);
  // console.log(txn);
  // txn = await usdg.isMinter(accountAddr);
  // console.log(txn);
  // txn = await nova.isMinter(accountAddr);
  // console.log(txn);

  // txn = await btc.mint(accountAddr, initialSupply);
  // console.log(txn)
  // txn = await usdc.mint(accountAddr, initialSupply);
  // console.log(txn)
  txn = await vault.tokenBalances(usdg.address);
  console.log(txn)
  // txn = await vault.getMaxPrice("0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f");
  // console.log(txn)
  // txn = await vault.getMinPrice(nlp.address, {gasPrice: 2e8,gasLimit: 9e11});
  // console.log(txn)
  // await usdg.mint(accountAddr, initialSupply, {gasPrice: 2e8,gasLimit: 9e11});

  txn = await nova.totalSupply({gasPrice: 2e8,gasLimit: 9e11});
  console.log(txn)
  txn = await btc.totalSupply({gasPrice: 2e8,gasLimit: 9e11});
  console.log(txn)
  txn = await usdc.totalSupply({gasPrice: 2e8,gasLimit: 9e11});
  console.log(txn)

  // txn = await orderBook.getSwapOrder("0xE852Aaf6386cC5F5f00798A5dD2A3B7dAF4b9Efe", 0);
  // console.log(txn)
  // txn = await vault.allWhitelistedTokensLength();
  // console.log(txn)
  // txn = await vault.getMaxPrice("0xE575d758dDcC6e882aF755d3d678f32635B0D5f2", {gasPrice: 2e8,gasLimit: 9e11});
  // console.log(txn)

}

main()
