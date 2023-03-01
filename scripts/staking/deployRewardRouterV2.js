const { deployContract, contractAt, sendTxn, writeTmpAddresses } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('../core/tokens')[network];

async function main() {
  const { nativeToken } = tokens

  const vestingDuration = 365 * 24 * 60 * 60

  const nlpManager = await contractAt("NlpManager", "0xb0eDB05514f7Dc86C62011dc8aB49b926cd05483")
  const nlp = await contractAt("NLP", "0xCd81FDa67eb7D9d23f98b81224CAEd25888b1233")

  const nova = await contractAt("NOVA", "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4");
  const esNova = await contractAt("EsNOVA", "0xF99ADd844054816c742e5F6380D661b3c39dd74F");
  const bnNova = await deployContract("MintableBaseToken", ["Bonus NOVA", "bnNOVA", 0]);

  await sendTxn(esNova.setInPrivateTransferMode(true), "esNova.setInPrivateTransferMode")
  await sendTxn(nlp.setInPrivateTransferMode(true), "nlp.setInPrivateTransferMode")

  const stakedNovaTracker = await deployContract("RewardTracker", ["Staked NOVA", "sNOVA"])
  const stakedNovaDistributor = await deployContract("RewardDistributor", [esNova.address, stakedNovaTracker.address])
  await sendTxn(stakedNovaTracker.initialize([nova.address, esNova.address], stakedNovaDistributor.address), "stakedNovaTracker.initialize")
  await sendTxn(stakedNovaDistributor.updateLastDistributionTime(), "stakedNovaDistributor.updateLastDistributionTime")

  const bonusNovaTracker = await deployContract("RewardTracker", ["Staked + Bonus NOVA", "sbNOVA"])
  const bonusNovaDistributor = await deployContract("BonusDistributor", [bnNova.address, bonusNovaTracker.address])
  await sendTxn(bonusNovaTracker.initialize([stakedNovaTracker.address], bonusNovaDistributor.address), "bonusNovaTracker.initialize")
  await sendTxn(bonusNovaDistributor.updateLastDistributionTime(), "bonusNovaDistributor.updateLastDistributionTime")

  const feeNovaTracker = await deployContract("RewardTracker", ["Staked + Bonus + Fee NOVA", "sbfNOVA"])
  const feeNovaDistributor = await deployContract("RewardDistributor", [nativeToken.address, feeNovaTracker.address])
  await sendTxn(feeNovaTracker.initialize([bonusNovaTracker.address, bnNova.address], feeNovaDistributor.address), "feeNovaTracker.initialize")
  await sendTxn(feeNovaDistributor.updateLastDistributionTime(), "feeNovaDistributor.updateLastDistributionTime")

  const feeNlpTracker = await deployContract("RewardTracker", ["Fee NLP", "fNLP"])
  const feeNlpDistributor = await deployContract("RewardDistributor", [nativeToken.address, feeNlpTracker.address])
  await sendTxn(feeNlpTracker.initialize([nlp.address], feeNlpDistributor.address), "feeNlpTracker.initialize")
  await sendTxn(feeNlpDistributor.updateLastDistributionTime(), "feeNlpDistributor.updateLastDistributionTime")

  const stakedNlpTracker = await deployContract("RewardTracker", ["Fee + Staked NLP", "fsNLP"])
  const stakedNlpDistributor = await deployContract("RewardDistributor", [esNova.address, stakedNlpTracker.address])
  await sendTxn(stakedNlpTracker.initialize([feeNlpTracker.address], stakedNlpDistributor.address), "stakedNlpTracker.initialize")
  await sendTxn(stakedNlpDistributor.updateLastDistributionTime(), "stakedNlpDistributor.updateLastDistributionTime")

  await sendTxn(stakedNovaTracker.setInPrivateTransferMode(true), "stakedNovaTracker.setInPrivateTransferMode")
  await sendTxn(stakedNovaTracker.setInPrivateStakingMode(true), "stakedNovaTracker.setInPrivateStakingMode")
  await sendTxn(bonusNovaTracker.setInPrivateTransferMode(true), "bonusNovaTracker.setInPrivateTransferMode")
  await sendTxn(bonusNovaTracker.setInPrivateStakingMode(true), "bonusNovaTracker.setInPrivateStakingMode")
  await sendTxn(bonusNovaTracker.setInPrivateClaimingMode(true), "bonusNovaTracker.setInPrivateClaimingMode")
  await sendTxn(feeNovaTracker.setInPrivateTransferMode(true), "feeNovaTracker.setInPrivateTransferMode")
  await sendTxn(feeNovaTracker.setInPrivateStakingMode(true), "feeNovaTracker.setInPrivateStakingMode")

  await sendTxn(feeNlpTracker.setInPrivateTransferMode(true), "feeNlpTracker.setInPrivateTransferMode")
  await sendTxn(feeNlpTracker.setInPrivateStakingMode(true), "feeNlpTracker.setInPrivateStakingMode")
  await sendTxn(stakedNlpTracker.setInPrivateTransferMode(true), "stakedNlpTracker.setInPrivateTransferMode")
  await sendTxn(stakedNlpTracker.setInPrivateStakingMode(true), "stakedNlpTracker.setInPrivateStakingMode")

  const novaVester = await deployContract("Vester", [
    "Vested NOVA", // _name
    "vNOVA", // _symbol
    vestingDuration, // _vestingDuration
    esNova.address, // _esToken
    feeNovaTracker.address, // _pairToken
    nova.address, // _claimableToken
    stakedNovaTracker.address, // _rewardTracker
  ])

  const nlpVester = await deployContract("Vester", [
    "Vested NLP", // _name
    "vNLP", // _symbol
    vestingDuration, // _vestingDuration
    esNova.address, // _esToken
    stakedNlpTracker.address, // _pairToken
    nova.address, // _claimableToken
    stakedNlpTracker.address, // _rewardTracker
  ])

  const rewardRouter = await deployContract("RewardRouterV2", [])
  await sendTxn(rewardRouter.initialize(
    nativeToken.address,
    nova.address,
    esNova.address,
    bnNova.address,
    nlp.address,
    stakedNovaTracker.address,
    bonusNovaTracker.address,
    feeNovaTracker.address,
    feeNlpTracker.address,
    stakedNlpTracker.address,
    nlpManager.address,
    novaVester.address,
    nlpVester.address
  ), "rewardRouter.initialize")

  await sendTxn(nlpManager.setHandler(rewardRouter.address), "nlpManager.setHandler(rewardRouter)")

  // allow rewardRouter to stake in stakedNovaTracker
  await sendTxn(stakedNovaTracker.setHandler(rewardRouter.address, true), "stakedNovaTracker.setHandler(rewardRouter)")
  // allow bonusNovaTracker to stake stakedNovaTracker
  await sendTxn(stakedNovaTracker.setHandler(bonusNovaTracker.address, true), "stakedNovaTracker.setHandler(bonusNovaTracker)")
  // allow rewardRouter to stake in bonusNovaTracker
  await sendTxn(bonusNovaTracker.setHandler(rewardRouter.address, true), "bonusNovaTracker.setHandler(rewardRouter)")
  // allow bonusNovaTracker to stake feeNovaTracker
  await sendTxn(bonusNovaTracker.setHandler(feeNovaTracker.address, true), "bonusNovaTracker.setHandler(feeNovaTracker)")
  await sendTxn(bonusNovaDistributor.setBonusMultiplier(10000), "bonusNovaDistributor.setBonusMultiplier")
  // allow rewardRouter to stake in feeNovaTracker
  await sendTxn(feeNovaTracker.setHandler(rewardRouter.address, true), "feeNovaTracker.setHandler(rewardRouter)")
  // allow stakedNovaTracker to stake esNova
  await sendTxn(esNova.setHandler(stakedNovaTracker.address, true), "esNova.setHandler(stakedNovaTracker)")
  // allow feeNovaTracker to stake bnNova
  await sendTxn(bnNova.setHandler(feeNovaTracker.address, true), "bnNova.setHandler(feeNovaTracker")
  // allow rewardRouter to burn bnNova
  await sendTxn(bnNova.setMinter(rewardRouter.address, true), "bnNova.setMinter(rewardRouter")

  // allow stakedNlpTracker to stake feeNlpTracker
  await sendTxn(feeNlpTracker.setHandler(stakedNlpTracker.address, true), "feeNlpTracker.setHandler(stakedNlpTracker)")
  // allow feeNlpTracker to stake nlp
  await sendTxn(nlp.setHandler(feeNlpTracker.address, true), "nlp.setHandler(feeNlpTracker)")

  // allow rewardRouter to stake in feeNlpTracker
  await sendTxn(feeNlpTracker.setHandler(rewardRouter.address, true), "feeNlpTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in stakedNlpTracker
  await sendTxn(stakedNlpTracker.setHandler(rewardRouter.address, true), "stakedNlpTracker.setHandler(rewardRouter)")

  await sendTxn(esNova.setHandler(rewardRouter.address, true), "esNova.setHandler(rewardRouter)")
  await sendTxn(esNova.setHandler(stakedNovaDistributor.address, true), "esNova.setHandler(stakedNovaDistributor)")
  await sendTxn(esNova.setHandler(stakedNlpDistributor.address, true), "esNova.setHandler(stakedNlpDistributor)")
  await sendTxn(esNova.setHandler(stakedNlpTracker.address, true), "esNova.setHandler(stakedNlpTracker)")
  await sendTxn(esNova.setHandler(novaVester.address, true), "esNova.setHandler(novaVester)")
  await sendTxn(esNova.setHandler(nlpVester.address, true), "esNova.setHandler(nlpVester)")

  await sendTxn(esNova.setMinter(novaVester.address, true), "esNova.setMinter(novaVester)")
  await sendTxn(esNova.setMinter(nlpVester.address, true), "esNova.setMinter(nlpVester)")

  await sendTxn(novaVester.setHandler(rewardRouter.address, true), "novaVester.setHandler(rewardRouter)")
  await sendTxn(nlpVester.setHandler(rewardRouter.address, true), "nlpVester.setHandler(rewardRouter)")

  await sendTxn(feeNovaTracker.setHandler(novaVester.address, true), "feeNovaTracker.setHandler(novaVester)")
  await sendTxn(stakedNlpTracker.setHandler(nlpVester.address, true), "stakedNlpTracker.setHandler(nlpVester)")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
