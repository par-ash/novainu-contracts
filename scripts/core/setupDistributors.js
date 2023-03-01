const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const usdg = await contractAt("YieldToken", "0x1a6863f6254308627254a14C06F20f8B952EF167")
  const tokenDecimals = 18
  const wbnb = await contractAt("YieldToken", "0xaF698D5680917b4E1bfDaEbe6d50894043331907")

  const farms = [
    {
      farm: usdg,
      yieldTrackerIndex: 0,
      transferAmount: "35.0",
      shouldClaim: true
    }
  ]

  for (let i = 0; i < farms.length; i++) {
    console.log(`---------- ${i} ----------`)
    const { farm, yieldTrackerIndex, transferAmount, shouldClaim } = farms[i]
    const convertedTransferAmount = ethers.utils.parseUnits(transferAmount, tokenDecimals)
    console.log("convertedTransferAmount", convertedTransferAmount.toString())
    const rewardsPerInterval = convertedTransferAmount.div(168)
    console.log("rewardsPerInterval", rewardsPerInterval.toString())

    const yieldTrackerAddress = await farm.yieldTrackers(yieldTrackerIndex)
    console.log("yieldTrackerAddress", yieldTrackerAddress)
    const yieldTracker0 = await contractAt("YieldTracker", yieldTrackerAddress)
    const distributorAddress = await yieldTracker0.distributor()
    console.log("distributorAddress", distributorAddress)
    const distributor = await contractAt("TimeDistributor", distributorAddress)
    const rewardToken = await distributor.rewardTokens(yieldTracker0.address)
    console.log("rewardToken", rewardToken)
    const tokensPerInterval = await distributor.tokensPerInterval(yieldTracker0.address)
    console.log("tokensPerInterval", tokensPerInterval.toString())
    const lastDistributionTime = await distributor.lastDistributionTime(yieldTracker0.address)
    console.log("lastDistributionTime", lastDistributionTime.toString())

    if (shouldClaim) {
      await sendTxn(farm.claim("0x9f169c2189A2d975C18965DE985936361b4a9De9"), `farm.claim ${i}`)
    }
    if (convertedTransferAmount.gt(0)) {
      await sendTxn(wbnb.transfer(distributorAddress, convertedTransferAmount), `wbnb.transfer ${i}`)
    }
    await sendTxn(distributor.setTokensPerInterval(yieldTrackerAddress, rewardsPerInterval), `distributor.setTokensPerInterval ${i}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
