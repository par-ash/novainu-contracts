const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed, print } = require("../shared/utilities")
const { toChainlinkPrice } = require("../shared/chainlink")
const { toUsd, toNormalizedPrice } = require("../shared/units")

use(solidity)

describe("BonusDistributor", function () {
  const provider = waffle.provider
  const [wallet, rewardRouter, user0, user1, user2, user3] = provider.getWallets()
  let nova
  let esNova
  let bnNova
  let stakedNovaTracker
  let stakedNovaDistributor
  let bonusNovaTracker
  let bonusNovaDistributor

  beforeEach(async () => {
    nova = await deployContract("NOVA", []);
    esNova = await deployContract("EsNOVA", []);
    bnNova = await deployContract("MintableBaseToken", ["Bonus NOVA", "bnNOVA", 0]);

    stakedNovaTracker = await deployContract("RewardTracker", ["Staked NOVA", "stNOVA"])
    stakedNovaDistributor = await deployContract("RewardDistributor", [esNova.address, stakedNovaTracker.address])
    await stakedNovaDistributor.updateLastDistributionTime()

    bonusNovaTracker = await deployContract("RewardTracker", ["Staked + Bonus NOVA", "sbNOVA"])
    bonusNovaDistributor = await deployContract("BonusDistributor", [bnNova.address, bonusNovaTracker.address])
    await bonusNovaDistributor.updateLastDistributionTime()

    await stakedNovaTracker.initialize([nova.address, esNova.address], stakedNovaDistributor.address)
    await bonusNovaTracker.initialize([stakedNovaTracker.address], bonusNovaDistributor.address)

    await stakedNovaTracker.setInPrivateTransferMode(true)
    await stakedNovaTracker.setInPrivateStakingMode(true)
    await bonusNovaTracker.setInPrivateTransferMode(true)
    await bonusNovaTracker.setInPrivateStakingMode(true)

    await stakedNovaTracker.setHandler(rewardRouter.address, true)
    await stakedNovaTracker.setHandler(bonusNovaTracker.address, true)
    await bonusNovaTracker.setHandler(rewardRouter.address, true)
    await bonusNovaDistributor.setBonusMultiplier(10000)
  })

  it("distributes bonus", async () => {
    await esNova.setMinter(wallet.address, true)
    await esNova.mint(stakedNovaDistributor.address, expandDecimals(50000, 18))
    await bnNova.setMinter(wallet.address, true)
    await bnNova.mint(bonusNovaDistributor.address, expandDecimals(1500, 18))
    await stakedNovaDistributor.setTokensPerInterval("20667989410000000") // 0.02066798941 esNova per second
    await nova.setMinter(wallet.address, true)
    await nova.mint(user0.address, expandDecimals(1000, 18))

    await nova.connect(user0).approve(stakedNovaTracker.address, expandDecimals(1001, 18))
    await expect(stakedNovaTracker.connect(rewardRouter).stakeForAccount(user0.address, user0.address, nova.address, expandDecimals(1001, 18)))
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")
    await stakedNovaTracker.connect(rewardRouter).stakeForAccount(user0.address, user0.address, nova.address, expandDecimals(1000, 18))
    await expect(bonusNovaTracker.connect(rewardRouter).stakeForAccount(user0.address, user0.address, stakedNovaTracker.address, expandDecimals(1001, 18)))
      .to.be.revertedWith("RewardTracker: transfer amount exceeds balance")
    await bonusNovaTracker.connect(rewardRouter).stakeForAccount(user0.address, user0.address, stakedNovaTracker.address, expandDecimals(1000, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await stakedNovaTracker.claimable(user0.address)).gt(expandDecimals(1785, 18)) // 50000 / 28 => ~1785
    expect(await stakedNovaTracker.claimable(user0.address)).lt(expandDecimals(1786, 18))
    expect(await bonusNovaTracker.claimable(user0.address)).gt("2730000000000000000") // 2.73, 1000 / 365 => ~2.74
    expect(await bonusNovaTracker.claimable(user0.address)).lt("2750000000000000000") // 2.75

    await esNova.mint(user1.address, expandDecimals(500, 18))
    await esNova.connect(user1).approve(stakedNovaTracker.address, expandDecimals(500, 18))
    await stakedNovaTracker.connect(rewardRouter).stakeForAccount(user1.address, user1.address, esNova.address, expandDecimals(500, 18))
    await bonusNovaTracker.connect(rewardRouter).stakeForAccount(user1.address, user1.address, stakedNovaTracker.address, expandDecimals(500, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await stakedNovaTracker.claimable(user0.address)).gt(expandDecimals(1785 + 1190, 18))
    expect(await stakedNovaTracker.claimable(user0.address)).lt(expandDecimals(1786 + 1191, 18))

    expect(await stakedNovaTracker.claimable(user1.address)).gt(expandDecimals(595, 18))
    expect(await stakedNovaTracker.claimable(user1.address)).lt(expandDecimals(596, 18))

    expect(await bonusNovaTracker.claimable(user0.address)).gt("5470000000000000000") // 5.47, 1000 / 365 * 2 => ~5.48
    expect(await bonusNovaTracker.claimable(user0.address)).lt("5490000000000000000") // 5.49

    expect(await bonusNovaTracker.claimable(user1.address)).gt("1360000000000000000") // 1.36, 500 / 365 => ~1.37
    expect(await bonusNovaTracker.claimable(user1.address)).lt("1380000000000000000") // 1.38
  })
})
