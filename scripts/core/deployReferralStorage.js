const { getFrameSigner, deployContract, contractAt , sendTxn, readTmpAddresses, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function getArbValues() {
  const positionRouter = await contractAt("PositionRouter", "0xA504E9c8E10b074e1Fa45615f90Fab9a28F1a2f2")
  const positionManager = await contractAt("PositionManager", "0xc13382D15aB204a28BF229e7b25C859C134E14Ff")

  return { positionRouter, positionManager }
}

async function getAvaxValues() {
  const positionRouter = await contractAt("PositionRouter", "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79")
  const positionManager = await contractAt("PositionManager", "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79")

  return { positionRouter, positionManager }
}

async function getValues() {
  if (network === "arbitrum") {
    return getArbValues()
  }

  if (network === "arbitrumTestnet") {
    return getArbValues()
  }
  if (network === "avax") {
    return getAvaxValues()
  }
}

async function main() {
  const { positionRouter, positionManager } = await getValues()
  const referralStorage = await deployContract("ReferralStorage", [])
  //const referralStorage = await contractAt("ReferralStorage", await positionRouter.referralStorage())

  await sendTxn(positionRouter.setReferralStorage(referralStorage.address), "positionRouter.setReferralStorage")
  await sendTxn(positionManager.setReferralStorage(referralStorage.address), "positionManager.setReferralStorage")

  await sendTxn(referralStorage.setHandler(positionRouter.address, true), "referralStorage.setHandler(positionRouter)")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
