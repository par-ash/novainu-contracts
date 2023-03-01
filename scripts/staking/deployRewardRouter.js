const { deployContract, contractAt, sendTxn, readTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('../core/tokens')[network];

async function main() {
  const {
    nativeToken
  } = tokens

  const weth = await contractAt("Token", nativeToken.address)
  const nova = await contractAt("NOVA", "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a")
  const esNova = await contractAt("EsNOVA", "0xf42Ae1D54fd613C9bb14810b0588FaAa09a426cA")
  const bnNova = await contractAt("MintableBaseToken", "0x35247165119B69A40edD5304969560D0ef486921")

  const stakedNovaTracker = await contractAt("RewardTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4")
  const bonusNovaTracker = await contractAt("RewardTracker", "0x4d268a7d4C16ceB5a606c173Bd974984343fea13")
  const feeNovaTracker = await contractAt("RewardTracker", "0xd2D1162512F927a7e282Ef43a362659E4F2a728F")

  const feeNlpTracker = await contractAt("RewardTracker", "0x4e971a87900b931fF39d1Aad67697F49835400b6")
  const stakedNlpTracker = await contractAt("RewardTracker", "0x1aDDD80E6039594eE970E5872D247bf0414C8903")

  const nlp = await contractAt("NLP", "0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258")
  const nlpManager = await contractAt("NlpManager", "0x321F653eED006AD1C29D174e17d96351BDe22649")

  console.log("nlpManager", nlpManager.address)

  const rewardRouter = await deployContract("RewardRouter", [])

  await sendTxn(rewardRouter.initialize(
    weth.address,
    nova.address,
    esNova.address,
    bnNova.address,
    nlp.address,
    stakedNovaTracker.address,
    bonusNovaTracker.address,
    feeNovaTracker.address,
    feeNlpTracker.address,
    stakedNlpTracker.address,
    nlpManager.address
  ), "rewardRouter.initialize")

  // allow rewardRouter to stake in stakedNovaTracker
  await sendTxn(stakedNovaTracker.setHandler(rewardRouter.address, true), "stakedNovaTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in bonusNovaTracker
  await sendTxn(bonusNovaTracker.setHandler(rewardRouter.address, true), "bonusNovaTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in feeNovaTracker
  await sendTxn(feeNovaTracker.setHandler(rewardRouter.address, true), "feeNovaTracker.setHandler(rewardRouter)")
  // allow rewardRouter to burn bnNova
  await sendTxn(bnNova.setMinter(rewardRouter.address, true), "bnNova.setMinter(rewardRouter)")

  // allow rewardRouter to mint in nlpManager
  await sendTxn(nlpManager.setHandler(rewardRouter.address, true), "nlpManager.setHandler(rewardRouter)")
  // allow rewardRouter to stake in feeNlpTracker
  await sendTxn(feeNlpTracker.setHandler(rewardRouter.address, true), "feeNlpTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in stakedNlpTracker
  await sendTxn(stakedNlpTracker.setHandler(rewardRouter.address, true), "stakedNlpTracker.setHandler(rewardRouter)")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
