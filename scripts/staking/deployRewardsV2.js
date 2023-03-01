const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const admin = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const buffer = 60 * 60
  const rewardManager = await deployContract("RewardManager", [], "Reward Manager")
  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }
  const mintReceiver = { address: "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC" }
  const maxTokenSupply = expandDecimals("13250000", 18)

  const weth = await contractAt("Token", "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1")

  const nova = { address: "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4" }
  const esNova = { address: "0xF0c9E685e7C4299Be2dfc998e1A1802394A771c4" }
  const bnNova = { address: "0x95ee9b08e34DeedA10BDC1551bb2875A0aAE4Ef6" }
  const nlp = { address: "0xCd81FDa67eb7D9d23f98b81224CAEd25888b1233" }
  const stakedNovaTracker = { address: "0x5123a56A73f658Cd420eb362c0EaBeEFA0FAD315" }
  const bonusNovaTracker = { address: "0x9A36caDA2A590257773043095000314d743B0B28" }
  const feeNovaTracker = { address: "0xC52fA84109a67D82394515Db94e9aC16Eccb4BDE" }
  const feeNlpTracker = { address: "0xC52fA84109a67D82394515Db94e9aC16Eccb4BDE" }
  const stakedNlpTracker = { address: "0x1aDDD80E6039594eE970E5872D247bf0414C8903" }
  const nlpManager = { address: "0xb0eDB05514f7Dc86C62011dc8aB49b926cd05483" }
  const stakedNovaDistributor = { address: "0x5123a56A73f658Cd420eb362c0EaBeEFA0FAD315" }
  const stakedNlpDistributor = { address: "0x5123a56A73f658Cd420eb362c0EaBeEFA0FAD315" }

  const timelock = await deployContract("Timelock", [
    admin.address,
    buffer,
    rewardManager.address,
    tokenManager.address,
    mintReceiver.address,
    maxTokenSupply
  ])

  const vestingDuration = 365 * 24 * 60 * 60

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

  await rewardRouter.initialize(
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
    nlpManager.address,
    novaVester.address,
    nlpVester.address
  )

  await rewardManager.initialize(
    timelock.address,
    rewardRouter.address,
    nlpManager.address,
    stakedNovaTracker.address,
    bonusNovaTracker.address,
    feeNovaTracker.address,
    feeNlpTracker.address,
    stakedNlpTracker.address,
    stakedNovaDistributor.address,
    stakedNlpDistributor.address,
    esNova.address,
    bnNova.address,
    novaVester.address,
    nlpVester.address
  )

  // await rewardManager.updateEsNovaHandlers()
  // await rewardManager.enableRewardRouter()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
