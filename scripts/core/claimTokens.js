const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const receiver = { address: "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC" }
  const usdg = await contractAt("YieldToken", "0x1181F0583be72AB7eB6b56055AF3C102fD956C5c")
  const xgmt = await contractAt("YieldToken", "0xaF698D5680917b4E1bfDaEbe6d50894043331907")
  const usdgYieldTracker = await contractAt("YieldTracker", "0x5E8C6d5800acd3A98C8Bd52523630B0c2a9f8384")
  const xgmtYieldTracker = await contractAt("YieldTracker", "0x245b9DBB90AF8a335A9006efBb37Bee670064551")
  const gmtUsdgPair = { address: "0x5891548bB1Ea7b6159bce6Cde8C2468F36546A72" }
  const xgmtUsdgPair = { address: "0x5E8C6d5800acd3A98C8Bd52523630B0c2a9f8384" }
  const busdgUsdgPair = { address: "0x245b9DBB90AF8a335A9006efBb37Bee670064551" }
  const autoUsdgPair = { address: "0x1181F0583be72AB7eB6b56055AF3C102fD956C5c" }

  const wbnbClaimableForXgmtPair = await xgmtYieldTracker.claimable(xgmtUsdgPair.address)
  console.log(`claimable: ${ethers.utils.formatUnits(wbnbClaimableForXgmtPair, 18)} WBNB`)
  await sendTxn(xgmt.recoverClaim(xgmtUsdgPair.address, receiver.address), "recoverClaim", {gasLimit: 3e7})

  const accounts = [gmtUsdgPair, xgmtUsdgPair, busdgUsdgPair, autoUsdgPair]

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]
    const claimable = await usdgYieldTracker.claimable(account.address)
    console.log(`claimable ${i}: ${ethers.utils.formatUnits(claimable, 18)} WBNB`)
    await sendTxn(usdg.recoverClaim(account.address, receiver.address), `recoverClaim ${i}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
