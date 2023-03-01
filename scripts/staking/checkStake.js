const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {

  const account = "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79"

  const bnNova = await contractAt("MintableBaseToken", "0x48dDeBC8E9b84ef0abe6a80dD099b3464EC55f4E");
  const feeNovaTracker = await contractAt("RewardTracker", "0xF65a342F4BFeE5B0707EC91045ee8B9C3EBa1574")
  const wallet = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const nova = await contractAt("NOVA", "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4");
  const rewardRouter = await contractAt("RewardRouter", "0x0bfB9281698035698C814F2Ac8Ae6578cb0795e0")
  const stakedNovaTracker = await contractAt("RewardTracker", "0x31493B49c8c78443A557dad65b96a84Bf516706C")
  const bonusNovaTracker = await contractAt("RewardTracker", "0x31493B49c8c78443A557dad65b96a84Bf516706C")

  console.log("stakedNovaTracker.claimable", (await stakedNovaTracker.claimable(account)).toString())
  console.log("bonusNovaTracker.claimable", (await bonusNovaTracker.claimable(account)).toString())
  console.log("feeNovaTracker.claimable", (await feeNovaTracker.claimable(account)).toString())
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
