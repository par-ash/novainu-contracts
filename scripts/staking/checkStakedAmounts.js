const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const stakeNovaList = require("../../data/stakeNovaList.json")

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const { formatEther } = ethers.utils
  const wallet = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const nova = await contractAt("NOVA", "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4");
  const rewardRouter = await contractAt("RewardRouter", "0x0bfB9281698035698C814F2Ac8Ae6578cb0795e0")
  const stakedNovaTracker = await contractAt("RewardTracker", "0x31493B49c8c78443A557dad65b96a84Bf516706C")
  const bonusNovaTracker = await contractAt("RewardTracker", "0x31493B49c8c78443A557dad65b96a84Bf516706C")

  const batchSize = 20

  for (let i = 0; i < stakeNovaList.length; i++) {
    const { address, balance } = stakeNovaList[i]

    const stakedAmount = await stakedNovaTracker.stakedAmounts(address)
    console.log(`${i} ${address}: ${formatEther(balance)}, ${formatEther(stakedAmount)}`)

    if (!stakedAmount.eq(balance)) {
      throw new Error(`Invalid stakedAmount: ${address}, ${formatEther(balance)}, ${formatEther(stakedAmount).toString()}`)
    }

    const pendingRewards = await stakedNovaTracker.claimable(address)
    const pendingBonus = await bonusNovaTracker.claimable(address)

    console.log(`${address}: ${formatEther(pendingRewards).toString()}, ${formatEther(pendingBonus).toString()}`)

    if (i % batchSize === 0) {
      await sleep(1)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
