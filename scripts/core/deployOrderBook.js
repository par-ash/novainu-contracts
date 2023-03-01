const { deployContract, contractAt , sendTxn, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const { nativeToken } = tokens

  const orderBook = await contractAt("OrderBook", "0xfC43F371792FCdD022cB0a6160DB0d7AAA3c89dE");

  // Arbitrum mainnet addresses
  await sendTxn(orderBook.initialize(
    "0xb4a0F695620fC989FEc16990805365f7e9db4c27", // router
    "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6", // vault
    nativeToken.address, // weth
    "0x1a6863f6254308627254a14C06F20f8B952EF167", // usdg
    "10000000000000000", // 0.01 AVAX
    expandDecimals(10, 30), // min purchase token amount usd
    {gasPrice:3e11,gasLimit:3e11}
  ), "orderBook.initialize");

  writeTmpAddresses({
    orderBook: orderBook.address
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
