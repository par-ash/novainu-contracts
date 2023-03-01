const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const router = await contractAt("Router", "0xb4a0F695620fC989FEc16990805365f7e9db4c27")
  const vault = await contractAt("Vault", "0x7386da1e66250c55e46310cde79eAd3d84d8A22d")
  const gov = await contractAt("Timelock", "0x64C322f4008B7EA424905822DaD2C041C1CAbf44")

  const tokenDecimals = 18

  const btc = {
    symbol: "BTC",
    address: "0xe628b3d6d5c2eC26092085784C5bD41d9fA3AF2a"
  }
  const eth = {
    symbol: "ETH",
    address: "0xE575d758dDcC6e882aF755d3d678f32635B0D5f2"
  }
  const bnb = {
    symbol: "BNB",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
  }
  const busd = {
    symbol: "BUSD",
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56"
  }
  const usdc = {
    symbol: "USDC",
    address: "0x1a6863f6254308627254a14C06F20f8B952EF167"
  }
  const usdt = {
    symbol: "USDT",
    address: "0x7764f7c8f76CB670eFB90Db191BDF48857987b52"
  }

  const tokens = [btc, eth, usdc, usdt]

  for (let i = 0; i < tokens.length; i++) {
    const token = await contractAt("YieldToken", tokens[i].address)
    console.log(token.address);
    const poolAmount = await vault.poolAmounts(token.address)
    const feeReserve = await vault.feeReserves(token.address)
    const balance = await token.balanceOf(vault.address)
    const vaultAmount = poolAmount.add(feeReserve)
    if (vaultAmount.gt(balance)) {
      const diff = vaultAmount.sub(balance)
      console.log(`${token.address}: vaultAmount.gt(balance): ${ethers.utils.formatUnits(diff, 18)} ${tokens[i].symbol}`)
    } else {
      const diff = balance.sub(vaultAmount)
      console.log(`${token.address}: vaultAmount.lt(balance): ${ethers.utils.formatUnits(diff, 18)} ${tokens[i].symbol}`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
