const { deployContract, contractAt, sendTxn, getFrameSigner } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('../core/tokens')[network];

const { AddressZero } = ethers.constants

async function getArbValues() {
  const { nativeToken } = tokens
  const nlp = { address: "0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258" }
  const feeNlpTracker = { address: "0x4e971a87900b931fF39d1Aad67697F49835400b6" }
  const stakedNlpTracker = { address: "0x1aDDD80E6039594eE970E5872D247bf0414C8903" }
  const nlpManager = { address: "0x3963FfC9dff443c2A94f21b129D429891E32ec18" }

  return { nativeToken, nlp, feeNlpTracker, stakedNlpTracker, nlpManager }
}

async function getAvaxValues() {
  const { nativeToken } = tokens
  const nlp = { address: "0x01234181085565ed162a948b6a5e88758CD7c7b8" }
  const nlpManager = { address: "0xe1ae4d4b06A5Fe1fc288f6B4CD72f9F8323B107F" }
  const stakedNlpTracker = await contractAt("RewardTracker", "0x9e295B5B976a184B14aD8cd72413aD846C299660")
  const feeNlpTracker = await contractAt("RewardTracker", "0xd2D1162512F927a7e282Ef43a362659E4F2a728F")


  return { nativeToken, nlp, feeNlpTracker, stakedNlpTracker, nlpManager }
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
  const { nativeToken, nlp, feeNlpTracker, stakedNlpTracker, nlpManager } = await getValues()

  const rewardRouter = await deployContract("RewardRouterV2", [])
  await sendTxn(rewardRouter.initialize(
    nativeToken.address, // _weth
    AddressZero, // _nova
    AddressZero, // _esNova
    AddressZero, // _bnNova
    nlp.address, // _nlp
    AddressZero, // _stakedNovaTracker
    AddressZero, // _bonusNovaTracker
    AddressZero, // _feeNovaTracker
    feeNlpTracker.address, // _feeNlpTracker
    stakedNlpTracker.address, // _stakedNlpTracker
    nlpManager.address, // _nlpManager
    AddressZero, // _novaVester
    AddressZero // nlpVester
  ), "rewardRouter.initialize")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
