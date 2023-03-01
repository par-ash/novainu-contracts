const { getFrameSigner, deployContract, contractAt , sendTxn, writeTmpAddresses, callWithRetries } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const signer = await getFrameSigner()

  let vault
  if (network === "avax") {
    vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6")
  }
  if (network === "arbitrum" || network === "arbitrumTestnet") {
    vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6")
  }

  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  console.log("timelock", timelock)

  await sendTxn(timelock.setFees(
    vault.address,
    50, // _taxBasisPoints
    5, // _stableTaxBasisPoints
    25, // _mintBurnFeeBasisPoints
    30, // _swapFeeBasisPoints
    1, // _stableSwapFeeBasisPoints
    10, // _marginFeeBasisPoints
    toUsd(5), // _liquidationFeeUsd
    3 * 60 * 60, // _minProfitTime
    true // _hasDynamicFees
  ), "vault.setFees")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
