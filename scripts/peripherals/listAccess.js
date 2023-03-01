const { contractAt , sendTxn, sleep } = require("../shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")

const network = (process.env.HARDHAT_NETWORK || 'mainnet');


async function getArbValues() {
  const allContractsList = []//require("../../data/contractList/arbitrum.json")
  const contractInfoList = [
    // Vault methods: isManager
    ["Vault", "0x7386da1e66250c55e46310cde79eAd3d84d8A22d", "Vault"],
    // RewardTracker methods: isHandler
    ["StakedNovaTracker", "0xB822144f25d2BA8050f0788313ce8590fa590276", "RewardTracker"],
    ["BonusNovaTracker", "0xFc727bB52E93a7AaF1a3A1e8AF481D4cF190121e", "RewardTracker"],
    ["FeeNovaTracker", "0xa6a0C4D89EA14390dF2120a956567D2dBe6B6Ccb", "RewardTracker"],
    // ["StakedNlpTracker", "0x1aDDD80E6039594eE970E5872D247bf0414C8903", "RewardTracker"],
    // ["FeeNlpTracker", "0x4e971a87900b931fF39d1Aad67697F49835400b6", "RewardTracker"],
    // // Vester methods: isHandler
    // ["NovaVester", "0x199070DDfd1CFb69173aa2F7e20906F26B363004", "Vester"],
    // ["NlpVester", "0xA75287d2f8b217273E7FCD7E86eF07D33972042E", "Vester"],
    // NlpManager methods: isHandler
    ["Old NlpManager", "0x9cb4df2B9b308E195dbeD72934bd063cc67dC743", "NlpManager"],
    ["New NlpManager", "0x9cb4df2B9b308E195dbeD72934bd063cc67dC743", "NlpManager"],
    // MintableBaseToken methods: isHandler, isMinter
    ["NLP", "0xe7a7980CB7bE12baF7bc4f78F6b8f4d065Fa8838", "MintableBaseToken"],
    ["NOVA", "0x0138b52369e2d5b2866c94Eb3b7088B427fFA0FE", "MintableBaseToken"],
    ["ES_NOVA", "0xe957BD4ed43eDFAf7F7b778C502da835dcE32A70", "MintableBaseToken"],
    // ["BN_NOVA", "0x35247165119B69A40edD5304969560D0ef486921", "MintableBaseToken"],
    // USDG methods: vaults
    ["USDG", "0xE852Aaf6386cC5F5f00798A5dD2A3B7dAF4b9Efe", "USDG"],
    // Timelock methods: isHandler
    ["Timelock", "0x60A7EcE40EBAeeAf48B1B4f3e72E9960B58f039A", "Timelock"]
  ]

  return { allContractsList, contractInfoList }
}

async function getAvaxValues() {
  const allContractsList = require("../../data/contractList/avalanche.json")
  const contractInfoList = [
    // Vault methods: isManager
    ["Vault", "0x9ab2De34A33fB459b538c43f251eB825645e8595", "Vault"],
    // RewardTracker methods: isHandler
    ["StakedNovaTracker", "0x2bD10f8E93B3669b6d42E74eEedC65dd1B0a1342", "RewardTracker"],
    ["BonusNovaTracker", "0x908C4D94D34924765f1eDc22A1DD098397c59dD4", "RewardTracker"],
    ["FeeNovaTracker", "0x4d268a7d4C16ceB5a606c173Bd974984343fea13", "RewardTracker"],
    ["StakedNlpTracker", "0x9e295B5B976a184B14aD8cd72413aD846C299660", "RewardTracker"],
    ["FeeNlpTracker", "0xd2D1162512F927a7e282Ef43a362659E4F2a728F", "RewardTracker"],
    // Vester methods: isHandler
    ["NovaVester", "0x472361d3cA5F49c8E633FB50385BfaD1e018b445", "Vester"],
    ["NlpVester", "0x62331A7Bd1dfB3A7642B7db50B5509E57CA3154A", "Vester"],
    // NlpManager methods: isHandler
    ["Old NlpManager", "0xe1ae4d4b06A5Fe1fc288f6B4CD72f9F8323B107F", "NlpManager"],
    ["New NlpManager", "0xD152c7F25db7F4B95b7658323c5F33d176818EE4", "NlpManager"],
    // MintableBaseToken methods: isHandler, isMinter
    ["NLP", "0x01234181085565ed162a948b6a5e88758CD7c7b8", "MintableBaseToken"],
    ["NOVA", "0x62edc0692BD897D2295872a9FFCac5425011c661", "MintableBaseToken"],
    ["ES_NOVA", "0xFf1489227BbAAC61a9209A08929E4c2a526DdD17", "MintableBaseToken"],
    ["BN_NOVA", "0x8087a341D32D445d9aC8aCc9c14F5781E04A26d2", "MintableBaseToken"],
    // USDG methods: vaults
    ["USDG", "0xc0253c3cC6aa5Ab407b5795a04c28fB063273894", "USDG"],
    // Timelock methods: isHandler
    ["Timelock", "0x8Ea12810271a0fD70bBEB8614B8735621abC3718", "Timelock"]
  ]

  return { allContractsList, contractInfoList }
}

async function getValues() {
  if (network === "arbitrum") {
    return getArbValues()
  }

  if (network === "arbitrumTestnet") {
    return getArbValues()
  }

  if (network === "avax") {
    return getAvaxValues()
  }
}

async function getAccessList({ contract, accountList, method }) {
  let index = 0
  const batchSize = 10

  const accessList = []

  while (true) {
    console.log("checking", index)
    const accountListBatch = accountList.slice(index, index + batchSize)
    if (accountListBatch.length === 0) {
      break
    }

    try {
      const promises = accountListBatch.map((account) => contract[method](account.address))
      const results = await Promise.all(promises)

      for (let i = 0; i < results.length; i++) {
        if (results[i] === true) {
          accessList.push(accountListBatch[i].address)
        }
      }
    } catch (e) {
      console.error("error", e)
      await sleep(5000)
    }

    index += batchSize
  }

  return accessList
}

async function main() {
  const {
    allContractsList,
    contractInfoList
  } = await getValues()

  const accessMethods = {
    "Vault": ["isManager"],
    "RewardTracker": ["isHandler"],
    "Vester": ["isHandler"],
    "NlpManager": ["isHandler"],
    "MintableBaseToken": ["isHandler", "isMinter"],
    "USDG": ["vaults"],
    "Timelock": ["isHandler"],
  }

  const contractAccessList = []

  for (let i = 0; i < contractInfoList.length; i++) {
    const contractInfo = contractInfoList[i]
    const [contractLabel, contractAddress, contractName] = contractInfo
    const methods = accessMethods[contractName]
    const contract = await contractAt(contractName, contractAddress)

    for (let j = 0; j < methods.length; j++) {
      const method = methods[j]
      console.log("checking", contractLabel, contractAddress, method)
      const accessList = await getAccessList({
        contract,
        accountList: allContractsList,
        method
      })

      for (let k = 0; k < accessList.length; k++) {
        const accessor = accessList[k]
        console.log(contractLabel, contractAddress, method, accessor)
        contractAccessList.push({
          contractLabel,
          contractAddress,
          method,
          accessor
        })
      }
    }
  }

  for (let i = 0; i < contractAccessList.length; i++) {
    const info = contractAccessList[i]
    console.log([info.contractLabel, info.contractAddress, info.method, info.accessor].join(","))
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
