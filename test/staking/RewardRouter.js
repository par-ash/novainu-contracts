const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed, print, newWallet } = require("../shared/utilities")
const { toChainlinkPrice } = require("../shared/chainlink")
const { toUsd, toNormalizedPrice } = require("../shared/units")
const { initVault, getBnbConfig, getBtcConfig, getDaiConfig } = require("../core/Vault/helpers")
const { ADDRESS_ZERO } = require("@uniswap/v3-sdk")

use(solidity)

describe("RewardRouter", function () {
  const provider = waffle.provider
  const [wallet, user0, user1, user2, user3] = provider.getWallets()

  let vault
  let nlpManager
  let nlp
  let usdg
  let router
  let vaultPriceFeed
  let bnb
  let bnbPriceFeed
  let btc
  let btcPriceFeed
  let eth
  let ethPriceFeed
  let dai
  let daiPriceFeed
  let busd
  let busdPriceFeed

  let nova
  let esNova
  let bnNova

  let stakedNovaTracker
  let stakedNovaDistributor
  let bonusNovaTracker
  let bonusNovaDistributor
  let feeNovaTracker
  let feeNovaDistributor

  let feeNlpTracker
  let feeNlpDistributor
  let stakedNlpTracker
  let stakedNlpDistributor

  let rewardRouter

  beforeEach(async () => {
    bnb = await deployContract("Token", [])
    bnbPriceFeed = await deployContract("PriceFeed", [])

    btc = await deployContract("Token", [])
    btcPriceFeed = await deployContract("PriceFeed", [])

    eth = await deployContract("Token", [])
    ethPriceFeed = await deployContract("PriceFeed", [])

    dai = await deployContract("Token", [])
    daiPriceFeed = await deployContract("PriceFeed", [])

    busd = await deployContract("Token", [])
    busdPriceFeed = await deployContract("PriceFeed", [])

    vault = await deployContract("Vault", [])
    usdg = await deployContract("USDG", [vault.address])
    router = await deployContract("Router", [vault.address, usdg.address, bnb.address])
    vaultPriceFeed = await deployContract("VaultPriceFeed", [])
    nlp = await deployContract("NLP", [])

    await initVault(vault, router, usdg, vaultPriceFeed)
    nlpManager = await deployContract("NlpManager", [vault.address, usdg.address, nlp.address, ethers.constants.AddressZero, 24 * 60 * 60])

    await vaultPriceFeed.setTokenConfig(bnb.address, bnbPriceFeed.address, 8, false)
    await vaultPriceFeed.setTokenConfig(btc.address, btcPriceFeed.address, 8, false)
    await vaultPriceFeed.setTokenConfig(eth.address, ethPriceFeed.address, 8, false)
    await vaultPriceFeed.setTokenConfig(dai.address, daiPriceFeed.address, 8, false)

    await daiPriceFeed.setLatestAnswer(toChainlinkPrice(1))
    await vault.setTokenConfig(...getDaiConfig(dai, daiPriceFeed))

    await btcPriceFeed.setLatestAnswer(toChainlinkPrice(60000))
    await vault.setTokenConfig(...getBtcConfig(btc, btcPriceFeed))

    await bnbPriceFeed.setLatestAnswer(toChainlinkPrice(300))
    await vault.setTokenConfig(...getBnbConfig(bnb, bnbPriceFeed))

    await nlp.setInPrivateTransferMode(true)
    await nlp.setMinter(nlpManager.address, true)
    await nlpManager.setInPrivateMode(true)

    nova = await deployContract("NOVA", []);
    esNova = await deployContract("EsNOVA", []);
    bnNova = await deployContract("MintableBaseToken", ["Bonus NOVA", "bnNOVA", 0]);

    // NOVA
    stakedNovaTracker = await deployContract("RewardTracker", ["Staked NOVA", "sNOVA"])
    stakedNovaDistributor = await deployContract("RewardDistributor", [esNova.address, stakedNovaTracker.address])
    await stakedNovaTracker.initialize([nova.address, esNova.address], stakedNovaDistributor.address)
    await stakedNovaDistributor.updateLastDistributionTime()

    bonusNovaTracker = await deployContract("RewardTracker", ["Staked + Bonus NOVA", "sbNOVA"])
    bonusNovaDistributor = await deployContract("BonusDistributor", [bnNova.address, bonusNovaTracker.address])
    await bonusNovaTracker.initialize([stakedNovaTracker.address], bonusNovaDistributor.address)
    await bonusNovaDistributor.updateLastDistributionTime()

    feeNovaTracker = await deployContract("RewardTracker", ["Staked + Bonus + Fee NOVA", "sbfNOVA"])
    feeNovaDistributor = await deployContract("RewardDistributor", [eth.address, feeNovaTracker.address])
    await feeNovaTracker.initialize([bonusNovaTracker.address, bnNova.address], feeNovaDistributor.address)
    await feeNovaDistributor.updateLastDistributionTime()

    // NLP
    feeNlpTracker = await deployContract("RewardTracker", ["Fee NLP", "fNLP"])
    feeNlpDistributor = await deployContract("RewardDistributor", [eth.address, feeNlpTracker.address])
    await feeNlpTracker.initialize([nlp.address], feeNlpDistributor.address)
    await feeNlpDistributor.updateLastDistributionTime()

    stakedNlpTracker = await deployContract("RewardTracker", ["Fee + Staked NLP", "fsNLP"])
    stakedNlpDistributor = await deployContract("RewardDistributor", [esNova.address, stakedNlpTracker.address])
    await stakedNlpTracker.initialize([feeNlpTracker.address], stakedNlpDistributor.address)
    await stakedNlpDistributor.updateLastDistributionTime()

    await stakedNovaTracker.setInPrivateTransferMode(true)
    await stakedNovaTracker.setInPrivateStakingMode(true)
    await bonusNovaTracker.setInPrivateTransferMode(true)
    await bonusNovaTracker.setInPrivateStakingMode(true)
    await bonusNovaTracker.setInPrivateClaimingMode(true)
    await feeNovaTracker.setInPrivateTransferMode(true)
    await feeNovaTracker.setInPrivateStakingMode(true)

    await feeNlpTracker.setInPrivateTransferMode(true)
    await feeNlpTracker.setInPrivateStakingMode(true)
    await stakedNlpTracker.setInPrivateTransferMode(true)
    await stakedNlpTracker.setInPrivateStakingMode(true)

    rewardRouter = await deployContract("RewardRouter", [])
    await rewardRouter.initialize(
      bnb.address,
      nova.address,
      esNova.address,
      bnNova.address,
      nlp.address,
      stakedNovaTracker.address,
      bonusNovaTracker.address,
      feeNovaTracker.address,
      feeNlpTracker.address,
      stakedNlpTracker.address,
      nlpManager.address
    )

    // allow rewardRouter to stake in stakedNovaTracker
    await stakedNovaTracker.setHandler(rewardRouter.address, true)
    // allow bonusNovaTracker to stake stakedNovaTracker
    await stakedNovaTracker.setHandler(bonusNovaTracker.address, true)
    // allow rewardRouter to stake in bonusNovaTracker
    await bonusNovaTracker.setHandler(rewardRouter.address, true)
    // allow bonusNovaTracker to stake feeNovaTracker
    await bonusNovaTracker.setHandler(feeNovaTracker.address, true)
    await bonusNovaDistributor.setBonusMultiplier(10000)
    // allow rewardRouter to stake in feeNovaTracker
    await feeNovaTracker.setHandler(rewardRouter.address, true)
    // allow feeNovaTracker to stake bnNova
    await bnNova.setHandler(feeNovaTracker.address, true)
    // allow rewardRouter to burn bnNova
    await bnNova.setMinter(rewardRouter.address, true)

    // allow rewardRouter to mint in nlpManager
    await nlpManager.setHandler(rewardRouter.address, true)
    // allow rewardRouter to stake in feeNlpTracker
    await feeNlpTracker.setHandler(rewardRouter.address, true)
    // allow stakedNlpTracker to stake feeNlpTracker
    await feeNlpTracker.setHandler(stakedNlpTracker.address, true)
    // allow rewardRouter to sake in stakedNlpTracker
    await stakedNlpTracker.setHandler(rewardRouter.address, true)
    // allow feeNlpTracker to stake nlp
    await nlp.setHandler(feeNlpTracker.address, true)

    // mint esNova for distributors
    await esNova.setMinter(wallet.address, true)
    await esNova.mint(stakedNovaDistributor.address, expandDecimals(50000, 18))
    await stakedNovaDistributor.setTokensPerInterval("20667989410000000") // 0.02066798941 esNova per second
    await esNova.mint(stakedNlpDistributor.address, expandDecimals(50000, 18))
    await stakedNlpDistributor.setTokensPerInterval("20667989410000000") // 0.02066798941 esNova per second

    await esNova.setInPrivateTransferMode(true)
    await esNova.setHandler(stakedNovaDistributor.address, true)
    await esNova.setHandler(stakedNlpDistributor.address, true)
    await esNova.setHandler(stakedNovaTracker.address, true)
    await esNova.setHandler(stakedNlpTracker.address, true)
    await esNova.setHandler(rewardRouter.address, true)

    // mint bnNova for distributor
    await bnNova.setMinter(wallet.address, true)
    await bnNova.mint(bonusNovaDistributor.address, expandDecimals(1500, 18))
  })

  it("inits", async () => {
    expect(await rewardRouter.isInitialized()).eq(true)

    expect(await rewardRouter.weth()).eq(bnb.address)
    expect(await rewardRouter.nova()).eq(nova.address)
    expect(await rewardRouter.esNova()).eq(esNova.address)
    expect(await rewardRouter.bnNova()).eq(bnNova.address)

    expect(await rewardRouter.nlp()).eq(nlp.address)

    expect(await rewardRouter.stakedNovaTracker()).eq(stakedNovaTracker.address)
    expect(await rewardRouter.bonusNovaTracker()).eq(bonusNovaTracker.address)
    expect(await rewardRouter.feeNovaTracker()).eq(feeNovaTracker.address)

    expect(await rewardRouter.feeNlpTracker()).eq(feeNlpTracker.address)
    expect(await rewardRouter.stakedNlpTracker()).eq(stakedNlpTracker.address)

    expect(await rewardRouter.nlpManager()).eq(nlpManager.address)

    await expect(rewardRouter.initialize(
      bnb.address,
      nova.address,
      esNova.address,
      bnNova.address,
      nlp.address,
      stakedNovaTracker.address,
      bonusNovaTracker.address,
      feeNovaTracker.address,
      feeNlpTracker.address,
      stakedNlpTracker.address,
      nlpManager.address
    )).to.be.revertedWith("RewardRouter: already initialized")
  })

  it("stakeNovaForAccount, stakeNova, stakeEsNova, unstakeNova, unstakeEsNova, claimEsNova, claimFees, compound, batchCompoundForAccounts", async () => {
    await eth.mint(feeNovaDistributor.address, expandDecimals(100, 18))
    await feeNovaDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await nova.setMinter(wallet.address, true)
    await nova.mint(user0.address, expandDecimals(1500, 18))
    expect(await nova.balanceOf(user0.address)).eq(expandDecimals(1500, 18))

    await nova.connect(user0).approve(stakedNovaTracker.address, expandDecimals(1000, 18))
    await expect(rewardRouter.connect(user0).stakeNovaForAccount(user1.address, expandDecimals(1000, 18)))
      .to.be.revertedWith("Governable: forbidden")

    await rewardRouter.setGov(user0.address)
    await rewardRouter.connect(user0).stakeNovaForAccount(user1.address, expandDecimals(800, 18))
    expect(await nova.balanceOf(user0.address)).eq(expandDecimals(700, 18))

    await nova.mint(user1.address, expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(expandDecimals(200, 18))
    await nova.connect(user1).approve(stakedNovaTracker.address, expandDecimals(200, 18))
    await rewardRouter.connect(user1).stakeNova(expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(0)

    expect(await stakedNovaTracker.stakedAmounts(user0.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user0.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(1000, 18))

    expect(await bonusNovaTracker.stakedAmounts(user0.address)).eq(0)
    expect(await bonusNovaTracker.depositBalances(user0.address, stakedNovaTracker.address)).eq(0)
    expect(await bonusNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 18))
    expect(await bonusNovaTracker.depositBalances(user1.address, stakedNovaTracker.address)).eq(expandDecimals(1000, 18))

    expect(await feeNovaTracker.stakedAmounts(user0.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user0.address, bonusNovaTracker.address)).eq(0)
    expect(await feeNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).eq(expandDecimals(1000, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await stakedNovaTracker.claimable(user0.address)).eq(0)
    expect(await stakedNovaTracker.claimable(user1.address)).gt(expandDecimals(1785, 18)) // 50000 / 28 => ~1785
    expect(await stakedNovaTracker.claimable(user1.address)).lt(expandDecimals(1786, 18))

    expect(await bonusNovaTracker.claimable(user0.address)).eq(0)
    expect(await bonusNovaTracker.claimable(user1.address)).gt("2730000000000000000") // 2.73, 1000 / 365 => ~2.74
    expect(await bonusNovaTracker.claimable(user1.address)).lt("2750000000000000000") // 2.75

    expect(await feeNovaTracker.claimable(user0.address)).eq(0)
    expect(await feeNovaTracker.claimable(user1.address)).gt("3560000000000000000") // 3.56, 100 / 28 => ~3.57
    expect(await feeNovaTracker.claimable(user1.address)).lt("3580000000000000000") // 3.58

    await esNova.setMinter(wallet.address, true)
    await esNova.mint(user2.address, expandDecimals(500, 18))
    await rewardRouter.connect(user2).stakeEsNova(expandDecimals(500, 18))

    expect(await stakedNovaTracker.stakedAmounts(user0.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user0.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(1000, 18))
    expect(await stakedNovaTracker.stakedAmounts(user2.address)).eq(expandDecimals(500, 18))
    expect(await stakedNovaTracker.depositBalances(user2.address, esNova.address)).eq(expandDecimals(500, 18))

    expect(await bonusNovaTracker.stakedAmounts(user0.address)).eq(0)
    expect(await bonusNovaTracker.depositBalances(user0.address, stakedNovaTracker.address)).eq(0)
    expect(await bonusNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 18))
    expect(await bonusNovaTracker.depositBalances(user1.address, stakedNovaTracker.address)).eq(expandDecimals(1000, 18))
    expect(await bonusNovaTracker.stakedAmounts(user2.address)).eq(expandDecimals(500, 18))
    expect(await bonusNovaTracker.depositBalances(user2.address, stakedNovaTracker.address)).eq(expandDecimals(500, 18))

    expect(await feeNovaTracker.stakedAmounts(user0.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user0.address, bonusNovaTracker.address)).eq(0)
    expect(await feeNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).eq(expandDecimals(1000, 18))
    expect(await feeNovaTracker.stakedAmounts(user2.address)).eq(expandDecimals(500, 18))
    expect(await feeNovaTracker.depositBalances(user2.address, bonusNovaTracker.address)).eq(expandDecimals(500, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await stakedNovaTracker.claimable(user0.address)).eq(0)
    expect(await stakedNovaTracker.claimable(user1.address)).gt(expandDecimals(1785 + 1190, 18))
    expect(await stakedNovaTracker.claimable(user1.address)).lt(expandDecimals(1786 + 1191, 18))
    expect(await stakedNovaTracker.claimable(user2.address)).gt(expandDecimals(595, 18))
    expect(await stakedNovaTracker.claimable(user2.address)).lt(expandDecimals(596, 18))

    expect(await bonusNovaTracker.claimable(user0.address)).eq(0)
    expect(await bonusNovaTracker.claimable(user1.address)).gt("5470000000000000000") // 5.47, 1000 / 365 * 2 => ~5.48
    expect(await bonusNovaTracker.claimable(user1.address)).lt("5490000000000000000")
    expect(await bonusNovaTracker.claimable(user2.address)).gt("1360000000000000000") // 1.36, 500 / 365 => ~1.37
    expect(await bonusNovaTracker.claimable(user2.address)).lt("1380000000000000000")

    expect(await feeNovaTracker.claimable(user0.address)).eq(0)
    expect(await feeNovaTracker.claimable(user1.address)).gt("5940000000000000000") // 5.94, 3.57 + 100 / 28 / 3 * 2 => ~5.95
    expect(await feeNovaTracker.claimable(user1.address)).lt("5960000000000000000")
    expect(await feeNovaTracker.claimable(user2.address)).gt("1180000000000000000") // 1.18, 100 / 28 / 3 => ~1.19
    expect(await feeNovaTracker.claimable(user2.address)).lt("1200000000000000000")

    expect(await esNova.balanceOf(user1.address)).eq(0)
    await rewardRouter.connect(user1).claimEsNova()
    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(1785 + 1190, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(1786 + 1191, 18))

    expect(await eth.balanceOf(user1.address)).eq(0)
    await rewardRouter.connect(user1).claimFees()
    expect(await eth.balanceOf(user1.address)).gt("5940000000000000000")
    expect(await eth.balanceOf(user1.address)).lt("5960000000000000000")

    expect(await esNova.balanceOf(user2.address)).eq(0)
    await rewardRouter.connect(user2).claimEsNova()
    expect(await esNova.balanceOf(user2.address)).gt(expandDecimals(595, 18))
    expect(await esNova.balanceOf(user2.address)).lt(expandDecimals(596, 18))

    expect(await eth.balanceOf(user2.address)).eq(0)
    await rewardRouter.connect(user2).claimFees()
    expect(await eth.balanceOf(user2.address)).gt("1180000000000000000")
    expect(await eth.balanceOf(user2.address)).lt("1200000000000000000")

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    const tx0 = await rewardRouter.connect(user1).compound()
    await reportGasUsed(provider, tx0, "compound gas used")

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    const tx1 = await rewardRouter.connect(user0).batchCompoundForAccounts([user1.address, user2.address])
    await reportGasUsed(provider, tx1, "batchCompoundForAccounts gas used")

    expect(await stakedNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(3643, 18))
    expect(await stakedNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(3645, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(1000, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(2643, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(2645, 18))

    expect(await bonusNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(3643, 18))
    expect(await bonusNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(3645, 18))

    expect(await feeNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(3657, 18))
    expect(await feeNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(3659, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).gt(expandDecimals(3643, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).lt(expandDecimals(3645, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("14100000000000000000") // 14.1
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("14300000000000000000") // 14.3

    expect(await nova.balanceOf(user1.address)).eq(0)
    await rewardRouter.connect(user1).unstakeNova(expandDecimals(300, 18))
    expect(await nova.balanceOf(user1.address)).eq(expandDecimals(300, 18))

    expect(await stakedNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(3343, 18))
    expect(await stakedNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(3345, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(700, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(2643, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(2645, 18))

    expect(await bonusNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(3343, 18))
    expect(await bonusNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(3345, 18))

    expect(await feeNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(3357, 18))
    expect(await feeNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(3359, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).gt(expandDecimals(3343, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).lt(expandDecimals(3345, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("13000000000000000000") // 13
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("13100000000000000000") // 13.1

    const esNovaBalance1 = await esNova.balanceOf(user1.address)
    const esNovaUnstakeBalance1 = await stakedNovaTracker.depositBalances(user1.address, esNova.address)
    await rewardRouter.connect(user1).unstakeEsNova(esNovaUnstakeBalance1)
    expect(await esNova.balanceOf(user1.address)).eq(esNovaBalance1.add(esNovaUnstakeBalance1))

    expect(await stakedNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(700, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(700, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).eq(0)

    expect(await bonusNovaTracker.stakedAmounts(user1.address)).eq(expandDecimals(700, 18))

    expect(await feeNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(702, 18))
    expect(await feeNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(703, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).eq(expandDecimals(700, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("2720000000000000000") // 2.72
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("2740000000000000000") // 2.74

    await expect(rewardRouter.connect(user1).unstakeEsNova(expandDecimals(1, 18)))
      .to.be.revertedWith("RewardTracker: _amount exceeds depositBalance")
  })

  it("mintAndStakeNlp, unstakeAndRedeemNlp, compound, batchCompoundForAccounts", async () => {
    await eth.mint(feeNlpDistributor.address, expandDecimals(100, 18))
    await feeNlpDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(nlpManager.address, expandDecimals(1, 18))
    const tx0 = await rewardRouter.connect(user1).mintAndStakeNlp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )
    await reportGasUsed(provider, tx0, "mintAndStakeNlp gas used")

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(2991, 17))

    await bnb.mint(user1.address, expandDecimals(2, 18))
    await bnb.connect(user1).approve(nlpManager.address, expandDecimals(2, 18))
    await rewardRouter.connect(user1).mintAndStakeNlp(
      bnb.address,
      expandDecimals(2, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await increaseTime(provider, 24 * 60 * 60 + 1)
    await mineBlock(provider)

    expect(await feeNlpTracker.claimable(user1.address)).gt("3560000000000000000") // 3.56, 100 / 28 => ~3.57
    expect(await feeNlpTracker.claimable(user1.address)).lt("3580000000000000000") // 3.58

    expect(await stakedNlpTracker.claimable(user1.address)).gt(expandDecimals(1785, 18)) // 50000 / 28 => ~1785
    expect(await stakedNlpTracker.claimable(user1.address)).lt(expandDecimals(1786, 18))

    await bnb.mint(user2.address, expandDecimals(1, 18))
    await bnb.connect(user2).approve(nlpManager.address, expandDecimals(1, 18))
    await rewardRouter.connect(user2).mintAndStakeNlp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await expect(rewardRouter.connect(user2).unstakeAndRedeemNlp(
      bnb.address,
      expandDecimals(299, 18),
      "990000000000000000", // 0.99
      user2.address
    )).to.be.revertedWith("NlpManager: cooldown duration not yet passed")

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq("897300000000000000000") // 897.3
    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq("897300000000000000000")
    expect(await bnb.balanceOf(user1.address)).eq(0)

    const tx1 = await rewardRouter.connect(user1).unstakeAndRedeemNlp(
      bnb.address,
      expandDecimals(299, 18),
      "990000000000000000", // 0.99
      user1.address
    )
    await reportGasUsed(provider, tx1, "unstakeAndRedeemNlp gas used")

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq("598300000000000000000") // 598.3
    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq("598300000000000000000")
    expect(await bnb.balanceOf(user1.address)).eq("993676666666666666") // ~0.99

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await feeNlpTracker.claimable(user1.address)).gt("5940000000000000000") // 5.94, 3.57 + 100 / 28 / 3 * 2 => ~5.95
    expect(await feeNlpTracker.claimable(user1.address)).lt("5960000000000000000")
    expect(await feeNlpTracker.claimable(user2.address)).gt("1180000000000000000") // 1.18, 100 / 28 / 3 => ~1.19
    expect(await feeNlpTracker.claimable(user2.address)).lt("1200000000000000000")

    expect(await stakedNlpTracker.claimable(user1.address)).gt(expandDecimals(1785 + 1190, 18))
    expect(await stakedNlpTracker.claimable(user1.address)).lt(expandDecimals(1786 + 1191, 18))
    expect(await stakedNlpTracker.claimable(user2.address)).gt(expandDecimals(595, 18))
    expect(await stakedNlpTracker.claimable(user2.address)).lt(expandDecimals(596, 18))

    expect(await esNova.balanceOf(user1.address)).eq(0)
    await rewardRouter.connect(user1).claimEsNova()
    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(1785 + 1190, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(1786 + 1191, 18))

    expect(await eth.balanceOf(user1.address)).eq(0)
    await rewardRouter.connect(user1).claimFees()
    expect(await eth.balanceOf(user1.address)).gt("5940000000000000000")
    expect(await eth.balanceOf(user1.address)).lt("5960000000000000000")

    expect(await esNova.balanceOf(user2.address)).eq(0)
    await rewardRouter.connect(user2).claimEsNova()
    expect(await esNova.balanceOf(user2.address)).gt(expandDecimals(595, 18))
    expect(await esNova.balanceOf(user2.address)).lt(expandDecimals(596, 18))

    expect(await eth.balanceOf(user2.address)).eq(0)
    await rewardRouter.connect(user2).claimFees()
    expect(await eth.balanceOf(user2.address)).gt("1180000000000000000")
    expect(await eth.balanceOf(user2.address)).lt("1200000000000000000")

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    const tx2 = await rewardRouter.connect(user1).compound()
    await reportGasUsed(provider, tx2, "compound gas used")

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    const tx3 = await rewardRouter.batchCompoundForAccounts([user1.address, user2.address])
    await reportGasUsed(provider, tx1, "batchCompoundForAccounts gas used")

    expect(await stakedNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(4165, 18))
    expect(await stakedNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(4167, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(4165, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(4167, 18))

    expect(await bonusNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(4165, 18))
    expect(await bonusNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(4167, 18))

    expect(await feeNovaTracker.stakedAmounts(user1.address)).gt(expandDecimals(4179, 18))
    expect(await feeNovaTracker.stakedAmounts(user1.address)).lt(expandDecimals(4180, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).gt(expandDecimals(4165, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bonusNovaTracker.address)).lt(expandDecimals(4167, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("12900000000000000000") // 12.9
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("13100000000000000000") // 13.1

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq("598300000000000000000") // 598.3
    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq("598300000000000000000")
    expect(await bnb.balanceOf(user1.address)).eq("993676666666666666") // ~0.99
  })

  it("mintAndStakeNlpETH, unstakeAndRedeemNlpETH", async () => {
    const receiver0 = newWallet()
    await expect(rewardRouter.connect(user0).mintAndStakeNlpETH(expandDecimals(300, 18), expandDecimals(300, 18), { value: 0 }))
      .to.be.revertedWith("RewardRouter: invalid msg.value")

    await expect(rewardRouter.connect(user0).mintAndStakeNlpETH(expandDecimals(300, 18), expandDecimals(300, 18), { value: expandDecimals(1, 18) }))
      .to.be.revertedWith("NlpManager: insufficient USDG output")

    await expect(rewardRouter.connect(user0).mintAndStakeNlpETH(expandDecimals(299, 18), expandDecimals(300, 18), { value: expandDecimals(1, 18) }))
      .to.be.revertedWith("NlpManager: insufficient NLP output")

    expect(await bnb.balanceOf(user0.address)).eq(0)
    expect(await bnb.balanceOf(vault.address)).eq(0)
    expect(await bnb.totalSupply()).eq(0)
    expect(await provider.getBalance(bnb.address)).eq(0)
    expect(await stakedNlpTracker.balanceOf(user0.address)).eq(0)

    await rewardRouter.connect(user0).mintAndStakeNlpETH(expandDecimals(299, 18), expandDecimals(299, 18), { value: expandDecimals(1, 18) })

    expect(await bnb.balanceOf(user0.address)).eq(0)
    expect(await bnb.balanceOf(vault.address)).eq(expandDecimals(1, 18))
    expect(await provider.getBalance(bnb.address)).eq(expandDecimals(1, 18))
    expect(await bnb.totalSupply()).eq(expandDecimals(1, 18))
    expect(await stakedNlpTracker.balanceOf(user0.address)).eq("299100000000000000000") // 299.1

    await expect(rewardRouter.connect(user0).unstakeAndRedeemNlpETH(expandDecimals(300, 18), expandDecimals(1, 18), receiver0.address))
      .to.be.revertedWith("RewardTracker: _amount exceeds stakedAmount")

    await expect(rewardRouter.connect(user0).unstakeAndRedeemNlpETH("299100000000000000000", expandDecimals(1, 18), receiver0.address))
      .to.be.revertedWith("NlpManager: cooldown duration not yet passed")

    await increaseTime(provider, 24 * 60 * 60 + 10)

    await expect(rewardRouter.connect(user0).unstakeAndRedeemNlpETH("299100000000000000000", expandDecimals(1, 18), receiver0.address))
      .to.be.revertedWith("NlpManager: insufficient output")

    await rewardRouter.connect(user0).unstakeAndRedeemNlpETH("299100000000000000000", "990000000000000000", receiver0.address)
    expect(await provider.getBalance(receiver0.address)).eq("994009000000000000") // 0.994009
    expect(await bnb.balanceOf(vault.address)).eq("5991000000000000") // 0.005991
    expect(await provider.getBalance(bnb.address)).eq("5991000000000000")
    expect(await bnb.totalSupply()).eq("5991000000000000")
  })
})
