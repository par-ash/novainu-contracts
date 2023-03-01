const { getFrameSigner, deployContract, contractAt , sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")
const { errors } = require("../../test/core/Vault/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const signer = await getFrameSigner()
  //console.log(tokens)
  const vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6")
  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  const vaultUtils = await contractAt("VaultUtils", [vault.address])
  console.log(vault.address)
  console.log(timelock.address)
  console.log(vaultUtils.address)
  await sendTxn(timelock.setVaultUtils(vault.address, vaultUtils.address), "timelock.setVaultUtils")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
