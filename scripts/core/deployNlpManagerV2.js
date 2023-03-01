const { deployContract, contractAt , sendTxn, writeTmpAddresses, callWithRetries } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")
const {getFrameSigner} = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function getArbValues() {
  const vault = { address: "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6" }
  const usdg = { address: "0x1181F0583be72AB7eB6b56055AF3C102fD956C5c" }
  const nlp = { address: "0xCd81FDa67eb7D9d23f98b81224CAEd25888b1233" }
  const shortsTracker = { address: "0xfB5EaB03b1b71B72Fb369035843FfE754b7e8106" }

  return { vault, usdg, nlp, shortsTracker }
}

async function getAvaxValues() {
  const vault = { address: "0x9ab2De34A33fB459b538c43f251eB825645e8595" }
  const usdg = { address: "0xc0253c3cC6aa5Ab407b5795a04c28fB063273894" }
  const nlp = { address: "0x01234181085565ed162a948b6a5e88758CD7c7b8" }
  const shortsTracker = { address: "0x9234252975484D75Fd05f3e4f7BdbEc61956D73a" }

  return { vault, usdg, nlp, shortsTracker }
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
  const { vault, usdg, nlp, shortsTracker } = await getValues()

  const cooldownDuration = 0
  const nlpManager = await deployContract("NlpManager", [vault.address, usdg.address, nlp.address, shortsTracker.address, cooldownDuration])

  await sendTxn(nlpManager.setInPrivateMode(true), "nlpManager.setInPrivateMode")

  writeTmpAddresses({
    nlpManager: nlpManager.address
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
