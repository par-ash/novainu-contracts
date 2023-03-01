const { getFrameSigner, deployContract, contractAt , sendTxn, readTmpAddresses, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function getArbValues(signer) {
  const vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6")
  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  const router = await contractAt("Router", await vault.router(), signer)
  //console.log(tokens)positionRouter.setReferralStorage...
  const weth = await contractAt("WETH", tokens.nativeToken.address)
  const referralStorage = await contractAt("ReferralStorage", "0xf292096b6ab596bC9780b897c50a7D9c218c19B7")
  const shortsTracker = await contractAt("ShortsTracker", "0xc0528efA3308106F832954d92613Fdca94901940", signer)
  const depositFee = "30" // 0.3%
  const minExecutionFee = "100000000000000" // 0.0001 ETH

  return {
    vault,
    timelock,
    router,
    weth,
    referralStorage,
    shortsTracker,
    depositFee,
    minExecutionFee
  }
}

async function getAvaxValues(signer) {
  const vault = await contractAt("Vault", "0x9ab2De34A33fB459b538c43f251eB825645e8595")
  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  const router = await contractAt("Router", await vault.router(), signer)
  const weth = await contractAt("WETH", tokens.nativeToken.address)
  const referralStorage = await contractAt("ReferralStorage", "0x827ED045002eCdAbEb6e2b0d1604cf5fC3d322F8")
  const shortsTracker = await contractAt("ShortsTracker", "0x9234252975484D75Fd05f3e4f7BdbEc61956D73a", signer)
  const depositFee = "30" // 0.3%
  const minExecutionFee = "20000000000000000" // 0.02 AVAX

  return {
    vault,
    timelock,
    router,
    weth,
    referralStorage,
    shortsTracker,
    depositFee,
    minExecutionFee
  }
}

async function getValues(signer) {
  if (network === "arbitrum") {
    return getArbValues(signer)
  }
  if (network === "arbitrumTestnet") {
    return getArbValues(signer)
  }

  if (network === "avax") {
    return getAvaxValues(signer)
  }
}

async function main() {
  const signer = await getFrameSigner()

  const {
    vault,
    timelock,
    router,
    weth,
    shortsTracker,
    depositFee,
    minExecutionFee,
    referralStorage
  } = await getValues(signer)

  const referralStorageGov = await contractAt("Timelock", "0x64C322f4008B7EA424905822DaD2C041C1CAbf44")
  console.log(referralStorageGov.address)
  const positionRouterArgs = [vault.address, router.address, weth.address, shortsTracker.address, depositFee, minExecutionFee]
  const positionRouter = await contractAt("PositionRouter", "0xA504E9c8E10b074e1Fa45615f90Fab9a28F1a2f2")
  console.log(positionRouter.address)
  //await sendTxn(positionRouter.setReferralStorage(referralStorage.address), "positionRouter.setReferralStorage")
  //await sendTxn(referralStorageGov.signalSetHandler(referralStorage.address, positionRouter.address, true, {gasLimit:3e11}), "referralStorage.signalSetHandler(positionRouter)")

  await sendTxn(shortsTracker.setHandler(positionRouter.address, true, {gasLimit:3e11}), "shortsTracker.setHandler(positionRouter)")

  await sendTxn(router.addPlugin(positionRouter.address), "router.addPlugin")

  await sendTxn(positionRouter.setDelayValues(1, 180, 30 * 60), "positionRouter.setDelayValues")
  await sendTxn(timelock.setContractHandler(positionRouter.address, true), "timelock.setContractHandler(positionRouter)")

  await sendTxn(positionRouter.setGov(await vault.gov()), "positionRouter.setGov", {gasLimit: 30000})
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
