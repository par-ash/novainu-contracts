const { deployContract, contractAt, writeTmpAddresses } = require("../shared/helpers")

async function main() {
  // await deployContract("EsNOVA", [])
  // await deployContract("NLP", [])
  await deployContract("MintableBaseToken", ["esNOVA IOU", "esNOVA:IOU", 0])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
