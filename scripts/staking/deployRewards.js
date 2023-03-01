const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const wallet = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const { AddressZero } = ethers.constants

  const weth = { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" }
  const nova = await deployContract("NOVA", []);
  const esNova = await deployContract("EsNOVA", []);
  const bnNova = await deployContract("MintableBaseToken", ["Bonus NOVA", "bnNOVA", 0]);
  const bnAlp = { address: AddressZero }
  const alp = { address: AddressZero }

  const stakedNovaTracker = await deployContract("RewardTracker", ["Staked NOVA", "sNOVA"])
  const stakedNovaDistributor = await deployContract("RewardDistributor", [esNova.address, stakedNovaTracker.address])
  await sendTxn(stakedNovaTracker.initialize([nova.address, esNova.address], stakedNovaDistributor.address), "stakedNovaTracker.initialize")
  await sendTxn(stakedNovaDistributor.updateLastDistributionTime(), "stakedNovaDistributor.updateLastDistributionTime")

  const bonusNovaTracker = await deployContract("RewardTracker", ["Staked + Bonus NOVA", "sbNOVA"])
  const bonusNovaDistributor = await deployContract("BonusDistributor", [bnNova.address, bonusNovaTracker.address])
  await sendTxn(bonusNovaTracker.initialize([stakedNovaTracker.address], bonusNovaDistributor.address), "bonusNovaTracker.initialize")
  await sendTxn(bonusNovaDistributor.updateLastDistributionTime(), "bonusNovaDistributor.updateLastDistributionTime")

  const feeNovaTracker = await deployContract("RewardTracker", ["Staked + Bonus + Fee NOVA", "sbfNOVA"])
  const feeNovaDistributor = await deployContract("RewardDistributor", [weth.address, feeNovaTracker.address])
  await sendTxn(feeNovaTracker.initialize([bonusNovaTracker.address, bnNova.address], feeNovaDistributor.address), "feeNovaTracker.initialize")
  await sendTxn(feeNovaDistributor.updateLastDistributionTime(), "feeNovaDistributor.updateLastDistributionTime")

  const feeNlpTracker = { address: AddressZero }
  const stakedNlpTracker = { address: AddressZero }

  const stakedAlpTracker = { address: AddressZero }
  const bonusAlpTracker = { address: AddressZero }
  const feeAlpTracker = { address: AddressZero }

  const nlpManager = { address: AddressZero }
  const nlp = { address: AddressZero }

  await sendTxn(stakedNovaTracker.setInPrivateTransferMode(true), "stakedNovaTracker.setInPrivateTransferMode")
  await sendTxn(stakedNovaTracker.setInPrivateStakingMode(true), "stakedNovaTracker.setInPrivateStakingMode")
  await sendTxn(bonusNovaTracker.setInPrivateTransferMode(true), "bonusNovaTracker.setInPrivateTransferMode")
  await sendTxn(bonusNovaTracker.setInPrivateStakingMode(true), "bonusNovaTracker.setInPrivateStakingMode")
  await sendTxn(bonusNovaTracker.setInPrivateClaimingMode(true), "bonusNovaTracker.setInPrivateClaimingMode")
  await sendTxn(feeNovaTracker.setInPrivateTransferMode(true), "feeNovaTracker.setInPrivateTransferMode")
  await sendTxn(feeNovaTracker.setInPrivateStakingMode(true), "feeNovaTracker.setInPrivateStakingMode")

  const rewardRouter = await deployContract("RewardRouter", [])

  await sendTxn(rewardRouter.initialize(
    nova.address,
    esNova.address,
    bnNova.address,
    bnAlp.address,
    nlp.address,
    alp.address,
    stakedNovaTracker.address,
    bonusNovaTracker.address,
    feeNovaTracker.address,
    feeNlpTracker.address,
    stakedNlpTracker.address,
    stakedAlpTracker.address,
    bonusAlpTracker.address,
    feeAlpTracker.address,
    nlpManager.address
  ), "rewardRouter.initialize")

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

  // mint esNova for distributors
  await sendTxn(esNova.setMinter(wallet.address, true), "esNova.setMinter(wallet)")
  await sendTxn(esNova.mint(stakedNovaDistributor.address, expandDecimals(50000 * 12, 18)), "esNova.mint(stakedNovaDistributor") // ~50,000 NOVA per month
  await sendTxn(stakedNovaDistributor.setTokensPerInterval("20667989410000000"), "stakedNovaDistributor.setTokensPerInterval") // 0.02066798941 esNova per second

  // mint bnNova for distributor
  await sendTxn(bnNova.setMinter(wallet.address, true), "bnNova.setMinter")
  await sendTxn(bnNova.mint(bonusNovaDistributor.address, expandDecimals(15 * 1000 * 1000, 18)), "bnNova.mint(bonusNovaDistributor)")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
