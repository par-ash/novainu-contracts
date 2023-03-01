const { deployContract } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const initialSupply = expandDecimals(201 * 1000, 18)
  const gmt = await deployContract("NLP", [initialSupply])
  return { gmt }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
