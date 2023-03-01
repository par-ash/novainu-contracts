const { getFrameSigner, deployContract, contractAt, sendTxn, writeTmpAddresses } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

async function getArbValues() {
  const nlp = { address: "0xCd81FDa67eb7D9d23f98b81224CAEd25888b1233" }
  const nlpManager = { address: "0xb0eDB05514f7Dc86C62011dc8aB49b926cd05483" }
  const stakedNlpTracker = await contractAt("RewardTracker", "0x1Dbe473223bDe8c3DA1A388d0CF34467BC4dd654")
  const feeNlpTracker = await contractAt("RewardTracker", "0xa29962a717C01A2819150983C7CCB69d93112E3f")

  return { nlp, nlpManager, stakedNlpTracker, feeNlpTracker }
}

async function getAvaxValues() {
  const nlp = { address: "0x01234181085565ed162a948b6a5e88758CD7c7b8" }
  const nlpManager = { address: "0xe1ae4d4b06A5Fe1fc288f6B4CD72f9F8323B107F" }
  const stakedNlpTracker = await contractAt("RewardTracker", "0x9e295B5B976a184B14aD8cd72413aD846C299660")
  const feeNlpTracker = await contractAt("RewardTracker", "0xd2D1162512F927a7e282Ef43a362659E4F2a728F")

  return { nlp, nlpManager, stakedNlpTracker, feeNlpTracker }
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
  const { nlp, nlpManager, stakedNlpTracker, feeNlpTracker } = await getValues()

  const timelock = await contractAt("Timelock", await stakedNlpTracker.gov(), signer)

  const stakedNlp = await deployContract("StakedNlp", [
    nlp.address,
    nlpManager.address,
    stakedNlpTracker.address,
    feeNlpTracker.address
  ])

  await sendTxn(timelock.signalSetHandler(stakedNlpTracker.address, stakedNlp.address, true), "timelock.signalSetHandler(stakedNlpTracker)")
  await sendTxn(timelock.signalSetHandler(feeNlpTracker.address, stakedNlp.address, true), "timelock.signalSetHandler(stakedNlpTracker)")

  // await deployContract("NlpBalance", [nlpManager.address, stakedNlpTracker.address])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
