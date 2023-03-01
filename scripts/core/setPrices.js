const { deployContract, contractAt , sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const secondaryPriceFeed = await contractAt("FastPriceFeed", "0xE2793EA95f495dd50EA3d177ab329E49CF57e47C")
  const vaultPriceFeed = await contractAt("VaultPriceFeed", "0xdEE8bF56CC2abA13E31C6213618A6b82f26a53F5")

  // await sendTxn(vaultPriceFeed.setIsAmmEnabled(false), "vaultPriceFeed.setIsAmmEnabled")
  // console.log("vaultPriceFeed.isSecondaryPriceEnabled", await vaultPriceFeed.isSecondaryPriceEnabled())

  await sendTxn(secondaryPriceFeed.setPrices(
    [tokens.btc.address, tokens.eth.address, tokens.usdc.address],
    [expandDecimals(35000, 30), expandDecimals(4000, 30), expandDecimals(1, 30)]
  ), "secondaryPriceFeed.setPrices")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
