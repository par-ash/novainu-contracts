const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals, bigNumberify } = require("../../test/shared/utilities")
const { LIST } = require("../../data/batchSend/list")

const {
  ARBITRUM_URL,
  ARBITRUM_PAYMENTS_KEY,
  AVAX_URL,
  AVAX_PAYMENTS_KEY,
} = require("../../env.json")

async function main() {
  const arbProvider = new ethers.providers.JsonRpcProvider(ARBITRUM_URL)
  const arbWallet = new ethers.Wallet(ARBITRUM_PAYMENTS_KEY).connect(arbProvider)

  const avaxProvider = new ethers.providers.JsonRpcProvider(AVAX_URL)
  const avaxWallet = new ethers.Wallet(AVAX_PAYMENTS_KEY).connect(avaxProvider)

  const list = LIST
  const usdc = await contractAt("Token", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", avaxWallet)
  const usdcDecimals = 6
  const nova = await contractAt("Token", "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4", arbWallet)
  const novaDecimals = 18
  const shouldSendTxn = true

  const minCount = 0
  let count = 0

  let totalUsdc = bigNumberify(0)
  let totalNova = bigNumberify(0)

  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (item.usdc && parseFloat(item.usdc) !== 0) {
      count++
      const amount = ethers.utils.parseUnits(item.usdc, usdcDecimals)
      totalUsdc = totalUsdc.add(amount)
      if (shouldSendTxn && count >= minCount) {
        await sendTxn(usdc.transfer(item.account, amount), `${count}: usdc.transfer(${item.account}, ${amount})`)
      }
    }
    if (item.nova && parseFloat(item.nova) !== 0) {
      count++
      const amount = ethers.utils.parseUnits(item.nova, novaDecimals)
      totalNova = totalNova.add(amount)
      if (shouldSendTxn && count >= minCount) {
        await sendTxn(nova.transfer(item.account, amount), `${count}: nova.transfer(${item.account}, ${amount})`)
      }
    }
  }

  console.log("total USDC", ethers.utils.formatUnits(totalUsdc, usdcDecimals))
  console.log("total NOVA", ethers.utils.formatUnits(totalNova, novaDecimals))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
