const { getFrameSigner, deployContract, contractAt, sendTxn } = require("../shared/helpers")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

async function getArbValues() {
  const signer = await getFrameSigner()

  const esNova = await contractAt("EsNOVA", "0xF99ADd844054816c742e5F6380D661b3c39dd74F")
  const esNovaGov = await contractAt("Timelock", await esNova.gov(), signer)
  const novaVester = await contractAt("Vester", "0x199070DDfd1CFb69173aa2F7e20906F26B363004")
  const novaVesterGov = await contractAt("Timelock", await novaVester.gov(), signer)
  const nlpVester = await contractAt("Vester", "0xA75287d2f8b217273E7FCD7E86eF07D33972042E")
  const nlpVesterGov = await contractAt("Timelock", await nlpVester.gov(), signer)

  return { esNova, esNovaGov, novaVester, novaVesterGov, nlpVester, nlpVesterGov }
}

async function getAvaxValues() {
  const signer = await getFrameSigner()

  const esNova = await contractAt("EsNOVA", "0xFf1489227BbAAC61a9209A08929E4c2a526DdD17")
  const esNovaGov = await contractAt("Timelock", await esNova.gov(), signer)
  const novaVester = await contractAt("Vester", "0x472361d3cA5F49c8E633FB50385BfaD1e018b445")
  const novaVesterGov = await contractAt("Timelock", await novaVester.gov(), signer)
  const nlpVester = await contractAt("Vester", "0x62331A7Bd1dfB3A7642B7db50B5509E57CA3154A")
  const nlpVesterGov = await contractAt("Timelock", await nlpVester.gov(), signer)

  return { esNova, esNovaGov, novaVester, novaVesterGov, nlpVester, nlpVesterGov }
}

async function main() {
  const method = network === "arbitrumTestnet" ? getArbValues : getAvaxValues
  const { esNova, esNovaGov, novaVester, novaVesterGov, nlpVester, nlpVesterGov } = await method()

  const esNovaBatchSender = await deployContract("EsNovaBatchSender", [esNova.address])

  console.log("esNova", esNova.address)
  console.log("esNovaGov", esNovaGov.address)
  console.log("novaVester", novaVester.address)
  console.log("novaVesterGov", novaVesterGov.address)
  console.log("nlpVester", nlpVester.address)
  console.log("nlpVesterGov", nlpVesterGov.address)

  await sendTxn(esNovaGov.signalSetHandler(esNova.address, esNovaBatchSender.address, true), "esNovaGov.signalSetHandler")
  await sendTxn(novaVesterGov.signalSetHandler(novaVester.address, esNovaBatchSender.address, true), "novaVesterGov.signalSetHandler")
  await sendTxn(nlpVesterGov.signalSetHandler(nlpVester.address, esNovaBatchSender.address, true), "nlpVesterGov.signalSetHandler")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
