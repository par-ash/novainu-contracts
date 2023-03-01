const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const rewardRouter = await contractAt("RewardRouter", "0xEa7fCb85802713Cb03291311C66d6012b23402ea")
  const bnNova = await contractAt("MintableBaseToken", "0x35247165119B69A40edD5304969560D0ef486921")
  const nlpManager = await contractAt("NlpManager", "0x91425Ac4431d068980d497924DD540Ae274f3270")

  const stakedNovaTracker = await contractAt("RewardTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4")
  const bonusNovaTracker = await contractAt("RewardTracker", "0x4d268a7d4C16ceB5a606c173Bd974984343fea13")
  const feeNovaTracker = await contractAt("RewardTracker", "0xd2D1162512F927a7e282Ef43a362659E4F2a728F")

  const feeNlpTracker = await contractAt("RewardTracker", "0x4e971a87900b931fF39d1Aad67697F49835400b6")
  const stakedNlpTracker = await contractAt("RewardTracker", "0x1aDDD80E6039594eE970E5872D247bf0414C8903")

  // allow rewardRouter to stake in stakedNovaTracker
  await sendTxn(stakedNovaTracker.setHandler(rewardRouter.address, false), "stakedNovaTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in bonusNovaTracker
  await sendTxn(bonusNovaTracker.setHandler(rewardRouter.address, false), "bonusNovaTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in feeNovaTracker
  await sendTxn(feeNovaTracker.setHandler(rewardRouter.address, false), "feeNovaTracker.setHandler(rewardRouter)")
  // allow rewardRouter to burn bnNova
  await sendTxn(bnNova.setMinter(rewardRouter.address, false), "bnNova.setMinter(rewardRouter)")

  // allow rewardRouter to mint in nlpManager
  await sendTxn(nlpManager.setHandler(rewardRouter.address, false), "nlpManager.setHandler(rewardRouter)")
  // allow rewardRouter to stake in feeNlpTracker
  await sendTxn(feeNlpTracker.setHandler(rewardRouter.address, false), "feeNlpTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in stakedNlpTracker
  await sendTxn(stakedNlpTracker.setHandler(rewardRouter.address, false), "stakedNlpTracker.setHandler(rewardRouter)")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
