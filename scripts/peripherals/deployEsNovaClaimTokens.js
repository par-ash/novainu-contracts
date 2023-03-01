const { deployContract, contractAt, writeTmpAddresses } = require("../shared/helpers")

async function main() {
  await deployContract("MintableBaseToken", ["VestingOption", "ARB:NOVA", 0])
  await deployContract("MintableBaseToken", ["VestingOption", "ARB:NLP", 0])
  await deployContract("MintableBaseToken", ["VestingOption", "AVAX:NOVA", 0])
  await deployContract("MintableBaseToken", ["VestingOption", "AVAX:NLP", 0])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
