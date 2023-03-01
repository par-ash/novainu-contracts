const { deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const btcPriceFeed = await contractAt("PriceFeed", "0x6550bc2301936011c1334555e62A87705A81C12C")
  const ethPriceFeed = await contractAt("PriceFeed", "0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08")
  const bnbPriceFeed = await contractAt("PriceFeed", "0xd28Ba6CA3bB72bF371b80a2a0a33cBcf9073C954") //link
  const busdPriceFeed = await contractAt("PriceFeed", "0x103b53E977DA6E4Fa92f76369c8b7e20E7fb7fe1") //dai
  const usdcPriceFeed = await contractAt("PriceFeed", "0x1692Bdd32F31b831caAc1b0c9fAF68613682813b")
  const usdtPriceFeed = await contractAt("PriceFeed", "0x0a023a3423D9b27A0BE48c768CCF2dD7877fEf5E")
  const priceDecimals = 8

  const btc = {
    symbol: "BTC",
    address: "0xe628b3d6d5c2eC26092085784C5bD41d9fA3AF2a",
    priceFeed: btcPriceFeed
  }
  const eth = {
    symbol: "ETH",
    address: "0xE575d758dDcC6e882aF755d3d678f32635B0D5f2",
    priceFeed: ethPriceFeed
  }
  const bnb = {
    symbol: "BNB",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    priceFeed: bnbPriceFeed
  }
  const busd = {
    symbol: "BUSD",
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    priceFeed: busdPriceFeed
  }
  const usdc = {
    symbol: "USDC",
    address: "0x1a6863f6254308627254a14C06F20f8B952EF167",
    priceFeed: usdcPriceFeed
  }
  const usdt = {
    symbol: "USDT",
    address: "0x7764f7c8f76CB670eFB90Db191BDF48857987b52",
    priceFeed: usdtPriceFeed
  }

  const tokens = [btc, eth, usdc, usdt]

  const now = parseInt(Date.now() / 1000)

  for (let i = 0; i < tokens.length; i++) {
    const { symbol, priceFeed } = tokens[i]
    const latestRound = await priceFeed.latestRound()

    for (let j = 0; j < 5; j++) {
      const roundData = await priceFeed.getRoundData(latestRound.sub(j))
      const answer = roundData[1]
      const updatedAt = roundData[3]
      console.log(`${symbol} ${j}: ${ethers.utils.formatUnits(answer, priceDecimals)}, ${updatedAt}, ${updatedAt.sub(now).toString()}s, ${updatedAt.sub(now).div(60).toString()}m`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
