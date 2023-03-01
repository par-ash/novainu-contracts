const { getFrameSigner, deployContract, contractAt , sendTxn, readTmpAddresses, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function getArbValues(signer) {
  const { btc, eth, usdc, link, uni, usdt, mim, frax, dai } = tokens
  const tokenArr = [btc, eth, usdc, link, uni, usdt, mim, frax, dai]
  const fastPriceTokens = [btc, eth, link, uni]

  const priceFeedTimelock = { address: "0x58A1519E0838436D1915864F37E92ED50d270669" }

  const updater1 = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const updater2 = { address: "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC" }
  const keeper1 = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const keeper2 = { address: "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC" }
  const updaters = [updater1.address, updater2.address, keeper1.address, keeper2.address]

  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }

  const positionRouter = await contractAt("PositionRouter", "0xA504E9c8E10b074e1Fa45615f90Fab9a28F1a2f2")

  //const fastPriceEvents = await contractAt("FastPriceEvents", "0x4530b7DE1958270A2376be192a24175D795e1b07", signer)
  const fastPriceEvents = await deployContract("FastPriceEvents", [])

  const chainlinkFlags = { address: "0x4da69F028a5790fCCAfe81a75C0D24f46ceCDd69" } //Arbitrum Goerli testnet

  return {
    fastPriceTokens,
    fastPriceEvents,
    tokenManager,
    positionRouter,
    chainlinkFlags,
    tokenArr,
    updaters,
    priceFeedTimelock
  }
}

async function getAvaxValues(signer) {
  const { avax, btc, btcb, eth, mim, usdce, usdc } = tokens
  const tokenArr = [avax, btc, btcb, eth, mim, usdce, usdc]
  const fastPriceTokens = [avax, btc, btcb, eth]

  const priceFeedTimelock = { address: "0xCa8b5F2fF7B8d452bE8972B44Dc026Be96b97228" }

  const updater1 = { address: "0x2b249Bec7c3A142431b67e63A1dF86F974FAF3aa" }
  const updater2 = { address: "0x63ff41E44d68216e716d236E2ECdd5272611D835" }
  const keeper1 = { address: "0x5e0338CE6597FCB9404d69F4286194A60aD442b7" }
  const keeper2 = { address: "0x8CD98FF48831aa8864314ae8f41337FaE9941C8D" }
  const updaters = [updater1.address, updater2.address, keeper1.address, keeper2.address]

  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }

  const positionRouter = await contractAt("PositionRouter", "0xA504E9c8E10b074e1Fa45615f90Fab9a28F1a2f2")

  const fastPriceEvents = await deployContract("FastPriceEvents", [])
  //const fastPriceEvents = await contractAt("FastPriceEvents", "0x02b7023D43bc52bFf8a0C54A9F2ecec053523Bf6", signer)

  return {
    fastPriceTokens,
    fastPriceEvents,
    tokenManager,
    positionRouter,
    tokenArr,
    updaters,
    priceFeedTimelock
  }
}

async function getValues(signer) {
  if (network === "arbitrum" || network === "arbitrumTestnet") {
    return getArbValues(signer)
  }

  if (network === "avax") {
    return getAvaxValues(signer)
  }
}

async function main() {
  const signer = await getFrameSigner()
  const deployer = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }

  const {
    fastPriceTokens,
    fastPriceEvents,
    tokenManager,
    positionRouter,
    chainlinkFlags,
    tokenArr,
    updaters,
    priceFeedTimelock
  } = await getValues(signer)

  const signers = [
    "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC", // coinflipcanada
    "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79", // G Account 1
    "0x14f3e34E232a234031A502C16E8873000A283C70", // G Account 2
    "0x80e0c70848a18E9117A0615b4116B3b0F78E463b", // kr
    "0x4DB71F3246a0C46DaE0FD1d55E36dd12262367A1", // quat
    "0x6091646D0354b03DD1e9697D33A7341d8C93a6F5", // xhiroz
    "0x45e48668F090a3eD1C7961421c60Df4E66f693BD", // Dovey
    "0x881690382102106b00a99E3dB86056D0fC71eee6", // Han Wen
    "0x2e5d207a4c0f7e7c52f6622dcc6eb44bc0fe1a13" // Krunal Amin
  ]

  if (fastPriceTokens.find(t => !t.fastPricePrecision)) {
    throw new Error("Invalid price precision")
  }

  if (fastPriceTokens.find(t => !t.maxCumulativeDeltaDiff)) {
    throw new Error("Invalid price maxCumulativeDeltaDiff")
  }

  const secondaryPriceFeed = await deployContract("FastPriceFeed", [
    5 * 60, // _priceDuration
    60 * 60, // _maxPriceUpdateDelay
    1, // _minBlockInterval
    250, // _maxDeviationBasisPoints
    fastPriceEvents.address, // _fastPriceEvents
    deployer.address, // _tokenManager
    positionRouter.address
  ])

  const vaultPriceFeed = await contractAt("VaultPriceFeed", "0xdEE8bF56CC2abA13E31C6213618A6b82f26a53F5")

  await sendTxn(vaultPriceFeed.setMaxStrictPriceDeviation(expandDecimals(1, 28)), "vaultPriceFeed.setMaxStrictPriceDeviation") // 0.01 USD
  await sendTxn(vaultPriceFeed.setPriceSampleSpace(1), "vaultPriceFeed.setPriceSampleSpace")
  await sendTxn(vaultPriceFeed.setSecondaryPriceFeed(secondaryPriceFeed.address), "vaultPriceFeed.setSecondaryPriceFeed")
  await sendTxn(vaultPriceFeed.setIsAmmEnabled(false), "vaultPriceFeed.setIsAmmEnabled")

  if (chainlinkFlags) {
    await sendTxn(vaultPriceFeed.setChainlinkFlags(chainlinkFlags.address), "vaultPriceFeed.setChainlinkFlags")
  }

  for (const [i, tokenItem] of tokenArr.entries()) {
    if (tokenItem.spreadBasisPoints === undefined) { continue }
    await sendTxn(vaultPriceFeed.setSpreadBasisPoints(
      tokenItem.address, // _token
      tokenItem.spreadBasisPoints // _spreadBasisPoints
    ), `vaultPriceFeed.setSpreadBasisPoints(${tokenItem.name}) ${tokenItem.spreadBasisPoints}`)
  }

  for (const token of tokenArr) {
    await sendTxn(vaultPriceFeed.setTokenConfig(
      token.address, // _token
      token.priceFeed, // _priceFeed
      token.priceDecimals, // _priceDecimals
      token.isStrictStable // _isStrictStable
    ), `vaultPriceFeed.setTokenConfig(${token.name}) ${token.address} ${token.priceFeed}`)
  }

  await sendTxn(secondaryPriceFeed.initialize(1, signers, updaters), "secondaryPriceFeed.initialize")
  await sendTxn(secondaryPriceFeed.setTokens(fastPriceTokens.map(t => t.address), fastPriceTokens.map(t => t.fastPricePrecision)), "secondaryPriceFeed.setTokens")
  await sendTxn(secondaryPriceFeed.setVaultPriceFeed(vaultPriceFeed.address), "secondaryPriceFeed.setVaultPriceFeed")
  await sendTxn(secondaryPriceFeed.setMaxTimeDeviation(60 * 60), "secondaryPriceFeed.setMaxTimeDeviation")
  await sendTxn(secondaryPriceFeed.setSpreadBasisPointsIfInactive(50), "secondaryPriceFeed.setSpreadBasisPointsIfInactive")
  await sendTxn(secondaryPriceFeed.setSpreadBasisPointsIfChainError(500), "secondaryPriceFeed.setSpreadBasisPointsIfChainError")
  await sendTxn(secondaryPriceFeed.setMaxCumulativeDeltaDiffs(fastPriceTokens.map(t => t.address), fastPriceTokens.map(t => t.maxCumulativeDeltaDiff)), "secondaryPriceFeed.setMaxCumulativeDeltaDiffs")
  await sendTxn(secondaryPriceFeed.setPriceDataInterval(1 * 60), "secondaryPriceFeed.setPriceDataInterval")

  await sendTxn(positionRouter.setPositionKeeper(secondaryPriceFeed.address, true), "positionRouter.setPositionKeeper(secondaryPriceFeed)")
  await sendTxn(fastPriceEvents.setIsPriceFeed(secondaryPriceFeed.address, true), "fastPriceEvents.setIsPriceFeed")

  await sendTxn(vaultPriceFeed.setGov(priceFeedTimelock.address), "vaultPriceFeed.setGov")
  await sendTxn(secondaryPriceFeed.setGov(priceFeedTimelock.address), "secondaryPriceFeed.setGov")
  await sendTxn(secondaryPriceFeed.setTokenManager(tokenManager.address), "secondaryPriceFeed.setTokenManager")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
