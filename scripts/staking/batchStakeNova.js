const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const stakeNovaList = require("../../data/novaMigration/stakeNovaList6.json")

async function main() {
  const shouldStake = false

  const wallet = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const nova = await contractAt("NOVA", "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4");
  const rewardRouter = await contractAt("RewardRouter", "0x0bfB9281698035698C814F2Ac8Ae6578cb0795e0")
  const stakedNovaTracker = await contractAt("RewardTracker", "0x31493B49c8c78443A557dad65b96a84Bf516706C")
  const bonusNovaTracker = await contractAt("RewardTracker", "0x31493B49c8c78443A557dad65b96a84Bf516706C")


  console.log("processing list", stakeNovaList.length)

  // await sendTxn(nova.setMinter(wallet.address, true), "nova.setMinter")
  // await sendTxn(nova.mint(wallet.address, expandDecimals(5500000, 18)), "nova.mint")
  // await sendTxn(nova.approve(stakedNovaTracker.address, expandDecimals(5500000, 18)), "nova.approve(stakedNovaTracker)")
  // await sendTxn(rewardRouter.batchStakeNovaForAccount(["0x5F799f365Fa8A2B60ac0429C48B153cA5a6f0Cf8"], [1], { gasLimit: 30000000 }), "rewardRouter.batchStakeNovaForAccount")

  if (!shouldStake) {
    for (let i = 0; i < stakeNovaList.length; i++) {
      const item = stakeNovaList[i]
      const account = item.address
      const stakedAmount = await stakedNovaTracker.stakedAmounts(account)
      console.log(`${account} : ${stakedAmount.toString()}`)
    }
    return
  }

  const batchSize = 30
  let accounts = []
  let amounts = []

  for (let i = 0; i < stakeNovaList.length; i++) {
    const item = stakeNovaList[i]
    accounts.push(item.address)
    amounts.push(item.balance)

    if (accounts.length === batchSize) {
      console.log("accounts", accounts)
      console.log("amounts", amounts)
      console.log("sending batch", i, accounts.length, amounts.length)
      await sendTxn(rewardRouter.batchStakeNovaForAccount(accounts, amounts), "rewardRouter.batchStakeNovaForAccount")

      const account = accounts[0]
      const amount = amounts[0]
      const stakedAmount = await stakedNovaTracker.stakedAmounts(account)
      console.log(`${account}: ${amount.toString()}, ${stakedAmount.toString()}`)

      accounts = []
      amounts = []
    }
  }

  if (accounts.length > 0) {
    console.log("sending final batch", stakeNovaList.length, accounts.length, amounts.length)
    await sendTxn(rewardRouter.batchStakeNovaForAccount(accounts, amounts), "rewardRouter.batchStakeNovaForAccount")
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
