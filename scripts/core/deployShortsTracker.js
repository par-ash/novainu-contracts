const { getFrameSigner, deployContract, contractAt , sendTxn, readTmpAddresses, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units");
const { getArgumentForSignature } = require("typechain");

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

async function getArbTestnetValues() {
  return { vaultAddress: "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6", gasLimit: 12500000 }
}

async function getArbValues() {
  return { vaultAddress: "0xdB888957Bd05085C3bB9068eACfaEBCfC52549D6", gasLimit: 12500000 }
}

async function getAvaxValues() {
  return { vaultAddress: "0x99e87095954fd8436B6eF53f48e0e1DEC1419322" }
}

async function getValues() {
  if (network === "avax") {
    return await getAvaxValues()
  } else if (network === "arbitrumTestnet") {
    return await getArbTestnetValues()
  } else {
    return await getArbValues()
  }
}

async function main() {
  const { vaultAddress, gasLimit } = await getValues()
  const gov = { address: "0xc26Ddc9C7ffa2C74aaF6aEf73Af9dCf1979A9467" }
  const shortsTracker = await deployContract("ShortsTracker", [vaultAddress], "ShortsTracker", { gasLimit })
  await sendTxn(shortsTracker.setGov(gov.address), "shortsTracker.setGov")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
