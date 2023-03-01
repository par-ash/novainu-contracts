const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const wallet = { address: "0x5F799f365Fa8A2B60ac0429C48B153cA5a6f0Cf8" }

  const account = "0x6eA748d14f28778495A3fBa3550a6CdfBbE555f9"
  const unstakeAmount = "79170000000000000000"

  const rewardRouter = await contractAt("RewardRouter", "0x1b8911995ee36F4F95311D1D9C1845fA18c56Ec6")
  const nova = await contractAt("NOVA", "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a");
  const bnNova = await contractAt("MintableBaseToken", "0x35247165119B69A40edD5304969560D0ef486921");
  const stakedNovaTracker = await contractAt("RewardTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4")
  const bonusNovaTracker = await contractAt("RewardTracker", "0x4d268a7d4C16ceB5a606c173Bd974984343fea13")
  const feeNovaTracker = await contractAt("RewardTracker", "0xd2D1162512F927a7e282Ef43a362659E4F2a728F")

  // const gasLimit = 30000000

  // await sendTxn(feeNovaTracker.setHandler(wallet.address, true, { gasLimit }), "feeNovaTracker.setHandler")
  // await sendTxn(bonusNovaTracker.setHandler(wallet.address, true, { gasLimit }), "bonusNovaTracker.setHandler")
  // await sendTxn(stakedNovaTracker.setHandler(wallet.address, true, { gasLimit }), "stakedNovaTracker.setHandler")

  const stakedAmount = await stakedNovaTracker.stakedAmounts(account)
  console.log(`${account} staked: ${stakedAmount.toString()}`)
  console.log(`unstakeAmount: ${unstakeAmount.toString()}`)

  await sendTxn(feeNovaTracker.unstakeForAccount(account, bonusNovaTracker.address, unstakeAmount, account), "feeNovaTracker.unstakeForAccount")
  await sendTxn(bonusNovaTracker.unstakeForAccount(account, stakedNovaTracker.address, unstakeAmount, account), "bonusNovaTracker.unstakeForAccount")
  await sendTxn(stakedNovaTracker.unstakeForAccount(account, nova.address, unstakeAmount, account), "stakedNovaTracker.unstakeForAccount")

  await sendTxn(bonusNovaTracker.claimForAccount(account, account), "bonusNovaTracker.claimForAccount")

  const bnNovaAmount = await bnNova.balanceOf(account)
  console.log(`bnNovaAmount: ${bnNovaAmount.toString()}`)

  await sendTxn(feeNovaTracker.stakeForAccount(account, account, bnNova.address, bnNovaAmount), "feeNovaTracker.stakeForAccount")

  const stakedBnNova = await feeNovaTracker.depositBalances(account, bnNova.address)
  console.log(`stakedBnNova: ${stakedBnNova.toString()}`)

  const reductionAmount = stakedBnNova.mul(unstakeAmount).div(stakedAmount)
  console.log(`reductionAmount: ${reductionAmount.toString()}`)
  await sendTxn(feeNovaTracker.unstakeForAccount(account, bnNova.address, reductionAmount, account), "feeNovaTracker.unstakeForAccount")
  await sendTxn(bnNova.burn(account, reductionAmount), "bnNova.burn")

  const novaAmount = await nova.balanceOf(account)
  console.log(`novaAmount: ${novaAmount.toString()}`)

  await sendTxn(nova.burn(account, unstakeAmount), "nova.burn")
  const nextNovaAmount = await nova.balanceOf(account)
  console.log(`nextNovaAmount: ${nextNovaAmount.toString()}`)

  const nextStakedAmount = await stakedNovaTracker.stakedAmounts(account)
  console.log(`nextStakedAmount: ${nextStakedAmount.toString()}`)

  const nextStakedBnNova = await feeNovaTracker.depositBalances(account, bnNova.address)
  console.log(`nextStakedBnNova: ${nextStakedBnNova.toString()}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
