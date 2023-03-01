const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed, print, newWallet } = require("../shared/utilities")
const { toChainlinkPrice } = require("../shared/chainlink")
const { toUsd, toNormalizedPrice } = require("../shared/units")
const { initVault, getBnbConfig, getBtcConfig, getDaiConfig } = require("../core/Vault/helpers")

use(solidity)

describe("RewardRouterV2", function () {
  const provider = waffle.provider
  const [wallet, user0, user1, user2, user3, user4, tokenManager] = provider.getWallets()

  const vestingDuration = 365 * 24 * 60 * 60

  let timelock

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

  let novaVester
  let nlpVester

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

    timelock = await deployContract("Timelock", [
      wallet.address, // _admin
      10, // _buffer
      tokenManager.address, // _tokenManager
      tokenManager.address, // _mintReceiver
      nlpManager.address, // _nlpManager
      user0.address, // _rewardRouter
      expandDecimals(1000000, 18), // _maxTokenSupply
      10, // marginFeeBasisPoints
      100 // maxMarginFeeBasisPoints
    ])

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

    novaVester = await deployContract("Vester", [
      "Vested NOVA", // _name
      "vNOVA", // _symbol
      vestingDuration, // _vestingDuration
      esNova.address, // _esToken
      feeNovaTracker.address, // _pairToken
      nova.address, // _claimableToken
      stakedNovaTracker.address, // _rewardTracker
    ])

    nlpVester = await deployContract("Vester", [
      "Vested NLP", // _name
      "vNLP", // _symbol
      vestingDuration, // _vestingDuration
      esNova.address, // _esToken
      stakedNlpTracker.address, // _pairToken
      nova.address, // _claimableToken
      stakedNlpTracker.address, // _rewardTracker
    ])

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

    await esNova.setInPrivateTransferMode(true)

    rewardRouter = await deployContract("RewardRouterV2", [])
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
      nlpManager.address,
      novaVester.address,
      nlpVester.address
    )

    // allow bonusNovaTracker to stake stakedNovaTracker
    await stakedNovaTracker.setHandler(bonusNovaTracker.address, true)
    // allow bonusNovaTracker to stake feeNovaTracker
    await bonusNovaTracker.setHandler(feeNovaTracker.address, true)
    await bonusNovaDistributor.setBonusMultiplier(10000)
    // allow feeNovaTracker to stake bnNova
    await bnNova.setHandler(feeNovaTracker.address, true)

    // allow stakedNlpTracker to stake feeNlpTracker
    await feeNlpTracker.setHandler(stakedNlpTracker.address, true)
    // allow feeNlpTracker to stake nlp
    await nlp.setHandler(feeNlpTracker.address, true)

    // mint esNova for distributors
    await esNova.setMinter(wallet.address, true)
    await esNova.mint(stakedNovaDistributor.address, expandDecimals(50000, 18))
    await stakedNovaDistributor.setTokensPerInterval("20667989410000000") // 0.02066798941 esNova per second
    await esNova.mint(stakedNlpDistributor.address, expandDecimals(50000, 18))
    await stakedNlpDistributor.setTokensPerInterval("20667989410000000") // 0.02066798941 esNova per second

    // mint bnNova for distributor
    await bnNova.setMinter(wallet.address, true)
    await bnNova.mint(bonusNovaDistributor.address, expandDecimals(1500, 18))

    await esNova.setHandler(tokenManager.address, true)
    await novaVester.setHandler(wallet.address, true)

    await esNova.setHandler(rewardRouter.address, true)
    await esNova.setHandler(stakedNovaDistributor.address, true)
    await esNova.setHandler(stakedNlpDistributor.address, true)
    await esNova.setHandler(stakedNovaTracker.address, true)
    await esNova.setHandler(stakedNlpTracker.address, true)
    await esNova.setHandler(novaVester.address, true)
    await esNova.setHandler(nlpVester.address, true)

    await nlpManager.setHandler(rewardRouter.address, true)
    await stakedNovaTracker.setHandler(rewardRouter.address, true)
    await bonusNovaTracker.setHandler(rewardRouter.address, true)
    await feeNovaTracker.setHandler(rewardRouter.address, true)
    await feeNlpTracker.setHandler(rewardRouter.address, true)
    await stakedNlpTracker.setHandler(rewardRouter.address, true)

    await esNova.setHandler(rewardRouter.address, true)
    await bnNova.setMinter(rewardRouter.address, true)
    await esNova.setMinter(novaVester.address, true)
    await esNova.setMinter(nlpVester.address, true)

    await novaVester.setHandler(rewardRouter.address, true)
    await nlpVester.setHandler(rewardRouter.address, true)

    await feeNovaTracker.setHandler(novaVester.address, true)
    await stakedNlpTracker.setHandler(nlpVester.address, true)

    await nlpManager.setGov(timelock.address)
    await stakedNovaTracker.setGov(timelock.address)
    await bonusNovaTracker.setGov(timelock.address)
    await feeNovaTracker.setGov(timelock.address)
    await feeNlpTracker.setGov(timelock.address)
    await stakedNlpTracker.setGov(timelock.address)
    await stakedNovaDistributor.setGov(timelock.address)
    await stakedNlpDistributor.setGov(timelock.address)
    await esNova.setGov(timelock.address)
    await bnNova.setGov(timelock.address)
    await novaVester.setGov(timelock.address)
    await nlpVester.setGov(timelock.address)
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

    expect(await rewardRouter.novaVester()).eq(novaVester.address)
    expect(await rewardRouter.nlpVester()).eq(nlpVester.address)

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
      nlpManager.address,
      novaVester.address,
      nlpVester.address
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

    await timelock.signalMint(esNova.address, tokenManager.address, expandDecimals(500, 18))
    await increaseTime(provider, 20)
    await mineBlock(provider)

    await timelock.processMint(esNova.address, tokenManager.address, expandDecimals(500, 18))
    await esNova.connect(tokenManager).transferFrom(tokenManager.address, user2.address, expandDecimals(500, 18))
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

  it("nova: signalTransfer, acceptTransfer", async () =>{
    await nova.setMinter(wallet.address, true)
    await nova.mint(user1.address, expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(expandDecimals(200, 18))
    await nova.connect(user1).approve(stakedNovaTracker.address, expandDecimals(200, 18))
    await rewardRouter.connect(user1).stakeNova(expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(0)

    await nova.mint(user2.address, expandDecimals(200, 18))
    expect(await nova.balanceOf(user2.address)).eq(expandDecimals(200, 18))
    await nova.connect(user2).approve(stakedNovaTracker.address, expandDecimals(400, 18))
    await rewardRouter.connect(user2).stakeNova(expandDecimals(200, 18))
    expect(await nova.balanceOf(user2.address)).eq(0)

    await rewardRouter.connect(user2).signalTransfer(user1.address)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    await rewardRouter.connect(user2).signalTransfer(user1.address)
    await rewardRouter.connect(user1).claim()

    await expect(rewardRouter.connect(user2).signalTransfer(user1.address))
      .to.be.revertedWith("RewardRouter: stakedNovaTracker.averageStakedAmounts > 0")

    await rewardRouter.connect(user2).signalTransfer(user3.address)

    await expect(rewardRouter.connect(user3).acceptTransfer(user1.address))
      .to.be.revertedWith("RewardRouter: transfer not signalled")

    await novaVester.setBonusRewards(user2.address, expandDecimals(100, 18))

    expect(await stakedNovaTracker.depositBalances(user2.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user2.address, esNova.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user2.address, bnNova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user3.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user3.address, esNova.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user3.address, bnNova.address)).eq(0)
    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).eq(0)
    expect(await novaVester.transferredCumulativeRewards(user3.address)).eq(0)
    expect(await novaVester.bonusRewards(user2.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.bonusRewards(user3.address)).eq(0)
    expect(await novaVester.getCombinedAverageStakedAmount(user2.address)).eq(0)
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).eq(0)
    expect(await novaVester.getMaxVestableAmount(user2.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).eq(0)
    expect(await novaVester.getPairAmount(user2.address, expandDecimals(892, 18))).eq(0)
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(892, 18))).eq(0)

    await rewardRouter.connect(user3).acceptTransfer(user2.address)

    expect(await stakedNovaTracker.depositBalances(user2.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user2.address, esNova.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user2.address, bnNova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user3.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user3.address, esNova.address)).gt(expandDecimals(892, 18))
    expect(await stakedNovaTracker.depositBalances(user3.address, esNova.address)).lt(expandDecimals(893, 18))
    expect(await feeNovaTracker.depositBalances(user3.address, bnNova.address)).gt("547000000000000000") // 0.547
    expect(await feeNovaTracker.depositBalances(user3.address, bnNova.address)).lt("549000000000000000") // 0.548
    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).eq(expandDecimals(200, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).gt(expandDecimals(892, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).lt(expandDecimals(893, 18))
    expect(await novaVester.bonusRewards(user2.address)).eq(0)
    expect(await novaVester.bonusRewards(user3.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user2.address)).eq(expandDecimals(200, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).eq(expandDecimals(200, 18))
    expect(await novaVester.getMaxVestableAmount(user2.address)).eq(0)
    expect(await novaVester.getMaxVestableAmount(user3.address)).gt(expandDecimals(992, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).lt(expandDecimals(993, 18))
    expect(await novaVester.getPairAmount(user2.address, expandDecimals(992, 18))).eq(0)
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(992, 18))).gt(expandDecimals(199, 18))
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(992, 18))).lt(expandDecimals(200, 18))

    await nova.connect(user3).approve(stakedNovaTracker.address, expandDecimals(400, 18))
    await rewardRouter.connect(user3).signalTransfer(user4.address)
    await rewardRouter.connect(user4).acceptTransfer(user3.address)

    expect(await stakedNovaTracker.depositBalances(user3.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user3.address, esNova.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user3.address, bnNova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user4.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user4.address, esNova.address)).gt(expandDecimals(892, 18))
    expect(await stakedNovaTracker.depositBalances(user4.address, esNova.address)).lt(expandDecimals(893, 18))
    expect(await feeNovaTracker.depositBalances(user4.address, bnNova.address)).gt("547000000000000000") // 0.547
    expect(await feeNovaTracker.depositBalances(user4.address, bnNova.address)).lt("549000000000000000") // 0.548
    expect(await novaVester.transferredAverageStakedAmounts(user4.address)).gt(expandDecimals(200, 18))
    expect(await novaVester.transferredAverageStakedAmounts(user4.address)).lt(expandDecimals(201, 18))
    expect(await novaVester.transferredCumulativeRewards(user4.address)).gt(expandDecimals(892, 18))
    expect(await novaVester.transferredCumulativeRewards(user4.address)).lt(expandDecimals(894, 18))
    expect(await novaVester.bonusRewards(user3.address)).eq(0)
    expect(await novaVester.bonusRewards(user4.address)).eq(expandDecimals(100, 18))
    expect(await stakedNovaTracker.averageStakedAmounts(user3.address)).gt(expandDecimals(1092, 18))
    expect(await stakedNovaTracker.averageStakedAmounts(user3.address)).lt(expandDecimals(1094, 18))
    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).eq(0)
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).gt(expandDecimals(1092, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).lt(expandDecimals(1094, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user4.address)).gt(expandDecimals(200, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user4.address)).lt(expandDecimals(201, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).eq(0)
    expect(await novaVester.getMaxVestableAmount(user4.address)).gt(expandDecimals(992, 18))
    expect(await novaVester.getMaxVestableAmount(user4.address)).lt(expandDecimals(993, 18))
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(992, 18))).eq(0)
    expect(await novaVester.getPairAmount(user4.address, expandDecimals(992, 18))).gt(expandDecimals(199, 18))
    expect(await novaVester.getPairAmount(user4.address, expandDecimals(992, 18))).lt(expandDecimals(200, 18))

    await expect(rewardRouter.connect(user4).acceptTransfer(user3.address))
      .to.be.revertedWith("RewardRouter: transfer not signalled")
  })

  it("nova, nlp: signalTransfer, acceptTransfer", async () =>{
    await nova.setMinter(wallet.address, true)
    await nova.mint(novaVester.address, expandDecimals(10000, 18))
    await nova.mint(nlpVester.address, expandDecimals(10000, 18))
    await eth.mint(feeNlpDistributor.address, expandDecimals(100, 18))
    await feeNlpDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(nlpManager.address, expandDecimals(1, 18))
    await rewardRouter.connect(user1).mintAndStakeNlp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await bnb.mint(user2.address, expandDecimals(1, 18))
    await bnb.connect(user2).approve(nlpManager.address, expandDecimals(1, 18))
    await rewardRouter.connect(user2).mintAndStakeNlp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await nova.mint(user1.address, expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(expandDecimals(200, 18))
    await nova.connect(user1).approve(stakedNovaTracker.address, expandDecimals(200, 18))
    await rewardRouter.connect(user1).stakeNova(expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(0)

    await nova.mint(user2.address, expandDecimals(200, 18))
    expect(await nova.balanceOf(user2.address)).eq(expandDecimals(200, 18))
    await nova.connect(user2).approve(stakedNovaTracker.address, expandDecimals(400, 18))
    await rewardRouter.connect(user2).stakeNova(expandDecimals(200, 18))
    expect(await nova.balanceOf(user2.address)).eq(0)

    await rewardRouter.connect(user2).signalTransfer(user1.address)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    await rewardRouter.connect(user2).signalTransfer(user1.address)
    await rewardRouter.connect(user1).compound()

    await expect(rewardRouter.connect(user2).signalTransfer(user1.address))
      .to.be.revertedWith("RewardRouter: stakedNovaTracker.averageStakedAmounts > 0")

    await rewardRouter.connect(user2).signalTransfer(user3.address)

    await expect(rewardRouter.connect(user3).acceptTransfer(user1.address))
      .to.be.revertedWith("RewardRouter: transfer not signalled")

    await novaVester.setBonusRewards(user2.address, expandDecimals(100, 18))

    expect(await stakedNovaTracker.depositBalances(user2.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user2.address, esNova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user3.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user3.address, esNova.address)).eq(0)

    expect(await feeNovaTracker.depositBalances(user2.address, bnNova.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user3.address, bnNova.address)).eq(0)

    expect(await feeNlpTracker.depositBalances(user2.address, nlp.address)).eq("299100000000000000000") // 299.1
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq(0)

    expect(await stakedNlpTracker.depositBalances(user2.address, feeNlpTracker.address)).eq("299100000000000000000") // 299.1
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq(0)

    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).eq(0)
    expect(await novaVester.transferredCumulativeRewards(user3.address)).eq(0)
    expect(await novaVester.bonusRewards(user2.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.bonusRewards(user3.address)).eq(0)
    expect(await novaVester.getCombinedAverageStakedAmount(user2.address)).eq(0)
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).eq(0)
    expect(await novaVester.getMaxVestableAmount(user2.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).eq(0)
    expect(await novaVester.getPairAmount(user2.address, expandDecimals(892, 18))).eq(0)
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(892, 18))).eq(0)

    await rewardRouter.connect(user3).acceptTransfer(user2.address)

    expect(await stakedNovaTracker.depositBalances(user2.address, nova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user2.address, esNova.address)).eq(0)
    expect(await stakedNovaTracker.depositBalances(user3.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user3.address, esNova.address)).gt(expandDecimals(1785, 18))
    expect(await stakedNovaTracker.depositBalances(user3.address, esNova.address)).lt(expandDecimals(1786, 18))

    expect(await feeNovaTracker.depositBalances(user2.address, bnNova.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user3.address, bnNova.address)).gt("547000000000000000") // 0.547
    expect(await feeNovaTracker.depositBalances(user3.address, bnNova.address)).lt("549000000000000000") // 0.548

    expect(await feeNlpTracker.depositBalances(user2.address, nlp.address)).eq(0)
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq("299100000000000000000") // 299.1

    expect(await stakedNlpTracker.depositBalances(user2.address, feeNlpTracker.address)).eq(0)
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq("299100000000000000000") // 299.1

    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).eq(expandDecimals(200, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).gt(expandDecimals(892, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).lt(expandDecimals(893, 18))
    expect(await novaVester.bonusRewards(user2.address)).eq(0)
    expect(await novaVester.bonusRewards(user3.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user2.address)).eq(expandDecimals(200, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).eq(expandDecimals(200, 18))
    expect(await novaVester.getMaxVestableAmount(user2.address)).eq(0)
    expect(await novaVester.getMaxVestableAmount(user3.address)).gt(expandDecimals(992, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).lt(expandDecimals(993, 18))
    expect(await novaVester.getPairAmount(user2.address, expandDecimals(992, 18))).eq(0)
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(992, 18))).gt(expandDecimals(199, 18))
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(992, 18))).lt(expandDecimals(200, 18))
    expect(await novaVester.getPairAmount(user1.address, expandDecimals(892, 18))).gt(expandDecimals(199, 18))
    expect(await novaVester.getPairAmount(user1.address, expandDecimals(892, 18))).lt(expandDecimals(200, 18))

    await rewardRouter.connect(user1).compound()

    await expect(rewardRouter.connect(user3).acceptTransfer(user1.address))
      .to.be.revertedWith("RewardRouter: transfer not signalled")

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    await rewardRouter.connect(user1).claim()
    await rewardRouter.connect(user2).claim()
    await rewardRouter.connect(user3).claim()

    expect(await novaVester.getCombinedAverageStakedAmount(user1.address)).gt(expandDecimals(1092, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user1.address)).lt(expandDecimals(1094, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).gt(expandDecimals(1092, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).lt(expandDecimals(1094, 18))

    expect(await novaVester.getMaxVestableAmount(user2.address)).eq(0)
    expect(await novaVester.getMaxVestableAmount(user3.address)).gt(expandDecimals(1885, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).lt(expandDecimals(1887, 18))
    expect(await novaVester.getMaxVestableAmount(user1.address)).gt(expandDecimals(1785, 18))
    expect(await novaVester.getMaxVestableAmount(user1.address)).lt(expandDecimals(1787, 18))

    expect(await novaVester.getPairAmount(user2.address, expandDecimals(992, 18))).eq(0)
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(1885, 18))).gt(expandDecimals(1092, 18))
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(1885, 18))).lt(expandDecimals(1094, 18))
    expect(await novaVester.getPairAmount(user1.address, expandDecimals(1785, 18))).gt(expandDecimals(1092, 18))
    expect(await novaVester.getPairAmount(user1.address, expandDecimals(1785, 18))).lt(expandDecimals(1094, 18))

    await rewardRouter.connect(user1).compound()
    await rewardRouter.connect(user3).compound()

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(1992, 18))
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(1993, 18))

    await novaVester.connect(user1).deposit(expandDecimals(1785, 18))

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(1991 - 1092, 18)) // 899
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(1993 - 1092, 18)) // 901

    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt(expandDecimals(4, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt(expandDecimals(6, 18))

    await rewardRouter.connect(user1).unstakeNova(expandDecimals(200, 18))
    await expect(rewardRouter.connect(user1).unstakeEsNova(expandDecimals(699, 18)))
      .to.be.revertedWith("RewardTracker: burn amount exceeds balance")

    await rewardRouter.connect(user1).unstakeEsNova(expandDecimals(599, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(97, 18))
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(99, 18))

    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(599, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(601, 18))

    expect(await nova.balanceOf(user1.address)).eq(expandDecimals(200, 18))

    await novaVester.connect(user1).withdraw()

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(1190, 18)) // 1190 - 98 => 1092
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(1191, 18))

    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(2378, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(2380, 18))

    expect(await nova.balanceOf(user1.address)).gt(expandDecimals(204, 18))
    expect(await nova.balanceOf(user1.address)).lt(expandDecimals(206, 18))

    expect(await nlpVester.getMaxVestableAmount(user3.address)).gt(expandDecimals(1785, 18))
    expect(await nlpVester.getMaxVestableAmount(user3.address)).lt(expandDecimals(1787, 18))

    expect(await nlpVester.getPairAmount(user3.address, expandDecimals(1785, 18))).gt(expandDecimals(298, 18))
    expect(await nlpVester.getPairAmount(user3.address, expandDecimals(1785, 18))).lt(expandDecimals(300, 18))

    expect(await stakedNlpTracker.balanceOf(user3.address)).eq("299100000000000000000")

    expect(await esNova.balanceOf(user3.address)).gt(expandDecimals(1785, 18))
    expect(await esNova.balanceOf(user3.address)).lt(expandDecimals(1787, 18))

    expect(await nova.balanceOf(user3.address)).eq(0)

    await nlpVester.connect(user3).deposit(expandDecimals(1785, 18))

    expect(await stakedNlpTracker.balanceOf(user3.address)).gt(0)
    expect(await stakedNlpTracker.balanceOf(user3.address)).lt(expandDecimals(1, 18))

    expect(await esNova.balanceOf(user3.address)).gt(0)
    expect(await esNova.balanceOf(user3.address)).lt(expandDecimals(1, 18))

    expect(await nova.balanceOf(user3.address)).eq(0)

    await expect(rewardRouter.connect(user3).unstakeAndRedeemNlp(
      bnb.address,
      expandDecimals(1, 18),
      0,
      user3.address
    )).to.be.revertedWith("RewardTracker: burn amount exceeds balance")

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    await nlpVester.connect(user3).withdraw()

    expect(await stakedNlpTracker.balanceOf(user3.address)).eq("299100000000000000000")

    expect(await esNova.balanceOf(user3.address)).gt(expandDecimals(1785 - 5, 18))
    expect(await esNova.balanceOf(user3.address)).lt(expandDecimals(1787 - 5, 18))

    expect(await nova.balanceOf(user3.address)).gt(expandDecimals(4, 18))
    expect(await nova.balanceOf(user3.address)).lt(expandDecimals(6, 18))

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(1190, 18))
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(1191, 18))

    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(2379, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(2381, 18))

    expect(await nova.balanceOf(user1.address)).gt(expandDecimals(204, 18))
    expect(await nova.balanceOf(user1.address)).lt(expandDecimals(206, 18))

    await novaVester.connect(user1).deposit(expandDecimals(365 * 2, 18))

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(743, 18)) // 1190 - 743 => 447
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(754, 18))

    expect(await novaVester.claimable(user1.address)).eq(0)

    await increaseTime(provider, 48 * 60 * 60)
    await mineBlock(provider)

    expect(await novaVester.claimable(user1.address)).gt("3900000000000000000") // 3.9
    expect(await novaVester.claimable(user1.address)).lt("4100000000000000000") // 4.1

    await novaVester.connect(user1).deposit(expandDecimals(365, 18))

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(522, 18)) // 743 - 522 => 221
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(524, 18))

    await increaseTime(provider, 48 * 60 * 60)
    await mineBlock(provider)

    expect(await novaVester.claimable(user1.address)).gt("9900000000000000000") // 9.9
    expect(await novaVester.claimable(user1.address)).lt("10100000000000000000") // 10.1

    expect(await nova.balanceOf(user1.address)).gt(expandDecimals(204, 18))
    expect(await nova.balanceOf(user1.address)).lt(expandDecimals(206, 18))

    await novaVester.connect(user1).claim()

    expect(await nova.balanceOf(user1.address)).gt(expandDecimals(214, 18))
    expect(await nova.balanceOf(user1.address)).lt(expandDecimals(216, 18))

    await novaVester.connect(user1).deposit(expandDecimals(365, 18))
    expect(await novaVester.balanceOf(user1.address)).gt(expandDecimals(1449, 18)) // 365 * 4 => 1460, 1460 - 10 => 1450
    expect(await novaVester.balanceOf(user1.address)).lt(expandDecimals(1451, 18))
    expect(await novaVester.getVestedAmount(user1.address)).eq(expandDecimals(1460, 18))

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(303, 18)) // 522 - 303 => 219
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(304, 18))

    await increaseTime(provider, 48 * 60 * 60)
    await mineBlock(provider)

    expect(await novaVester.claimable(user1.address)).gt("7900000000000000000") // 7.9
    expect(await novaVester.claimable(user1.address)).lt("8100000000000000000") // 8.1

    await novaVester.connect(user1).withdraw()

    expect(await feeNovaTracker.balanceOf(user1.address)).gt(expandDecimals(1190, 18))
    expect(await feeNovaTracker.balanceOf(user1.address)).lt(expandDecimals(1191, 18))

    expect(await nova.balanceOf(user1.address)).gt(expandDecimals(222, 18))
    expect(await nova.balanceOf(user1.address)).lt(expandDecimals(224, 18))

    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(2360, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(2362, 18))

    await novaVester.connect(user1).deposit(expandDecimals(365, 18))

    await increaseTime(provider, 500 * 24 * 60 * 60)
    await mineBlock(provider)

    expect(await novaVester.claimable(user1.address)).eq(expandDecimals(365, 18))

    await novaVester.connect(user1).withdraw()

    expect(await nova.balanceOf(user1.address)).gt(expandDecimals(222 + 365, 18))
    expect(await nova.balanceOf(user1.address)).lt(expandDecimals(224 + 365, 18))

    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(2360 - 365, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(2362 - 365, 18))

    expect(await novaVester.transferredAverageStakedAmounts(user2.address)).eq(0)
    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.cumulativeRewards(user2.address)).gt(expandDecimals(892, 18))
    expect(await stakedNovaTracker.cumulativeRewards(user2.address)).lt(expandDecimals(893, 18))
    expect(await stakedNovaTracker.cumulativeRewards(user3.address)).gt(expandDecimals(892, 18))
    expect(await stakedNovaTracker.cumulativeRewards(user3.address)).lt(expandDecimals(893, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).gt(expandDecimals(892, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).lt(expandDecimals(893, 18))
    expect(await novaVester.bonusRewards(user2.address)).eq(0)
    expect(await novaVester.bonusRewards(user3.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user2.address)).eq(expandDecimals(200, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).gt(expandDecimals(1092, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).lt(expandDecimals(1093, 18))
    expect(await novaVester.getMaxVestableAmount(user2.address)).eq(0)
    expect(await novaVester.getMaxVestableAmount(user3.address)).gt(expandDecimals(1884, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).lt(expandDecimals(1886, 18))
    expect(await novaVester.getPairAmount(user2.address, expandDecimals(992, 18))).eq(0)
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(992, 18))).gt(expandDecimals(574, 18))
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(992, 18))).lt(expandDecimals(575, 18))
    expect(await novaVester.getPairAmount(user1.address, expandDecimals(892, 18))).gt(expandDecimals(545, 18))
    expect(await novaVester.getPairAmount(user1.address, expandDecimals(892, 18))).lt(expandDecimals(546, 18))

    const esNovaBatchSender = await deployContract("EsNovaBatchSender", [esNova.address])

    await timelock.signalSetHandler(esNova.address, esNovaBatchSender.address, true)
    await timelock.signalSetHandler(novaVester.address, esNovaBatchSender.address, true)
    await timelock.signalSetHandler(nlpVester.address, esNovaBatchSender.address, true)
    await timelock.signalMint(esNova.address, wallet.address, expandDecimals(1000, 18))

    await increaseTime(provider, 20)
    await mineBlock(provider)

    await timelock.setHandler(esNova.address, esNovaBatchSender.address, true)
    await timelock.setHandler(novaVester.address, esNovaBatchSender.address, true)
    await timelock.setHandler(nlpVester.address, esNovaBatchSender.address, true)
    await timelock.processMint(esNova.address, wallet.address, expandDecimals(1000, 18))

    await esNovaBatchSender.connect(wallet).send(
      novaVester.address,
      4,
      [user2.address, user3.address],
      [expandDecimals(100, 18), expandDecimals(200, 18)]
    )

    expect(await novaVester.transferredAverageStakedAmounts(user2.address)).gt(expandDecimals(37648, 18))
    expect(await novaVester.transferredAverageStakedAmounts(user2.address)).lt(expandDecimals(37649, 18))
    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).gt(expandDecimals(12810, 18))
    expect(await novaVester.transferredAverageStakedAmounts(user3.address)).lt(expandDecimals(12811, 18))
    expect(await novaVester.transferredCumulativeRewards(user2.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).gt(expandDecimals(892 + 200, 18))
    expect(await novaVester.transferredCumulativeRewards(user3.address)).lt(expandDecimals(893 + 200, 18))
    expect(await novaVester.bonusRewards(user2.address)).eq(0)
    expect(await novaVester.bonusRewards(user3.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user2.address)).gt(expandDecimals(3971, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user2.address)).lt(expandDecimals(3972, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).gt(expandDecimals(7943, 18))
    expect(await novaVester.getCombinedAverageStakedAmount(user3.address)).lt(expandDecimals(7944, 18))
    expect(await novaVester.getMaxVestableAmount(user2.address)).eq(expandDecimals(100, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).gt(expandDecimals(1884 + 200, 18))
    expect(await novaVester.getMaxVestableAmount(user3.address)).lt(expandDecimals(1886 + 200, 18))
    expect(await novaVester.getPairAmount(user2.address, expandDecimals(100, 18))).gt(expandDecimals(3971, 18))
    expect(await novaVester.getPairAmount(user2.address, expandDecimals(100, 18))).lt(expandDecimals(3972, 18))
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(1884 + 200, 18))).gt(expandDecimals(7936, 18))
    expect(await novaVester.getPairAmount(user3.address, expandDecimals(1884 + 200, 18))).lt(expandDecimals(7937, 18))

    expect(await nlpVester.transferredAverageStakedAmounts(user4.address)).eq(0)
    expect(await nlpVester.transferredCumulativeRewards(user4.address)).eq(0)
    expect(await nlpVester.bonusRewards(user4.address)).eq(0)
    expect(await nlpVester.getCombinedAverageStakedAmount(user4.address)).eq(0)
    expect(await nlpVester.getMaxVestableAmount(user4.address)).eq(0)
    expect(await nlpVester.getPairAmount(user4.address, expandDecimals(10, 18))).eq(0)

    await esNovaBatchSender.connect(wallet).send(
      nlpVester.address,
      320,
      [user4.address],
      [expandDecimals(10, 18)]
    )

    expect(await nlpVester.transferredAverageStakedAmounts(user4.address)).eq(expandDecimals(3200, 18))
    expect(await nlpVester.transferredCumulativeRewards(user4.address)).eq(expandDecimals(10, 18))
    expect(await nlpVester.bonusRewards(user4.address)).eq(0)
    expect(await nlpVester.getCombinedAverageStakedAmount(user4.address)).eq(expandDecimals(3200, 18))
    expect(await nlpVester.getMaxVestableAmount(user4.address)).eq(expandDecimals(10, 18))
    expect(await nlpVester.getPairAmount(user4.address, expandDecimals(10, 18))).eq(expandDecimals(3200, 18))

    await esNovaBatchSender.connect(wallet).send(
      nlpVester.address,
      320,
      [user4.address],
      [expandDecimals(10, 18)]
    )

    expect(await nlpVester.transferredAverageStakedAmounts(user4.address)).eq(expandDecimals(6400, 18))
    expect(await nlpVester.transferredCumulativeRewards(user4.address)).eq(expandDecimals(20, 18))
    expect(await nlpVester.bonusRewards(user4.address)).eq(0)
    expect(await nlpVester.getCombinedAverageStakedAmount(user4.address)).eq(expandDecimals(6400, 18))
    expect(await nlpVester.getMaxVestableAmount(user4.address)).eq(expandDecimals(20, 18))
    expect(await nlpVester.getPairAmount(user4.address, expandDecimals(10, 18))).eq(expandDecimals(3200, 18))
  })

  it("handleRewards", async () => {
    const timelockV2 = wallet

    // use new rewardRouter, use eth for weth
    const rewardRouterV2 = await deployContract("RewardRouterV2", [])
    await rewardRouterV2.initialize(
      eth.address,
      nova.address,
      esNova.address,
      bnNova.address,
      nlp.address,
      stakedNovaTracker.address,
      bonusNovaTracker.address,
      feeNovaTracker.address,
      feeNlpTracker.address,
      stakedNlpTracker.address,
      nlpManager.address,
      novaVester.address,
      nlpVester.address
    )

    await timelock.signalSetGov(nlpManager.address, timelockV2.address)
    await timelock.signalSetGov(stakedNovaTracker.address, timelockV2.address)
    await timelock.signalSetGov(bonusNovaTracker.address, timelockV2.address)
    await timelock.signalSetGov(feeNovaTracker.address, timelockV2.address)
    await timelock.signalSetGov(feeNlpTracker.address, timelockV2.address)
    await timelock.signalSetGov(stakedNlpTracker.address, timelockV2.address)
    await timelock.signalSetGov(stakedNovaDistributor.address, timelockV2.address)
    await timelock.signalSetGov(stakedNlpDistributor.address, timelockV2.address)
    await timelock.signalSetGov(esNova.address, timelockV2.address)
    await timelock.signalSetGov(bnNova.address, timelockV2.address)
    await timelock.signalSetGov(novaVester.address, timelockV2.address)
    await timelock.signalSetGov(nlpVester.address, timelockV2.address)

    await increaseTime(provider, 20)
    await mineBlock(provider)

    await timelock.setGov(nlpManager.address, timelockV2.address)
    await timelock.setGov(stakedNovaTracker.address, timelockV2.address)
    await timelock.setGov(bonusNovaTracker.address, timelockV2.address)
    await timelock.setGov(feeNovaTracker.address, timelockV2.address)
    await timelock.setGov(feeNlpTracker.address, timelockV2.address)
    await timelock.setGov(stakedNlpTracker.address, timelockV2.address)
    await timelock.setGov(stakedNovaDistributor.address, timelockV2.address)
    await timelock.setGov(stakedNlpDistributor.address, timelockV2.address)
    await timelock.setGov(esNova.address, timelockV2.address)
    await timelock.setGov(bnNova.address, timelockV2.address)
    await timelock.setGov(novaVester.address, timelockV2.address)
    await timelock.setGov(nlpVester.address, timelockV2.address)

    await esNova.setHandler(rewardRouterV2.address, true)
    await esNova.setHandler(stakedNovaDistributor.address, true)
    await esNova.setHandler(stakedNlpDistributor.address, true)
    await esNova.setHandler(stakedNovaTracker.address, true)
    await esNova.setHandler(stakedNlpTracker.address, true)
    await esNova.setHandler(novaVester.address, true)
    await esNova.setHandler(nlpVester.address, true)

    await nlpManager.setHandler(rewardRouterV2.address, true)
    await stakedNovaTracker.setHandler(rewardRouterV2.address, true)
    await bonusNovaTracker.setHandler(rewardRouterV2.address, true)
    await feeNovaTracker.setHandler(rewardRouterV2.address, true)
    await feeNlpTracker.setHandler(rewardRouterV2.address, true)
    await stakedNlpTracker.setHandler(rewardRouterV2.address, true)

    await esNova.setHandler(rewardRouterV2.address, true)
    await bnNova.setMinter(rewardRouterV2.address, true)
    await esNova.setMinter(novaVester.address, true)
    await esNova.setMinter(nlpVester.address, true)

    await novaVester.setHandler(rewardRouterV2.address, true)
    await nlpVester.setHandler(rewardRouterV2.address, true)

    await feeNovaTracker.setHandler(novaVester.address, true)
    await stakedNlpTracker.setHandler(nlpVester.address, true)

    await eth.deposit({ value: expandDecimals(10, 18) })

    await nova.setMinter(wallet.address, true)
    await nova.mint(novaVester.address, expandDecimals(10000, 18))
    await nova.mint(nlpVester.address, expandDecimals(10000, 18))

    await eth.mint(feeNlpDistributor.address, expandDecimals(50, 18))
    await feeNlpDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await eth.mint(feeNovaDistributor.address, expandDecimals(50, 18))
    await feeNovaDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(nlpManager.address, expandDecimals(1, 18))
    await rewardRouterV2.connect(user1).mintAndStakeNlp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await nova.mint(user1.address, expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(expandDecimals(200, 18))
    await nova.connect(user1).approve(stakedNovaTracker.address, expandDecimals(200, 18))
    await rewardRouterV2.connect(user1).stakeNova(expandDecimals(200, 18))
    expect(await nova.balanceOf(user1.address)).eq(0)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await nova.balanceOf(user1.address)).eq(0)
    expect(await esNova.balanceOf(user1.address)).eq(0)
    expect(await bnNova.balanceOf(user1.address)).eq(0)
    expect(await nlp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).eq(0)

    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).eq(0)
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).eq(0)

    await rewardRouterV2.connect(user1).handleRewards(
      true, // _shouldClaimNova
      true, // _shouldStakeNova
      true, // _shouldClaimEsNova
      true, // _shouldStakeEsNova
      true, // _shouldStakeMultiplierPoints
      true, // _shouldClaimWeth
      false // _shouldConvertWethToEth
    )

    expect(await nova.balanceOf(user1.address)).eq(0)
    expect(await esNova.balanceOf(user1.address)).eq(0)
    expect(await bnNova.balanceOf(user1.address)).eq(0)
    expect(await nlp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(7, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(8, 18))

    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(3571, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(3572, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("540000000000000000") // 0.54
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("560000000000000000") // 0.56

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    const ethBalance0 = await provider.getBalance(user1.address)

    await rewardRouterV2.connect(user1).handleRewards(
      false, // _shouldClaimNova
      false, // _shouldStakeNova
      false, // _shouldClaimEsNova
      false, // _shouldStakeEsNova
      false, // _shouldStakeMultiplierPoints
      true, // _shouldClaimWeth
      true // _shouldConvertWethToEth
    )

    const ethBalance1 = await provider.getBalance(user1.address)

    expect(await ethBalance1.sub(ethBalance0)).gt(expandDecimals(7, 18))
    expect(await ethBalance1.sub(ethBalance0)).lt(expandDecimals(8, 18))
    expect(await nova.balanceOf(user1.address)).eq(0)
    expect(await esNova.balanceOf(user1.address)).eq(0)
    expect(await bnNova.balanceOf(user1.address)).eq(0)
    expect(await nlp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(7, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(8, 18))

    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(3571, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(3572, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("540000000000000000") // 0.54
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("560000000000000000") // 0.56

    await rewardRouterV2.connect(user1).handleRewards(
      false, // _shouldClaimNova
      false, // _shouldStakeNova
      true, // _shouldClaimEsNova
      false, // _shouldStakeEsNova
      false, // _shouldStakeMultiplierPoints
      false, // _shouldClaimWeth
      false // _shouldConvertWethToEth
    )

    expect(await ethBalance1.sub(ethBalance0)).gt(expandDecimals(7, 18))
    expect(await ethBalance1.sub(ethBalance0)).lt(expandDecimals(8, 18))
    expect(await nova.balanceOf(user1.address)).eq(0)
    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(3571, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(3572, 18))
    expect(await bnNova.balanceOf(user1.address)).eq(0)
    expect(await nlp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(7, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(8, 18))

    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(3571, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(3572, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("540000000000000000") // 0.54
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("560000000000000000") // 0.56

    await novaVester.connect(user1).deposit(expandDecimals(365, 18))
    await nlpVester.connect(user1).deposit(expandDecimals(365 * 2, 18))

    expect(await ethBalance1.sub(ethBalance0)).gt(expandDecimals(7, 18))
    expect(await ethBalance1.sub(ethBalance0)).lt(expandDecimals(8, 18))
    expect(await nova.balanceOf(user1.address)).eq(0)
    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(3571 - 365 * 3, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(3572 - 365 * 3, 18))
    expect(await bnNova.balanceOf(user1.address)).eq(0)
    expect(await nlp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(7, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(8, 18))

    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(3571, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(3572, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("540000000000000000") // 0.54
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("560000000000000000") // 0.56

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    await rewardRouterV2.connect(user1).handleRewards(
      true, // _shouldClaimNova
      false, // _shouldStakeNova
      false, // _shouldClaimEsNova
      false, // _shouldStakeEsNova
      false, // _shouldStakeMultiplierPoints
      false, // _shouldClaimWeth
      false // _shouldConvertWethToEth
    )

    expect(await ethBalance1.sub(ethBalance0)).gt(expandDecimals(7, 18))
    expect(await ethBalance1.sub(ethBalance0)).lt(expandDecimals(8, 18))
    expect(await nova.balanceOf(user1.address)).gt("2900000000000000000") // 2.9
    expect(await nova.balanceOf(user1.address)).lt("3100000000000000000") // 3.1
    expect(await esNova.balanceOf(user1.address)).gt(expandDecimals(3571 - 365 * 3, 18))
    expect(await esNova.balanceOf(user1.address)).lt(expandDecimals(3572 - 365 * 3, 18))
    expect(await bnNova.balanceOf(user1.address)).eq(0)
    expect(await nlp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(7, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(8, 18))

    expect(await stakedNovaTracker.depositBalances(user1.address, nova.address)).eq(expandDecimals(200, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).gt(expandDecimals(3571, 18))
    expect(await stakedNovaTracker.depositBalances(user1.address, esNova.address)).lt(expandDecimals(3572, 18))
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).gt("540000000000000000") // 0.54
    expect(await feeNovaTracker.depositBalances(user1.address, bnNova.address)).lt("560000000000000000") // 0.56
  })

  it("StakedNlp", async () => {
    await eth.mint(feeNlpDistributor.address, expandDecimals(100, 18))
    await feeNlpDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(nlpManager.address, expandDecimals(1, 18))
    await rewardRouter.connect(user1).mintAndStakeNlp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(2991, 17))

    const stakedNlp = await deployContract("StakedNlp", [nlp.address, nlpManager.address, stakedNlpTracker.address, feeNlpTracker.address])

    await expect(stakedNlp.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("StakedNlp: transfer amount exceeds allowance")

    await stakedNlp.connect(user1).approve(user2.address, expandDecimals(2991, 17))

    await expect(stakedNlp.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("StakedNlp: cooldown duration not yet passed")

    await increaseTime(provider, 24 * 60 * 60 + 10)
    await mineBlock(provider)

    await expect(stakedNlp.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("RewardTracker: forbidden")

    await timelock.signalSetHandler(stakedNlpTracker.address, stakedNlp.address, true)
    await increaseTime(provider, 20)
    await mineBlock(provider)
    await timelock.setHandler(stakedNlpTracker.address, stakedNlp.address, true)

    await expect(stakedNlp.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("RewardTracker: forbidden")

    await timelock.signalSetHandler(feeNlpTracker.address, stakedNlp.address, true)
    await increaseTime(provider, 20)
    await mineBlock(provider)
    await timelock.setHandler(feeNlpTracker.address, stakedNlp.address, true)

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(2991, 17))

    expect(await feeNlpTracker.stakedAmounts(user3.address)).eq(0)
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq(0)

    expect(await stakedNlpTracker.stakedAmounts(user3.address)).eq(0)
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq(0)

    await stakedNlp.connect(user2).transferFrom(user1.address, user3. address, expandDecimals(2991, 17))

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(0)
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(0)

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(0)
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(0)

    expect(await feeNlpTracker.stakedAmounts(user3.address)).eq(expandDecimals(2991, 17))
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user3.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq(expandDecimals(2991, 17))

    await expect(stakedNlp.connect(user2).transferFrom(user3.address, user1.address, expandDecimals(3000, 17)))
      .to.be.revertedWith("StakedNlp: transfer amount exceeds allowance")

    await stakedNlp.connect(user3).approve(user2.address, expandDecimals(3000, 17))

    await expect(stakedNlp.connect(user2).transferFrom(user3.address, user1.address, expandDecimals(3000, 17)))
      .to.be.revertedWith("RewardTracker: _amount exceeds stakedAmount")

    await stakedNlp.connect(user2).transferFrom(user3.address, user1.address, expandDecimals(1000, 17))

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(1000, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(1000, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(1000, 17))

    expect(await feeNlpTracker.stakedAmounts(user3.address)).eq(expandDecimals(1991, 17))
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq(expandDecimals(1991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user3.address)).eq(expandDecimals(1991, 17))
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq(expandDecimals(1991, 17))

    await stakedNlp.connect(user3).transfer(user1.address, expandDecimals(1500, 17))

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2500, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(2500, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2500, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(2500, 17))

    expect(await feeNlpTracker.stakedAmounts(user3.address)).eq(expandDecimals(491, 17))
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq(expandDecimals(491, 17))

    expect(await stakedNlpTracker.stakedAmounts(user3.address)).eq(expandDecimals(491, 17))
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq(expandDecimals(491, 17))

    await expect(stakedNlp.connect(user3).transfer(user1.address, expandDecimals(492, 17)))
      .to.be.revertedWith("RewardTracker: _amount exceeds stakedAmount")

    expect(await bnb.balanceOf(user1.address)).eq(0)

    await rewardRouter.connect(user1).unstakeAndRedeemNlp(
      bnb.address,
      expandDecimals(2500, 17),
      "830000000000000000", // 0.83
      user1.address
    )

    expect(await bnb.balanceOf(user1.address)).eq("830833333333333333")

    await usdg.addVault(nlpManager.address)

    expect(await bnb.balanceOf(user3.address)).eq("0")

    await rewardRouter.connect(user3).unstakeAndRedeemNlp(
      bnb.address,
      expandDecimals(491, 17),
      "160000000000000000", // 0.16
      user3.address
    )

    expect(await bnb.balanceOf(user3.address)).eq("163175666666666666")
  })

  it("FeeNlp", async () => {
    await eth.mint(feeNlpDistributor.address, expandDecimals(100, 18))
    await feeNlpDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(nlpManager.address, expandDecimals(1, 18))
    await rewardRouter.connect(user1).mintAndStakeNlp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(2991, 17))

    const nlpBalance = await deployContract("NlpBalance", [nlpManager.address, stakedNlpTracker.address])

    await expect(nlpBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("NlpBalance: transfer amount exceeds allowance")

    await nlpBalance.connect(user1).approve(user2.address, expandDecimals(2991, 17))

    await expect(nlpBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("NlpBalance: cooldown duration not yet passed")

    await increaseTime(provider, 24 * 60 * 60 + 10)
    await mineBlock(provider)

    await expect(nlpBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("RewardTracker: transfer amount exceeds allowance")

    await timelock.signalSetHandler(stakedNlpTracker.address, nlpBalance.address, true)
    await increaseTime(provider, 20)
    await mineBlock(provider)
    await timelock.setHandler(stakedNlpTracker.address, nlpBalance.address, true)

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.balanceOf(user1.address)).eq(expandDecimals(2991, 17))

    expect(await feeNlpTracker.stakedAmounts(user3.address)).eq(0)
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq(0)

    expect(await stakedNlpTracker.stakedAmounts(user3.address)).eq(0)
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq(0)
    expect(await stakedNlpTracker.balanceOf(user3.address)).eq(0)

    await nlpBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17))

    expect(await feeNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeNlpTracker.depositBalances(user1.address, nlp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedNlpTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.depositBalances(user1.address, feeNlpTracker.address)).eq(expandDecimals(2991, 17))
    expect(await stakedNlpTracker.balanceOf(user1.address)).eq(0)

    expect(await feeNlpTracker.stakedAmounts(user3.address)).eq(0)
    expect(await feeNlpTracker.depositBalances(user3.address, nlp.address)).eq(0)

    expect(await stakedNlpTracker.stakedAmounts(user3.address)).eq(0)
    expect(await stakedNlpTracker.depositBalances(user3.address, feeNlpTracker.address)).eq(0)
    expect(await stakedNlpTracker.balanceOf(user3.address)).eq(expandDecimals(2991, 17))

    await expect(rewardRouter.connect(user1).unstakeAndRedeemNlp(
      bnb.address,
      expandDecimals(2991, 17),
      "0",
      user1.address
    )).to.be.revertedWith("RewardTracker: burn amount exceeds balance")

    await nlpBalance.connect(user3).approve(user2.address, expandDecimals(3000, 17))

    await expect(nlpBalance.connect(user2).transferFrom(user3.address, user1.address, expandDecimals(2992, 17)))
      .to.be.revertedWith("RewardTracker: transfer amount exceeds balance")

    await nlpBalance.connect(user2).transferFrom(user3.address, user1.address, expandDecimals(2991, 17))

    expect(await bnb.balanceOf(user1.address)).eq(0)

    await rewardRouter.connect(user1).unstakeAndRedeemNlp(
      bnb.address,
      expandDecimals(2991, 17),
      "0",
      user1.address
    )

    expect(await bnb.balanceOf(user1.address)).eq("994009000000000000")
  })
})
