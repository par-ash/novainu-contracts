/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ShortsTracker, ShortsTrackerInterface } from "../ShortsTracker";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_vault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "globalShortSize",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "globalShortAveragePrice",
        type: "uint256",
      },
    ],
    name: "GlobalShortDataUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_INT256",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_averagePrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_nextPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_nextSize",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_delta",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "_realisedPnl",
        type: "int256",
      },
    ],
    name: "_getNextGlobalAveragePrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "data",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
    ],
    name: "getGlobalShortDelta",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "address",
        name: "_collateralToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_indexToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_nextPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_sizeDelta",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_isIncrease",
        type: "bool",
      },
    ],
    name: "getNextGlobalShortData",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "address",
        name: "_collateralToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_indexToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_sizeDelta",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_isIncrease",
        type: "bool",
      },
    ],
    name: "getRealisedPnl",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "globalShortAveragePrices",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "gov",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isGlobalShortDataReady",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isHandler",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_gov",
        type: "address",
      },
    ],
    name: "setGov",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_handler",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isActive",
        type: "bool",
      },
    ],
    name: "setHandler",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_tokens",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "_averagePrices",
        type: "uint256[]",
      },
    ],
    name: "setInitData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "value",
        type: "bool",
      },
    ],
    name: "setIsGlobalShortDataReady",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "address",
        name: "_collateralToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_indexToken",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isLong",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "_sizeDelta",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_markPrice",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_isIncrease",
        type: "bool",
      },
    ],
    name: "updateGlobalShortData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "vault",
    outputs: [
      {
        internalType: "contract IVault",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516111483803806111488339818101604052602081101561003357600080fd5b5051600080546001600160a01b03199081163317909155600180546001600160a01b03909316929091169190911790556110d6806100726000396000f3fe608060405234801561001057600080fd5b50600436106100d05760003560e01c80630147fb0c146100d5578063122e7b071461010457806312d43a511461010c5780633d30cabf1461013057806346ea87af146101515780635886b7111461018b57806362749803146101c05780639a11178f146101e65780639cb7de4b146101ee5780639cdeb5931461021c578063a83b75fd1461027f578063b364accb146102c3578063bbd9718714610304578063cfad57a2146103c2578063f3238cec146103e8578063fbfa77cf1461043a575b600080fd5b6100f2600480360360208110156100eb57600080fd5b5035610442565b60408051918252519081900360200190f35b6100f2610454565b61011461045f565b604080516001600160a01b039092168252519081900360200190f35b61014f6004803603602081101561014657600080fd5b5035151561046e565b005b6101776004803603602081101561016757600080fd5b50356001600160a01b03166104ce565b604080519115158252519081900360200190f35b6100f2600480360360a08110156101a157600080fd5b50803590602081013590604081013590606081013590608001356104e3565b6100f2600480360360208110156101d657600080fd5b50356001600160a01b031661053a565b61017761054c565b61014f6004803603604081101561020457600080fd5b506001600160a01b0381351690602001351515610555565b610266600480360360c081101561023257600080fd5b506001600160a01b03813581169160208101358216916040820135169060608101359060808101359060a001351515610628565b6040805192835260208301919091528051918290030190f35b6100f2600480360360a081101561029557600080fd5b506001600160a01b03813581169160208101358216916040820135169060608101359060800135151561077c565b6102e9600480360360208110156102d957600080fd5b50356001600160a01b031661095c565b60408051921515835260208301919091528051918290030190f35b61014f6004803603604081101561031a57600080fd5b810190602081018135600160201b81111561033457600080fd5b82018360208201111561034657600080fd5b803590602001918460208302840111600160201b8311171561036757600080fd5b919390929091602081019035600160201b81111561038457600080fd5b82018360208201111561039657600080fd5b803590602001918460208302840111600160201b831117156103b757600080fd5b509092509050610acf565b61014f600480360360208110156103d857600080fd5b50356001600160a01b0316610be1565b61014f600480360360e08110156103fe57600080fd5b506001600160a01b038135811691602081013582169160408201351690606081013515159060808101359060a08101359060c001351515610c50565b610114610d40565b60036020526000908152604090205481565b6001600160ff1b0381565b6000546001600160a01b031681565b6000546001600160a01b031633146104bb576040805162461bcd60e51b81526020600482015260156024820152600080516020611060833981519152604482015290519081900360640190fd5b6005805460ff1916911515919091179055565b60026020526000908152604090205460ff1681565b60008060006104f485898987610d4f565b91509150600061052b836105115761050c8884610e0c565b61051b565b61051b8884610e6d565b6105258a8a610eaf565b90610f08565b93505050505b95945050505050565b60046020526000908152604090205481565b60055460ff1681565b6000546001600160a01b031633146105a2576040805162461bcd60e51b81526020600482015260156024820152600080516020611060833981519152604482015290519081900360640190fd5b6001600160a01b0382166105fd576040805162461bcd60e51b815260206004820152601f60248201527f53686f727473547261636b65723a20696e76616c6964205f68616e646c657200604482015290519081900360640190fd5b6001600160a01b03919091166000908152600260205260409020805460ff1916911515919091179055565b600080600061063a898989888861077c565b6001600160a01b03881660009081526004602052604081205491925087821161066c576106678883610e6d565b610676565b6106768289610e6d565b6001546040805163114f1b5560e31b81526001600160a01b038d811660048301529151939450600093849384931691638a78daa8916024808301926020929190829003018186803b1580156106ca57600080fd5b505afa1580156106de573d6000803e3d6000fd5b505050506040513d60208110156106f457600080fd5b505190508861070c57610707818b610e6d565b610716565b610716818b610e0c565b92508261072f5760008097509750505050505050610771565b8461074557828b97509750505050505050610771565b610753856105258387610eaf565b9150506000610765858c85858a6104e3565b92975091955050505050505b965096945050505050565b6000811561078c57506000610531565b60015460408051634a3f088d60e01b81526001600160a01b038981166004830152888116602483015287811660448301526000606483018190529251931692829182918591634a3f088d91608480830192610100929190829003018186803b1580156107f757600080fd5b505afa15801561080b573d6000803e3d6000fd5b505050506040513d61010081101561082257600080fd5b50805160408083015160e0909301518151635c07eaab60e01b81526001600160a01b038d811660048301526024820185905260448201869052600060648301819052608483018490528451959950959750919550849391891692635c07eaab9260a480840193829003018186803b15801561089c57600080fd5b505afa1580156108b0573d6000803e3d6000fd5b505050506040513d60408110156108c657600080fd5b508051602090910151909250905060006108e4866105258c85610eaf565b90506001600160ff1b03811061093b576040805162461bcd60e51b815260206004820152601760248201527653686f727473547261636b65723a206f766572666c6f7760481b604482015290519081900360640190fd5b82610949578060000361094b565b805b9d9c50505050505050505050505050565b6001546040805163114f1b5560e31b81526001600160a01b038481166004830152915160009384938493911691638a78daa891602480820192602092909190829003018186803b1580156109af57600080fd5b505afa1580156109c3573d6000803e3d6000fd5b505050506040513d60208110156109d957600080fd5b50516001600160a01b03851660009081526004602052604090205490915081610a0a57600080935093505050610aca565b60015460408051637092736960e11b81526001600160a01b0388811660048301529151600093929092169163e124e6d291602480820192602092909190829003018186803b158015610a5b57600080fd5b505afa158015610a6f573d6000803e3d6000fd5b505050506040513d6020811015610a8557600080fd5b505190506000818311610aa157610a9c8284610e6d565b610aab565b610aab8383610e6d565b90506000610abd846105258785610eaf565b9290931195509093505050505b915091565b6000546001600160a01b03163314610b1c576040805162461bcd60e51b81526020600482015260156024820152600080516020611060833981519152604482015290519081900360640190fd5b60055460ff1615610b74576040805162461bcd60e51b815260206004820152601f60248201527f53686f727473547261636b65723a20616c7265616479206d6967726174656400604482015290519081900360640190fd5b60005b83811015610bcd57828282818110610b8b57fe5b9050602002013560046000878785818110610ba257fe5b602090810292909201356001600160a01b031683525081019190915260400160002055600101610b77565b50506005805460ff19166001179055505050565b6000546001600160a01b03163314610c2e576040805162461bcd60e51b81526020600482015260156024820152600080516020611060833981519152604482015290519081900360640190fd5b600080546001600160a01b0319166001600160a01b0392909216919091179055565b3360009081526002602052604090205460ff16610caf576040805162461bcd60e51b815260206004820152601860248201527729b437b93a39aa3930b1b5b2b91d103337b93134b23232b760411b604482015290519081900360640190fd5b8380610cb9575082155b15610cc357610d37565b60055460ff16610cd257610d37565b600080610ce3898989878988610628565b91509150610cf18782610f47565b604080518381526020810183905281516001600160a01b038a16927fd6137be44db128ffcf1ea1821dbe8f889f67f949be7656c2d8acba2a4a891a02928290030190a250505b50505050505050565b6001546001600160a01b031681565b6000808385118015610dae576000841315610d935786841115610d8157610d768488610e6d565b965060009050610d8e565b610d8b8785610e6d565b96505b610da4565b610da1876000869003610e0c565b96505b9150859050610e03565b6000841315610dc857610dc18785610e0c565b9650610dfd565b86846000031115610dec57610de1600085900388610e6d565b965060019050610dfd565b610dfa876000869003610e6d565b96505b91508590505b94509492505050565b600082820183811015610e64576040805162461bcd60e51b815260206004820152601b60248201527a536166654d6174683a206164646974696f6e206f766572666c6f7760281b604482015290519081900360640190fd5b90505b92915050565b6000610e6483836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f770000815250610f63565b600082610ebe57506000610e67565b82820282848281610ecb57fe5b0414610e645760405162461bcd60e51b81526004018080602001828103825260218152602001806110806021913960400191505060405180910390fd5b6000610e6483836040518060400160405280601a815260200179536166654d6174683a206469766973696f6e206279207a65726f60301b815250610ffa565b6001600160a01b03909116600090815260046020526040902055565b60008184841115610ff25760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610fb7578181015183820152602001610f9f565b50505050905090810190601f168015610fe45780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b600081836110495760405162461bcd60e51b8152602060048201818152835160248401528351909283926044909101919085019080838360008315610fb7578181015183820152602001610f9f565b50600083858161105557fe5b049594505050505056fe476f7665726e61626c653a20666f7262696464656e0000000000000000000000536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a2646970667358221220d636817890fba7921f5a40b156bf283b67098588f4f4e411d60e1f657522782c64736f6c634300060c0033";

export class ShortsTracker__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _vault: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ShortsTracker> {
    return super.deploy(_vault, overrides || {}) as Promise<ShortsTracker>;
  }
  getDeployTransaction(
    _vault: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_vault, overrides || {});
  }
  attach(address: string): ShortsTracker {
    return super.attach(address) as ShortsTracker;
  }
  connect(signer: Signer): ShortsTracker__factory {
    return super.connect(signer) as ShortsTracker__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ShortsTrackerInterface {
    return new utils.Interface(_abi) as ShortsTrackerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ShortsTracker {
    return new Contract(address, _abi, signerOrProvider) as ShortsTracker;
  }
}