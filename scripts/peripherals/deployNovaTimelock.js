const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

const { AddressZero } = ethers.constants

async function runForArbitrum() {
  const admin = "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79"
  const rewardManager = { address: AddressZero }
  const buffer = 24 * 60 * 60
  const longBuffer = 7 * 24 * 60 * 60
  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }
  const mintReceiver = { address: AddressZero }
  const maxTokenSupply = expandDecimals("13250000", 18)

  const timelock = await deployContract("NovaTimelock", [
    admin,
    buffer,
    longBuffer,
    rewardManager.address,
    tokenManager.address,
    mintReceiver.address,
    maxTokenSupply
  ], "NovaTimelock", { gasLimit: 100000000 })
}

async function runForAvax() {
  const admin = "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79"
  const rewardManager = { address: ethers.constants.AddressZero }
  const buffer = 24 * 60 * 60
  const longBuffer = 7 * 24 * 60 * 60
  const tokenManager = { address: "0xe22a63EAd9A39F40fB759939E6FB9f9B93F310AA" }
  const mintReceiver = { address: AddressZero }
  const maxTokenSupply = expandDecimals("13250000", 18)

  const timelock = await deployContract("NovaTimelock", [
    admin,
    buffer,
    longBuffer,
    rewardManager.address,
    tokenManager.address,
    mintReceiver.address,
    maxTokenSupply
  ])
}

async function main() {
  if (network === "avax") {
    await runForAvax()
    return
  }

  await runForArbitrum()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
