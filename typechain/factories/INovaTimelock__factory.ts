/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { INovaTimelock, INovaTimelockInterface } from "../INovaTimelock";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_admin",
        type: "address",
      },
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_vault",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isLeverageEnabled",
        type: "bool",
      },
    ],
    name: "setIsLeverageEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_target",
        type: "address",
      },
      {
        internalType: "address",
        name: "_gov",
        type: "address",
      },
    ],
    name: "signalSetGov",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class INovaTimelock__factory {
  static readonly abi = _abi;
  static createInterface(): INovaTimelockInterface {
    return new utils.Interface(_abi) as INovaTimelockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): INovaTimelock {
    return new Contract(address, _abi, signerOrProvider) as INovaTimelock;
  }
}
