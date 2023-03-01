const { deployContract, contractAt , sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const gov = await contractAt("Timelock", "0x64C322f4008B7EA424905822DaD2C041C1CAbf44")
  const vaultPriceFeed = await contractAt("VaultPriceFeed", "0xdEE8bF56CC2abA13E31C6213618A6b82f26a53F5")
  const tokenKeys = ["btc", "eth", "link"]

  for (let i = 0; i < tokenKeys.length; i++) {
    const key = tokenKeys[i]
    const token = tokens[key]
    const adjustmentBasisPoints = await vaultPriceFeed.adjustmentBasisPoints(token.address)
    const isAdditive = await vaultPriceFeed.isAdjustmentAdditive(token.address)

    console.log(`${key}: ${isAdditive ? "+" : "-"}${adjustmentBasisPoints}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
