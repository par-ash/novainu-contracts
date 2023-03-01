const { getFrameSigner, deployContract, contractAt, sendTxn, readTmpAddresses, callWithRetries } = require("../shared/helpers")
const { bigNumberify, expandDecimals } = require("../../test/shared/utilities")
const { toChainlinkPrice } = require("../../test/shared/chainlink")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function getArbValues() {
  const positionContracts = [
    "0xA504E9c8E10b074e1Fa45615f90Fab9a28F1a2f2", // PositionRouter
    "0xc13382D15aB204a28BF229e7b25C859C134E14Ff" // PositionManager
  ]

  const { btc, eth, link, uni } = tokens
  const tokenArr = [btc, eth, link, uni]

  return { positionContracts, tokenArr }
}

async function getAvaxValues() {
  const positionContracts = [
    "0xffF6D276Bc37c61A23f06410Dce4A400f66420f8", // PositionRouter
    "0xA21B83E579f4315951bA658654c371520BDcB866" // PositionManager
  ]

  const { avax, eth, btc, btcb } = tokens
  const tokenArr = [avax, eth, btc, btcb]

  return { positionContracts, tokenArr }
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
  const { positionContracts, tokenArr } = await getValues()

  const tokenAddresses = tokenArr.map(t => t.address)
  const longSizes = tokenArr.map((token) => {
    if (!token.maxGlobalLongSize) {
      return bigNumberify(0)
    }

    return expandDecimals(token.maxGlobalLongSize, 30)
  })

  const shortSizes = tokenArr.map((token) => {
    if (!token.maxGlobalShortSize) {
      return bigNumberify(0)
    }

    return expandDecimals(token.maxGlobalShortSize, 30)
  })

  for (let i = 0; i < positionContracts.length; i++) {
    const positionContract = await contractAt("PositionManager", positionContracts[i])
    await sendTxn(positionContract.setMaxGlobalSizes(tokenAddresses, longSizes, shortSizes), "positionContract.setMaxGlobalSizes")
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
