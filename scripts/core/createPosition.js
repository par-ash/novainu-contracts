const { contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');

const { HashZero } = ethers.constants

async function getArbValues() {
  const executionFee = "300000000000000"
  const positionRouter = await contractAt("PositionRouter", "0xe1C2e3a8753bA4581656d7E4a01e929E6B36E391")
  const usdc = { address: "0x1a6863f6254308627254a14C06F20f8B952EF167" }
  const usdcDecimals = 6
  const weth = { address: "0xE575d758dDcC6e882aF755d3d678f32635B0D5f2" }

  const increaseLongPositionParams = [
    [usdc.address, weth.address], // _path
    weth.address, // _indexToken
    expandDecimals(20, usdcDecimals), // _amountIn
    0, // _minOut
    toUsd(50), // _sizeDelta
    true, // _isLong
    toUsd(5000), // _acceptablePrice
    executionFee, // _executionFee
    HashZero, // _referralCode
    weth.address
  ]

  const decreaseLongPositionParams = [
    [weth.address], // _collateralToken
    weth.address, // _indexToken
    toUsd(20), // _collateralDelta
    toUsd(50), // _sizeDelta
    true, // _isLong
    "0x72dd3451D585FB7B6f1Ea821b207a684E4190e79",  // _receiver
    toUsd(2900),  // _acceptablePrice
    0, // _minOut
    executionFee, // _executionFee
    true // _withdrawETH
  ]

  return { positionRouter, executionFee, increaseLongPositionParams, decreaseLongPositionParams }
}

async function getAvaxValues() {
  const executionFee = "17000000000000000"
  const positionRouter = await contractAt("PositionRouter", "0x195256074192170d1530527abC9943759c7167d8")
  const usdc = { address: "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664" }
  const usdcDecimals = 6
  const weth = { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB" }

  const increaseLongPositionParams = [
    [usdc.address, weth.address], // _path
    weth.address, // _indexToken
    expandDecimals(20, usdcDecimals), // _amountIn
    0, // _minOut
    toUsd(100), // _sizeDelta
    true, // _isLong
    toUsd(5000), // _acceptablePrice
    executionFee, // _executionFee
    HashZero // _referralCode
  ]

  const decreaseLongPositionParams = [
    [weth.address], // _collateralToken
    weth.address, // _indexToken
    toUsd(0), // _collateralDelta
    toUsd(20), // _sizeDelta
    true, // _isLong
    "0x5F799f365Fa8A2B60ac0429C48B153cA5a6f0Cf8",  // _receiver
    toUsd(2900),  // _acceptablePrice
    0, // _minOut
    executionFee, // _executionFee
    false // _withdrawETH
  ]

  return { positionRouter, executionFee, increaseLongPositionParams, decreaseLongPositionParams }
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
  const { positionRouter, executionFee, increaseLongPositionParams, decreaseLongPositionParams } = await getValues()
  console.log(increaseLongPositionParams)
  let txn;
  txn = await sendTxn(positionRouter.createIncreasePosition(...increaseLongPositionParams, { value: executionFee }), "positionRouter.createIncreasePosition(increaseLongPositionParams)")
  console.log(txn)
  // await sendTxn(positionRouter.createDecreasePosition(...decreaseLongPositionParams, { value: executionFee }), "positionRouter.createDecreasePosition(decreaseLongPositionParams)")
  // await sendTxn(positionRouter.createIncreasePosition(...increaseLongPositionParams, { value: executionFee }), "positionRouter.createIncreasePosition(increaseLongPositionParams)")
  // await sendTxn(positionRouter.createDecreasePosition(...decreaseLongPositionParams, { value: executionFee }), "positionRouter.createDecreasePosition(decreaseLongPositionParams)")
  // await sendTxn(positionRouter.createIncreasePosition(...increaseLongPositionParams, { value: executionFee }), "positionRouter.createIncreasePosition(increaseLongPositionParams)")
  // await sendTxn(positionRouter.createDecreasePosition(...decreaseLongPositionParams, { value: executionFee }), "positionRouter.createDecreasePosition(decreaseLongPositionParams)")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
