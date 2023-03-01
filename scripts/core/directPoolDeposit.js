const { deployContract, contractAt, sendTxn, callWithRetries } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const token = await contractAt("Token", "0x1a6863f6254308627254a14C06F20f8B952EF167")
  const router = await contractAt("Router", "0xb4a0F695620fC989FEc16990805365f7e9db4c27")
  // const amount = expandDecimals(3000, 6)
  const amount = "300000000000000000"
  //await sendTxn(token.approve(router.address, amount), "router.approve")
  await sendTxn(router.directPoolDeposit(token.address, amount, {gasLimit:3e9}), "router.directPoolDeposit", {gasLimit:3e9})
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
