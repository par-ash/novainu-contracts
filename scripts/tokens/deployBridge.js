const { deployContract, contractAt, writeTmpAddresses } = require("../shared/helpers")

async function main() {
  const nova = { address: "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4" }
  const wNova = { address: "0x590020B1005b8b25f1a2C82c5f743c540dcfa24d" }
  await deployContract("Bridge", [nova.address, wNova.address], "Bridge")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
