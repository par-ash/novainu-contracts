const { deployContract, contractAt , sendTxn, writeTmpAddresses, callWithRetries } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function main() {
  const {
    nativeToken
  } = tokens

  const vault = await contractAt("Vault", "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6")
  const usdg = await contractAt("USDG", "0x1181F0583be72AB7eB6b56055AF3C102fD956C5c")
  const nlp = await contractAt("NLP", "0xCd81FDa67eb7D9d23f98b81224CAEd25888b1233")

  //const nlpManager = await deployContract("NlpManager", [vault.address, usdg.address, nlp.address, 15 * 60])
  const cooldownDuration = 0
  const shortsTracker = { address: "0xfB5EaB03b1b71B72Fb369035843FfE754b7e8106" }
  const nlpManager = await deployContract("NlpManager", [vault.address, usdg.address, nlp.address, shortsTracker.address, cooldownDuration])

  await sendTxn(nlpManager.setInPrivateMode(true), "nlpManager.setInPrivateMode")

  await sendTxn(nlp.setMinter(nlpManager.address, true), "nlp.setMinter")
  await sendTxn(usdg.addVault(nlpManager.address), "usdg.addVault")
  await sendTxn(vault.setManager(nlpManager.address, true), "vault.setManager")

  writeTmpAddresses({
    nlpManager: nlpManager.address
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
