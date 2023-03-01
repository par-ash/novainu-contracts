const { ethers } = require('ethers')
const { abi: UniswapV3Factory } = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')
require('dotenv').config()
const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET

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
  //const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET)

  const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_TESTNET_URL)
  const signer = new ethers.Wallet("e69680a36bbcbdc74ecc8afa4fc45ec74806a40b9e41dd2437812d8b5cffc456", provider);

  const factoryContract = new ethers.Contract(
    factoryAddress,
    UniswapV3Factory,
    signer
  )
  console.log('factoryContract', factoryContract.address)
  //const createPool = await factoryContract.createPool(address0, address1, 100, {gasLimit: 3e7});
  //const createPool = await factoryContract.createAndInitializePoolIfNecessary(address0, address1, 100, "000000000000000000000000000000000000000005b96aabfac7cdc4b3b58fc2");
  //console.log('createPool', createPool.address)
  let poolAddress = await factoryContract.getPool(address0, address1, 100)
  console.log('poolAddress', poolAddress)

}

// function createAndInitializePoolIfNecessary(
//   address token0,
//   address token1,
//   uint24 fee,
//   uint160 sqrtPriceX96
// ) external payable override returns (address pool) {
//   require(token0 < token1);
//   pool = IUniswapV3Factory(factory).getPool(token0, token1, fee);
//
//   if (pool == address(0)) {
//     pool = IUniswapV3Factory(factory).createPool(token0, token1, fee);
//     IUniswapV3Pool(pool).initialize(sqrtPriceX96);
//   } else {
//     (uint160 sqrtPriceX96Existing, , , , , , ) = IUniswapV3Pool(pool).slot0();
//     if (sqrtPriceX96Existing == 0) {
//       IUniswapV3Pool(pool).initialize(sqrtPriceX96);
//     }
//   }
// }

main()
