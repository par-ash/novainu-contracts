const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

async function getArbValues() {
  const batchSender = await contractAt("BatchSender", "0x4130eD70007Aa4e83E2adAdF29f9F0d1Dd584CEE")
  const token = await contractAt("Token", "0xaF698D5680917b4E1bfDaEbe6d50894043331907")
  const tokenDecimals = 18

  return { batchSender, token, tokenDecimals }
}

async function getAvaxValues() {
  const batchSender = await contractAt("BatchSender", "0xF0f929162751DD723fBa5b86A9B3C88Dc1D4957b")
  const token = await contractAt("Token", "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7")
  const tokenDecimals = 18

  return { batchSender, token, tokenDecimals }
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
  const wallet = { address: "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79" }
  const { batchSender, token, tokenDecimals } = await getValues()

  const totalAmount = "10000000000000000"
  const typeId = 1

  await sendTxn(token.approve(batchSender.address, totalAmount), "token.approve")
  await sendTxn(batchSender.sendAndEmit(token.address, [wallet.address], [totalAmount], typeId), "batchSender.sendAndEmit")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
