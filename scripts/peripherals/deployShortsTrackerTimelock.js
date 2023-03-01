const {
  deployContract,
  contractAt,
  sendTxn,
  getFrameSigner
} = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units");
const { getArgumentForSignature } = require("typechain");

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

async function getAvaxValues() {
  return {
    handlers: [
      "0xfB5EaB03b1b71B72Fb369035843FfE754b7e8106", // X Shorts Tracker Keeper
    ]
  }
}

async function getArbValues() {
  return {
    handlers: [
      "0xfB5EaB03b1b71B72Fb369035843FfE754b7e8106", // X Shorts Tracker Keeper
    ]
  }
}

async function getValues() {
  if (network === "localhost") {
    return await getLocalhostValues()
  }

  if (network === "avax") {
    return await getAvaxValues()
  }

  if (network === "arbitrum" || network === "arbitrumTestnet") {
    return await getArbValues()
  }

  throw new Error("No values for network " + network)
}

async function main() {
  const signer = await getFrameSigner()

  const admin = "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79"
  const { handlers } = await getValues()

  const buffer = 60 // 60 seconds
  const updateDelay = 300 // 300 seconds, 5 minutes
  const maxAveragePriceChange = 20 // 0.2%
  let shortsTrackerTimelock = await deployContract("ShortsTrackerTimelock", [admin, buffer, updateDelay, maxAveragePriceChange])
  shortsTrackerTimelock = await contractAt("ShortsTrackerTimelock", shortsTrackerTimelock.address, signer)

  console.log("Setting handlers")
  for (const handler of handlers) {
    await sendTxn(
      shortsTrackerTimelock.setHandler(handler, true),
      `shortsTrackerTimelock.setHandler ${handler}`
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
