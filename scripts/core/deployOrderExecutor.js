const { deployContract, contractAt , sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")
const { errors } = require("../../test/core/Vault/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const vault = await contractAt("Vault", "0x7386da1e66250c55e46310cde79eAd3d84d8A22d")
  console.log(vault.address);
  const orderBook = await contractAt("OrderBook", "0x45852110dD10c3C80822aBd25108D50BD923AB84")
  console.log(orderBook.address);
  await deployContract("OrderExecutor", [vault.address, orderBook.address])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
