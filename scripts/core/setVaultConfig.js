const { contractAt , sendTxn, callWithRetries } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const vault = await callWithRetries(contractAt, ["Vault", "0x7386da1e66250c55e46310cde79eAd3d84d8A22d"])

  await sendTxn(callWithRetries(vault.setFees.bind(vault), [
    10, // taxBasisPoints,
    10, // stableTaxBasisPoints,
    10, // mintBurnFeeBasisPoints,
    10, // swapFeeBasisPoints,
    10, // stableSwapFeeBasisPoints,
    10, // marginFeeBasisPoints,
    expandDecimals(1, 30), // 1 USD, liquidationFeeUsd,
    3600, // 1 hour, minProfitTime,
    true // hasDynamicFees
  ]), "vault.setFees")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
