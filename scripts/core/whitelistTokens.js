const { deployContract, contractAt, sendTxn, callWithRetries } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toChainlinkPrice } = require("../../test/shared/chainlink")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const vault = await contractAt("Vault", "0x7386da1e66250c55e46310cde79eAd3d84d8A22d")
  const vaultPriceFeed = await contractAt("VaultPriceFeed", "0x8A87239a237c14e385b3D7289995AC48931F8a93")
  console.log("vault", vault.address)
  console.log("vaultPriceFeed", vaultPriceFeed.address)

  const { avax, btc, eth, mim, usdt, usdc } = tokens
  const tokenArr = [btc, eth, usdc, usdt]//[btc, eth, usdc, usdt]

  for (const token of tokenArr) {
    console.log(token.address);
    await sendTxn(vaultPriceFeed.setTokenConfig(
      token.address, // _token
      token.priceFeed, // _priceFeed
      token.priceDecimals, // _priceDecimals
      token.isStrictStable // _isStrictStable
      //,{gasPrice:1e8, gasLimit:4e12}
    ), `vaultPriceFeed.setTokenConfig(${token.name}) ${token.address} ${token.priceFeed}`)

    await sendTxn(vault.setTokenConfig(
      token.address, // _token
      token.decimals, // _tokenDecimals
      token.tokenWeight, // _tokenWeight
      token.minProfitBps, // _minProfitBps
      expandDecimals(token.maxUsdgAmount, 18), // _maxUsdgAmount
      token.isStable, // _isStable
      token.isShortable // _isShortable
    //,{ gasPrice:1e8, gasLimit:4e12 }

  ), `vault.setTokenConfig(${token.name}) ${token.address}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
