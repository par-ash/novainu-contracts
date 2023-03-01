const { deployContract, contractAt, sendTxn, signers, updateTokensPerInterval } = require("../shared/helpers")
const { expandDecimals, bigNumberify } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

const shouldSendTxn = true

const monthlyEsNovaForNlpOnArb = expandDecimals(toInt("25,000"), 18)
const monthlyEsNovaForNlpOnAvax = expandDecimals(toInt("14,680"), 18)

async function getStakedAmounts() {
  const arbStakedNovaTracker = await contractAt("RewardTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4", signers.arbitrum)
  const arbStakedNovaAndEsNova =await arbStakedNovaTracker.totalSupply()

  const avaxStakedNovaTracker = await contractAt("RewardTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4", signers.avax)
  const avaxStakedNovaAndEsNova =await avaxStakedNovaTracker.totalSupply()

  return {
    arbStakedNovaAndEsNova,
    avaxStakedNovaAndEsNova
  }
}

async function getArbValues() {
  const novaRewardTracker = await contractAt("RewardTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4")
  const nlpRewardTracker = await contractAt("RewardTracker", "0x1aDDD80E6039594eE970E5872D247bf0414C8903")
  const tokenDecimals = 18
  const monthlyEsNovaForNlp = monthlyEsNovaForNlpOnArb

  return { tokenDecimals, novaRewardTracker, nlpRewardTracker, monthlyEsNovaForNlp }
}

async function getAvaxValues() {
  const novaRewardTracker = await contractAt("RewardTracker", "0x2bD10f8E93B3669b6d42E74eEedC65dd1B0a1342")
  const nlpRewardTracker = await contractAt("RewardTracker", "0x9e295B5B976a184B14aD8cd72413aD846C299660")
  const tokenDecimals = 18
  const monthlyEsNovaForNlp = monthlyEsNovaForNlpOnAvax

  return { tokenDecimals, novaRewardTracker, nlpRewardTracker, monthlyEsNovaForNlp }
}

function getValues() {
  if (network === "arbitrum") {
    return getArbValues()
  }

  if (network === "avax") {
    return getAvaxValues()
  }
}

function toInt(value) {
  return parseInt(value.replaceAll(",", ""))
}

async function main() {
  const { arbStakedNovaAndEsNova, avaxStakedNovaAndEsNova } = await getStakedAmounts()
  const { tokenDecimals, novaRewardTracker, nlpRewardTracker, monthlyEsNovaForNlp } = await getValues()

  const stakedAmounts = {
    arbitrum: {
      total: arbStakedNovaAndEsNova
    },
    avax: {
      total: avaxStakedNovaAndEsNova
    }
  }

  let totalStaked = bigNumberify(0)

  for (const net in stakedAmounts) {
    totalStaked = totalStaked.add(stakedAmounts[net].total)
  }

  const totalEsNovaRewards = expandDecimals(50000, tokenDecimals)
  const secondsPerMonth = 28 * 24 * 60 * 60

  const novaRewardDistributor = await contractAt("RewardDistributor", await novaRewardTracker.distributor())

  const novaCurrentTokensPerInterval = await novaRewardDistributor.tokensPerInterval()
  const novaNextTokensPerInterval = totalEsNovaRewards.mul(stakedAmounts[network].total).div(totalStaked).div(secondsPerMonth)
  const novaDelta = novaNextTokensPerInterval.sub(novaCurrentTokensPerInterval).mul(10000).div(novaCurrentTokensPerInterval)

  console.log("novaCurrentTokensPerInterval", novaCurrentTokensPerInterval.toString())
  console.log("novaNextTokensPerInterval", novaNextTokensPerInterval.toString(), `${novaDelta.toNumber() / 100.00}%`)

  const nlpRewardDistributor = await contractAt("RewardDistributor", await nlpRewardTracker.distributor())

  const nlpCurrentTokensPerInterval = await nlpRewardDistributor.tokensPerInterval()
  const nlpNextTokensPerInterval = monthlyEsNovaForNlp.div(secondsPerMonth)

  console.log("nlpCurrentTokensPerInterval", nlpCurrentTokensPerInterval.toString())
  console.log("nlpNextTokensPerInterval", nlpNextTokensPerInterval.toString())

  if (shouldSendTxn) {
    await updateTokensPerInterval(novaRewardDistributor, novaNextTokensPerInterval, "novaRewardDistributor")
    await updateTokensPerInterval(nlpRewardDistributor, nlpNextTokensPerInterval, "nlpRewardDistributor")
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
