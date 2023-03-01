const { deployContract, contractAt, sendTxn, readTmpAddresses, callWithRetries } = require("../shared/helpers")
const { bigNumberify, expandDecimals } = require("../../test/shared/utilities")
const { toChainlinkPrice } = require("../../test/shared/chainlink")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[network];

// TODO: update timelock address
async function getArbValues() {
  const vault = await contractAt("Vault", "0x7386da1e66250c55e46310cde79eAd3d84d8A22d")
  const timelock = await contractAt("Timelock", await vault.gov())
  const reader = await contractAt("Reader", "0xCC4Df7bb59B3B7b515F2D36Da703783f3A7278eC")

  const { btc, eth, usdc, link, uni, usdt, mim, frax, dai } = tokens
  const tokenArr = [ btc, eth, usdc, usdt ]

  const vaultTokenInfo = await reader.getVaultTokenInfoV2(vault.address, eth.address, 1, tokenArr.map(t => t.address))

  return { vault, timelock, reader, tokenArr, vaultTokenInfo }
}

async function getAvaxValues() {
  const vault = await contractAt("Vault", "0x9ab2De34A33fB459b538c43f251eB825645e8595")
  const timelock = await contractAt("Timelock", await vault.gov())
  const reader = await contractAt("Reader", "0x2eFEE1950ededC65De687b40Fd30a7B5f4544aBd")

  const { avax, eth, btc, btcb, usdce, usdc } = tokens
  const tokenArr = [ avax, eth, btc, btcb, usdce, usdc ]

  const vaultTokenInfo = await reader.getVaultTokenInfoV2(vault.address, avax.address, 1, tokenArr.map(t => t.address))

  return { vault, timelock, reader, tokenArr, vaultTokenInfo }
}

async function getValues() {
  if (network === "arbitrum" || network === "arbitrumTestnet") {
    return getArbValues()
  }

  if (network === "avax") {
    return getAvaxValues()
  }
}

async function main() {
  const { vault, timelock, reader, tokenArr, vaultTokenInfo } = await getValues()

  console.log("vault", vault.address)
  console.log("timelock", timelock.address)
  //console.log("vaultTokenInfo", vaultTokenInfo)

  const vaultPropsLength = 14;

  const shouldSendTxn = true

  let totalUsdgAmount = bigNumberify(100)

  for (const [i, tokenItem] of tokenArr.entries()) {
    const token = {}
    token.poolAmount = vaultTokenInfo[i * vaultPropsLength]
    token.reservedAmount = vaultTokenInfo[i * vaultPropsLength + 1]
    token.availableAmount = token.poolAmount.sub(token.reservedAmount)
    token.usdgAmount = vaultTokenInfo[i * vaultPropsLength + 2]
    token.redemptionAmount = vaultTokenInfo[i * vaultPropsLength + 3]
    token.weight = vaultTokenInfo[i * vaultPropsLength + 4]
    token.bufferAmount = vaultTokenInfo[i * vaultPropsLength + 5]
    token.maxUsdgAmount = vaultTokenInfo[i * vaultPropsLength + 6]
    token.globalShortSize = vaultTokenInfo[i * vaultPropsLength + 7]
    token.maxGlobalShortSize = vaultTokenInfo[i * vaultPropsLength + 8]
    token.minPrice = vaultTokenInfo[i * vaultPropsLength + 9]
    token.maxPrice = vaultTokenInfo[i * vaultPropsLength + 10]
    token.guaranteedUsd = vaultTokenInfo[i * vaultPropsLength + 11]

    token.availableUsd = tokenItem.isStable
      ? token.poolAmount
          .mul(token.minPrice)
          .div(expandDecimals(1, tokenItem.decimals))
      : token.availableAmount
          .mul(token.minPrice)
          .div(expandDecimals(1, tokenItem.decimals));

    token.managedUsd = token.availableUsd.add(token.guaranteedUsd);
    token.managedAmount = token.managedUsd
      .mul(expandDecimals(1, tokenItem.decimals))
      .div(token.minPrice);

    let usdgAmount = token.managedUsd.div(expandDecimals(1, 30 - 18))
    totalUsdgAmount = totalUsdgAmount.add(usdgAmount)

    //console.log(token)
    const adjustedMaxUsdgAmount = expandDecimals(tokenItem.maxUsdgAmount, 18)
    // if (usdgAmount.gt(adjustedMaxUsdgAmount)) {
    //   usdgAmount = adjustedMaxUsdgAmount
    // }
  }

  console.log("totalUsdgAmount", totalUsdgAmount.toString())

  if (shouldSendTxn) {
    await sendTxn(timelock.updateUsdgSupply(totalUsdgAmount), "timelock.updateUsdgSupply")
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
