const { contractAt , sendTxn, callWithRetries } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const router = await callWithRetries(contractAt, ["Router", "0xb4a0F695620fC989FEc16990805365f7e9db4c27"])

  await sendTxn(callWithRetries(router.addPlugin.bind(router), [
    "0xfC43F371792FCdD022cB0a6160DB0d7AAA3c89dE"
  ]), "router.addPlugin")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
