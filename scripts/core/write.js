const { getFrameSigner, deployContract, contractAt, sendTxn } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")

async function main() {
  // const signer = await getFrameSigner()

  // const nlpManager = await contractAt("NlpManager", "0x14fB4767dc9E10F96faaF37Ad24DE3E498cC344B")
  // await sendTxn(nlpManager.setCooldownDuration(10 * 60), "nlpManager.setCooldownDuration")
  // const nova = await contractAt("NOVA", "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", signer)
  // const esNova = await contractAt("EsNOVA", "0xf42Ae1D54fd613C9bb14810b0588FaAa09a426cA")

  // const stakedNovaTracker = await contractAt("RewardTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4")
  // await sendTxn(nova.approve(stakedNovaTracker.address, 0), "nova.approve(stakedNovaTracker)")

  // const rewardRouter = await contractAt("RewardRouter", "0x67b789D48c926006F5132BFCe4e976F0A7A63d5D")
  // await sendTxn(rewardRouter.stakeEsNova(expandDecimals(1, 18)), "rewardRouter.stakeEsNova")

  // const vaultPriceFeed = await contractAt("VaultPriceFeed", "0x30333ce00AC3025276927672aAeFd80f22E89E54")
  // await sendTxn(vaultPriceFeed.setPriceSampleSpace(2), "vaultPriceFeed.setPriceSampleSpace")

  const nova = await contractAt("NOVA", "0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4")
  await sendTxn(nova.approve("0x9Ae12cD385C0Bd35fCE9EA5b729D450fABeeE1a4", 100, { nonce: 714 }), "nova.approve")
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
