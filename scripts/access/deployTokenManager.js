const { deployContract, contractAt, writeTmpAddresses, sendTxn } = require("../shared/helpers")

async function main() {
  const tokenManager = await deployContract("TokenManager", [4], "TokenManager")

  const signers = [
    "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC", // Dovey
    "0x14f3e34E232a234031A502C16E8873000A283C70", // G
    "0x80e0c70848a18E9117A0615b4116B3b0F78E463b", // Han Wen
    "0x9b1E01d106Be9a6fFA64c340f322AC52b7Fb55bc", // Krunal Amin
    "0x6091646D0354b03DD1e9697D33A7341d8C93a6F5", // xhiroz
    "0xd6D5a4070C7CFE0b42bE83934Cc21104AbeF1AD5" // Bybit Security Team
  ]

  await sendTxn(tokenManager.initialize(signers), "tokenManager.initialize")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
