const { deployContract, contractAt, writeTmpAddresses } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const initialSupply = expandDecimals(100 * 1000, 18)
  const gmt = await deployContract("NOVA", [initialSupply])
  //await deployContract("NOVA", [])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
