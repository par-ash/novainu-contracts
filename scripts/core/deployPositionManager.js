const { getFrameSigner, deployContract, contractAt , sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")
const { errors } = require("../../test/core/Vault/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

const depositFee = 30 // 0.3%

async function getArbValues(signer) {
  const vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6", signer)
  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  const router = await contractAt("Router", await vault.router(), signer)
  const shortsTracker = await contractAt("ShortsTracker", "0xc0528efA3308106F832954d92613Fdca94901940", signer)
  const weth = await contractAt("WETH", tokens.nativeToken.address)
  const orderBook = await contractAt("OrderBook", "0xfC43F371792FCdD022cB0a6160DB0d7AAA3c89dE", signer)
  const PositionRouter = await contractAt("PositionRouter", "0xA504E9c8E10b074e1Fa45615f90Fab9a28F1a2f2", signer)
  const referralStorage = await contractAt("ReferralStorage", "0xf292096b6ab596bC9780b897c50a7D9c218c19B7", signer)

  const orderKeepers = [
    { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" },
    { address: "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC" }
  ]
  const liquidators = [
    { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  ]

  const partnerContracts = [
    "0x80e0c70848a18E9117A0615b4116B3b0F78E463b", // Vovo ETH up vault
    "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC", // Vovo ETH down vault
    "0x14f3e34E232a234031A502C16E8873000A283C70", // Vovo BTC up vault
    "0x4DB71F3246a0C46DaE0FD1d55E36dd12262367A1", // Vovo BTC down vault
    "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79", // Vovo NLP ETH up vault
    "0x0FAE768Ef2191fDfCb2c698f691C49035A53eF0f", // Vovo NLP ETH down vault
    "0x2b8E28667A29A5Ab698b82e121F2b9Edd9271e93", // Vovo NLP BTC up vault
    "0x46d6dEE922f1d2C6421895Ba182120C784d986d3", // Vovo NLP BTC down vault
    "0x3327a5F041E821f476E00572ee0862fbcaa32993", // Jones ETH Hedging
    "0x2F9980d6fb25bD972196B19E243e36Dbde60618B", // Jones gOHM Hedging
    "0xC75417CB103D7008eCb07aa6fbf214eE2c127901", // Jones DPX Hedging
    "0x37a86cB53981CC762709B2c402B0F790D58F95BF", // Jones rDPX Hedging
  ]

  return { vault, timelock, router, shortsTracker, weth, depositFee, orderBook, referralStorage, orderKeepers, liquidators, partnerContracts }
}

async function getAvaxValues(signer) {
  const vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6")
  const timelock = await contractAt("Timelock", await vault.gov(), signer)
  const router = await contractAt("Router", await vault.router(), signer)
  const shortsTracker = await contractAt("ShortsTracker", "0xc0528efA3308106F832954d92613Fdca94901940", signer)
  const weth = await contractAt("WETH", tokens.nativeToken.address)
  const orderBook = await contractAt("OrderBook", "0xfC43F371792FCdD022cB0a6160DB0d7AAA3c89dE")
  const referralStorage = await contractAt("ReferralStorage", "0xf292096b6ab596bC9780b897c50a7D9c218c19B7")

  const orderKeepers = [
    { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" },
    { address: "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC" }
  ]
  const liquidators = [
    { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  ]

  const partnerContracts = []

  return { vault, timelock, router, shortsTracker, weth, depositFee, orderBook, referralStorage, orderKeepers, liquidators, partnerContracts }
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
    //positionManagerAddress,
    vault,
    timelock,
    router,
    shortsTracker,
    weth,
    depositFee,
    orderBook,
    referralStorage,
    orderKeepers,
    liquidators,
    partnerContracts
  } = await getValues(signer)

  console.log("abc")
  let positionManager = await contractAt("PositionManager", "0xc13382D15aB204a28BF229e7b25C859C134E14Ff")
  // if (positionManagerAddress) {
  //   console.log("Using position manager at", positionManagerAddress.address)
  //   positionManager = await contractAt("PositionManager", positionManagerAddress.address)
  // } else {
  //   console.log("Deploying new position manager")
  //   const positionManagerArgs = [vault.address, router.address, shortsTracker.address, weth.address, depositFee, orderBook.address]
  //   positionManager = await deployContract("PositionManager", positionManagerArgs)
  // }

  console.log(referralStorage.address)
  // positionManager only reads from referralStorage so it does not need to be set as a handler of referralStorage
  /*
  if ((await positionManager.referralStorage()).toLowerCase() != referralStorage.address.toLowerCase()) {
    await sendTxn(positionManager.setReferralStorage(referralStorage.address, {gasLimit:3e13}), "positionManager.setReferralStorage", {gasLimit:3e13})
  }
  console.log("abceee")
  if (await positionManager.shouldValidateIncreaseOrder()) {
    console.log("positionManager.shouldValidateIncreaseOrder()")
    await sendTxn(positionManager.setShouldValidateIncreaseOrder(false), "positionManager.setShouldValidateIncreaseOrder(false)")
  }
  console.log("llllllooollll");
  for (let i = 0; i < orderKeepers.length; i++) {
    console.log("orderKeepers")
    const orderKeeper = orderKeepers[i]
    if (!(await positionManager.isOrderKeeper(orderKeeper.address))) {
      console.log("positionManager.isOrderKeeper")
      await sendTxn(positionManager.setOrderKeeper(orderKeeper.address, true), "positionManager.setOrderKeeper(orderKeeper)")
    }
  }

  for (let i = 0; i < liquidators.length; i++) {
    console.log("liquidators")
    const liquidator = liquidators[i]
    if (!(await positionManager.isLiquidator(liquidator.address))) {
      console.log("positionManager.isLiquidator")
      await sendTxn(positionManager.setLiquidator(liquidator.address, true), "positionManager.setLiquidator(liquidator)")
    }
  } */

  let han = await timelock.isHandler[positionManager.address];
  console.log("han: {}",han);
  // if (!han) {
  //   console.log("timelock.isHandler")
  //   await sendTxn(timelock.setContractHandler(positionManager.address, true, {gasLimit:3e13}), "timelock.setContractHandler(positionManager)", {gasLimit:3e13})
  // }
  han = await vault.isLiquidator(positionManager.address);
  // if (!(han)) {
  //   console.log("vault.isLiquidator")
  //   await sendTxn(timelock.setLiquidator(vault.address, positionManager.address, true, {gasLimit:3e14}), "timelock.setLiquidator(vault, positionManager, true)", {gasLimit:3e14})
  // }
  if (!(await shortsTracker.isHandler(positionManager.address))) {
    console.log("shortsTracker.isHandler")
    await sendTxn(shortsTracker.setHandler(positionManager.address, true, {gasLimit:3e13}), "shortsTracker.setContractHandler(positionManager.address, true)")
  }
  if (!(await router.plugins(positionManager.address))) {
    console.log("router.plugins")
    await sendTxn(router.addPlugin(positionManager.address), "router.addPlugin(positionManager)")
  }

  for (let i = 0; i < partnerContracts.length; i++) {
    console.log("partnerContracts.length")
    const partnerContract = partnerContracts[i]
    if (!(await positionManager.isPartner(partnerContract))) {
      console.log("positionManager.isPartner")
      await sendTxn(positionManager.setPartner(partnerContract, true), "positionManager.setPartner(partnerContract)")
    }
  }

  if ((await positionManager.gov()) != (await vault.gov())) {
    console.log("positionManager.gov")
    await sendTxn(positionManager.setGov(await vault.gov()), "positionManager.setGov")
  }

  console.log("done.")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
