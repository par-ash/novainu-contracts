const { deployContract, contractAt, sendTxn, getFrameSigner } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

async function getArbValues() {
  const vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6")
  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }
  const nlpManager = { address: "0xb0eDB05514f7Dc86C62011dc8aB49b926cd05483" }
  const rewardRouter = { address: "0x0bfB9281698035698C814F2Ac8Ae6578cb0795e0" }

  const positionRouter = { address: "0xA504E9c8E10b074e1Fa45615f90Fab9a28F1a2f2" }
  const positionManager = { address: "0xc13382D15aB204a28BF229e7b25C859C134E14Ff" }
  const nova = { address: "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4" }

  return { vault, tokenManager, nlpManager, rewardRouter, positionRouter, positionManager, nova }
}

async function getAvaxValues() {
  const vault = await contractAt("Vault", "0x9ab2De34A33fB459b538c43f251eB825645e8595")
  const tokenManager = { address: "0x8b25Ba1cAEAFaB8e9926fabCfB6123782e3B4BC2" }
  const nlpManager = { address: "0xD152c7F25db7F4B95b7658323c5F33d176818EE4" }
  const rewardRouter = { address: "0xB70B91CE0771d3f4c81D87660f71Da31d48eB3B3" }

  const positionRouter = { address: "0xffF6D276Bc37c61A23f06410Dce4A400f66420f8" }
  const positionManager = { address: "0xA21B83E579f4315951bA658654c371520BDcB866" }
  const nova = { address: "0x62edc0692BD897D2295872a9FFCac5425011c661" }

  return { vault, tokenManager, nlpManager, rewardRouter, positionRouter, positionManager, nova }
}

async function getValues() {
  if (network === "arbitrum" || network === "arbitrumTestnet") {
    return getArbValues()
  }

  if (network === "avax") {
    return getAvaxValues()
  }
}

async function main() {
  const signer = await getFrameSigner()

  const admin = "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79"
  const buffer = 24 * 60 * 60
  const maxTokenSupply = expandDecimals("13250000", 18)

  const { vault, tokenManager, nlpManager, rewardRouter, positionRouter, positionManager, nova } = await getValues()
  const mintReceiver = tokenManager

  const timelock = await deployContract("Timelock", [
    admin, // admin
    buffer, // buffer
    tokenManager.address, // tokenManager
    mintReceiver.address, // mintReceiver
    nlpManager.address, // nlpManager
    rewardRouter.address, // rewardRouter
    maxTokenSupply, // maxTokenSupply
    10, // marginFeeBasisPoints 0.1%
    500 // maxMarginFeeBasisPoints 5%
  ], "Timelock")

  const deployedTimelock = await contractAt("Timelock", timelock.address, signer)

  await sendTxn(deployedTimelock.setShouldToggleIsLeverageEnabled(true), "deployedTimelock.setShouldToggleIsLeverageEnabled(true)")
  await sendTxn(deployedTimelock.setContractHandler(positionRouter.address, true), "deployedTimelock.setContractHandler(positionRouter)")
  await sendTxn(deployedTimelock.setContractHandler(positionManager.address, true), "deployedTimelock.setContractHandler(positionManager)")

  // // update gov of vault
  // const vaultGov = await contractAt("Timelock", await vault.gov(), signer)

  // await sendTxn(vaultGov.signalSetGov(vault.address, deployedTimelock.address), "vaultGov.signalSetGov")
  // await sendTxn(deployedTimelock.signalSetGov(vault.address, vaultGov.address), "deployedTimelock.signalSetGov(vault)")

  const handlers = [
    "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC", // coinflipcanada
    "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79", // G
    "0xfb481D70f8d987c1AE3ADc90B7046e39eb6Ad64B", // kr
    "0x99Aa3D1b3259039E8cB4f0B33d0Cfd736e1Bf49E", // quat
    "0x6091646D0354b03DD1e9697D33A7341d8C93a6F5" // xhiroz
  ]

  for (let i = 0; i < handlers.length; i++) {
    const handler = handlers[i]
    await sendTxn(deployedTimelock.setContractHandler(handler, true), `deployedTimelock.setContractHandler(${handler})`)
  }

  const keepers = [
    "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" // X
  ]

  for (let i = 0; i < keepers.length; i++) {
    const keeper = keepers[i]
    await sendTxn(deployedTimelock.setKeeper(keeper, true), `deployedTimelock.setKeeper(${keeper})`)
  }

  await sendTxn(deployedTimelock.signalApprove(nova.address, admin, "1000000000000000000"), "deployedTimelock.signalApprove")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
