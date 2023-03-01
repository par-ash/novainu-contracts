const { deployContract, contractAt, sendTxn, getFrameSigner } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

async function getArbValues() {
  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }

  return { tokenManager }
}

async function getAvaxValues() {
  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }

  return { tokenManager }
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

  const admin = "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79"
  const buffer = 24 * 60 * 60

  const { tokenManager } = await getValues()
  console.log(tokenManager.address);

  // const timelock = await deployContract("PriceFeedTimelock", [
  //   admin,
  //   buffer,
  //   tokenManager.address
  // ], "Timelock")
  const timelock = await contractAt("PriceFeedTimelock", "0x58A1519E0838436D1915864F37E92ED50d270669");

  const deployedTimelock = await contractAt("PriceFeedTimelock", timelock.address, signer)

  const signers = [
    "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79", // quat
    "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC", // coinflipcanada
    "0x14f3e34E232a234031A502C16E8873000A283C70", // G
    "0x80e0c70848a18E9117A0615b4116B3b0F78E463b", // kr
    "0x6091646D0354b03DD1e9697D33A7341d8C93a6F5" // xhiroz
  ]

  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i]
    console.log(signer)
    await sendTxn(deployedTimelock.setContractHandler(signer, true,{gasLimit: 3e7}), `deployedTimelock.setContractHandler(${signer})`)
  }

  const keepers = [
    "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" // X
  ]

  for (let i = 0; i < keepers.length; i++) {
    const keeper = keepers[i]
    await sendTxn(deployedTimelock.setKeeper(keeper, true), `deployedTimelock.setKeeper(${keeper})`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
