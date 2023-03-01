const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed } = require("../shared/utilities")

use(solidity)

describe("Bridge", function () {
  const provider = waffle.provider
  const [wallet, user0, user1, user2, user3] = provider.getWallets()
  let nova
  let wnova
  let bridge

  beforeEach(async () => {
    nova = await deployContract("NOVA", [])
    wnova = await deployContract("NOVA", [])
    bridge = await deployContract("Bridge", [nova.address, wnova.address])
  })

  it("wrap, unwrap", async () => {
    await nova.setMinter(wallet.address, true)
    await nova.mint(user0.address, 100)
    await nova.connect(user0).approve(bridge.address, 100)
    await expect(bridge.connect(user0).wrap(200, user1.address))
      .to.be.revertedWith("BaseToken: transfer amount exceeds allowance")

    await expect(bridge.connect(user0).wrap(100, user1.address))
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")

    await wnova.setMinter(wallet.address, true)
    await wnova.mint(bridge.address, 50)

    await expect(bridge.connect(user0).wrap(100, user1.address))
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")

    await wnova.mint(bridge.address, 50)

    expect(await nova.balanceOf(user0.address)).eq(100)
    expect(await nova.balanceOf(bridge.address)).eq(0)
    expect(await wnova.balanceOf(user1.address)).eq(0)
    expect(await wnova.balanceOf(bridge.address)).eq(100)

    await bridge.connect(user0).wrap(100, user1.address)

    expect(await nova.balanceOf(user0.address)).eq(0)
    expect(await nova.balanceOf(bridge.address)).eq(100)
    expect(await wnova.balanceOf(user1.address)).eq(100)
    expect(await wnova.balanceOf(bridge.address)).eq(0)

    await wnova.connect(user1).approve(bridge.address, 100)

    expect(await nova.balanceOf(user2.address)).eq(0)
    expect(await nova.balanceOf(bridge.address)).eq(100)
    expect(await wnova.balanceOf(user1.address)).eq(100)
    expect(await wnova.balanceOf(bridge.address)).eq(0)

    await bridge.connect(user1).unwrap(100, user2.address)

    expect(await nova.balanceOf(user2.address)).eq(100)
    expect(await nova.balanceOf(bridge.address)).eq(0)
    expect(await wnova.balanceOf(user1.address)).eq(0)
    expect(await wnova.balanceOf(bridge.address)).eq(100)
  })

  it("withdrawToken", async () => {
    await nova.setMinter(wallet.address, true)
    await nova.mint(bridge.address, 100)

    await expect(bridge.connect(user0).withdrawToken(nova.address, user1.address, 100))
      .to.be.revertedWith("Governable: forbidden")

    await expect(bridge.connect(user0).setGov(user0.address))
      .to.be.revertedWith("Governable: forbidden")

    await bridge.connect(wallet).setGov(user0.address)

    expect(await nova.balanceOf(user1.address)).eq(0)
    expect(await nova.balanceOf(bridge.address)).eq(100)
    await bridge.connect(user0).withdrawToken(nova.address, user1.address, 100)
    expect(await nova.balanceOf(user1.address)).eq(100)
    expect(await nova.balanceOf(bridge.address)).eq(0)
  })
})
