const { deployContract, contractAt } = require("../shared/helpers")
const { bigNumberify, expandDecimals } = require("../../test/shared/utilities")

async function main() {
  const { MaxUint256 } = ethers.constants
  const precision = 1000000

  const novaMigrator = await deployContract("NovaMigrator", [2])
  const gmtNovaIou = await deployContract("NovaIou", [novaMigrator.address, "GMT NOVA (IOU)", "GMT:NOVA"])
  const xgmtNovaIou = await deployContract("NovaIou", [novaMigrator.address, "xGMT NOVA (IOU)", "xGMT:NOVA"])
  const gmtUsdgNovaIou = await deployContract("NovaIou", [novaMigrator.address, "GMT-USDG NOVA (IOU)", "GMT-USDG:NOVA"])
  const xgmtUsdgNovaIou = await deployContract("NovaIou", [novaMigrator.address, "xGMT-USDG NOVA (IOU)", "xGMT-USDG:NOVA"])

  const gmt = { address: "0x99e92123eB77Bc8f999316f622e5222498438784" }
  const xgmt = { address: "0xe304ff0983922787Fd84BC9170CD21bF78B16B10" }
  const gmtUsdg = { address: "0xa41e57459f09a126F358E118b693789d088eA8A0" }
  const xgmtUsdg = { address: "0x0b622208fc0691C2486A3AE6B7C875b4A174b317" }
  const usdg = { address: "0x85E76cbf4893c1fbcB34dCF1239A91CE2A4CF5a7" }

  const ammRouter = { address: "0x10ED43C718714eb63d5aA57B78B54704E256024E" }
  const novaPrice = bigNumberify(2 * precision)

  const signers = [
    "0xbeD4E2d667B9E201505cD7822a4498D38ef956BC", // Dovey
    "0x14f3e34E232a234031A502C16E8873000A283C70", // Han Wen
    "0x80e0c70848a18E9117A0615b4116B3b0F78E463b" // Krunal Amin
  ]

  const gmtPrice = bigNumberify(10.97 * precision)
  const xgmtPrice = bigNumberify(90.31 * precision)
  const gmtUsdgPrice = bigNumberify(parseInt(6.68 * precision * 1.1))
  const xgmtUsdgPrice = bigNumberify(parseInt(19.27 * precision * 1.1))

  const whitelistedTokens = [gmt.address, xgmt.address, gmtUsdg.address, xgmtUsdg.address]
  const iouTokens = [gmtNovaIou.address, xgmtNovaIou.address, gmtUsdgNovaIou.address, xgmtUsdgNovaIou.address]
  const prices = [gmtPrice, xgmtPrice, gmtUsdgPrice, xgmtUsdgPrice]
  const caps = [MaxUint256, MaxUint256, expandDecimals(483129, 18), expandDecimals(150191, 18)]
  const lpTokens = [gmtUsdg.address, xgmtUsdg.address]
  const lpTokenAs = [gmt.address, xgmt.address]
  const lpTokenBs = [usdg.address, usdg.address]

  await novaMigrator.initialize(
    ammRouter.address,
    novaPrice,
    signers,
    whitelistedTokens,
    iouTokens,
    prices,
    caps,
    lpTokens,
    lpTokenAs,
    lpTokenBs
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
