const { deployContract, contractAt, sendTxn, readCsv } = require("../shared/helpers")
const { expandDecimals, bigNumberify } = require("../../test/shared/utilities")

const path = require('path')
const fs = require('fs')
const parse = require('csv-parse')

const inputDir = path.resolve(__dirname, "../..") + "/data/bonds/"

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

const inputFile = inputDir + "2022-09-14_transfers.csv"
const shouldSendTxns = true

async function getArbValues() {
  const esNova = await contractAt("EsNOVA", "0xf42Ae1D54fd613C9bb14810b0588FaAa09a426cA")
  const esNovaBatchSender = await contractAt("EsNovaBatchSender", "0xc3828fa579996090Dc7767E051341338e60207eF")

  const vestWithNovaOption = "0x544a6ec142Aa9A7F75235fE111F61eF2EbdC250a"
  const vestWithNlpOption = "0x9d8f6f6eE45275A5Ca3C6f6269c5622b1F9ED515"

  const novaVester = await contractAt("Vester", "0x199070DDfd1CFb69173aa2F7e20906F26B363004")
  const nlpVester = await contractAt("Vester", "0xA75287d2f8b217273E7FCD7E86eF07D33972042E")

  return { esNova, esNovaBatchSender, vestWithNovaOption, vestWithNlpOption, novaVester, nlpVester }
}

async function getAvaxValues() {
  const esNova = await contractAt("EsNOVA", "0xFf1489227BbAAC61a9209A08929E4c2a526DdD17")
  const esNovaBatchSender = await contractAt("EsNovaBatchSender", "0xc9baFef924159138697e72899a2753a3Dc8D1F4d")
  const vestWithNovaOption = "0x171a321A78dAE0CDC0Ba3409194df955DEEcA746"
  const vestWithNlpOption = "0x28863Dd19fb52DF38A9f2C6dfed40eeB996e3818"

  const novaVester = await contractAt("Vester", "0x472361d3cA5F49c8E633FB50385BfaD1e018b445")
  const nlpVester = await contractAt("Vester", "0x62331A7Bd1dfB3A7642B7db50B5509E57CA3154A")

  return { esNova, esNovaBatchSender, vestWithNovaOption, vestWithNlpOption, novaVester, nlpVester }
}

async function main() {
  const wallet = { address: "0x5F799f365Fa8A2B60ac0429C48B153cA5a6f0Cf8" }

  const values = network === "arbitrum" ? await getArbValues() : await getAvaxValues()
  const { esNova, esNovaBatchSender, vestWithNovaOption, vestWithNlpOption, novaVester, nlpVester } = values

  const txns = await readCsv(inputFile)
  console.log("processing list", txns.length)

  const vestWithNovaAccounts = []
  const vestWithNovaAmounts = []

  const vestWithNlpAccounts = []
  const vestWithNlpAmounts = []

  let totalEsNova = bigNumberify(0)

  for (let i = 0; i < txns.length; i++) {
    const txn = txns[i]
    if (txn.Method !== "Transfer") {
      continue
    }

    const amount = ethers.utils.parseUnits(txn.Quantity, 18)

    if (txn.To.toLowerCase() === vestWithNovaOption.toLowerCase()) {
      vestWithNovaAccounts.push(txn.From)
      vestWithNovaAmounts.push(amount)
      totalEsNova = totalEsNova.add(amount)
    }

    if (txn.To.toLowerCase() === vestWithNlpOption.toLowerCase()) {
      vestWithNlpAccounts.push(txn.From)
      vestWithNlpAmounts.push(amount)
      totalEsNova = totalEsNova.add(amount)
    }
  }

  console.log("vestWithNovaAccounts", vestWithNovaAccounts.length)
  console.log("vestWithNlpAccounts", vestWithNlpAccounts.length)
  console.log("totalEsNova", totalEsNova.toString(), ethers.utils.formatUnits(totalEsNova, 18))

  if (shouldSendTxns) {
    if (vestWithNovaAccounts.length > 0) {
      await sendTxn(esNovaBatchSender.send(novaVester.address, 4, vestWithNovaAccounts, vestWithNovaAmounts), "esNovaBatchSender.send(novaVester)")
    }
    if (vestWithNlpAccounts.length > 0) {
      await sendTxn(esNovaBatchSender.send(nlpVester.address, 320, vestWithNlpAccounts, vestWithNlpAmounts), "esNovaBatchSender.send(nlpVester)")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
