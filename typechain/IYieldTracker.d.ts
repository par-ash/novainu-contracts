/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface IYieldTrackerInterface extends ethers.utils.Interface {
  functions: {
    "claim(address,address)": FunctionFragment;
    "claimable(address)": FunctionFragment;
    "getTokensPerInterval()": FunctionFragment;
    "updateRewards(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "claim",
    values: [string, string]
  ): string;
  encodeFunctionData(functionFragment: "claimable", values: [string]): string;
  encodeFunctionData(
    functionFragment: "getTokensPerInterval",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "updateRewards",
    values: [string]
  ): string;

  decodeFunctionResult(functionFragment: "claim", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "claimable", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getTokensPerInterval",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateRewards",
    data: BytesLike
  ): Result;

  events: {};
}

export class IYieldTracker extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: IYieldTrackerInterface;

  functions: {
    claim(
      _account: string,
      _receiver: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    claimable(
      _account: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getTokensPerInterval(overrides?: CallOverrides): Promise<[BigNumber]>;

    updateRewards(
      _account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  claim(
    _account: string,
    _receiver: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  claimable(_account: string, overrides?: CallOverrides): Promise<BigNumber>;

  getTokensPerInterval(overrides?: CallOverrides): Promise<BigNumber>;

  updateRewards(
    _account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    claim(
      _account: string,
      _receiver: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    claimable(_account: string, overrides?: CallOverrides): Promise<BigNumber>;

    getTokensPerInterval(overrides?: CallOverrides): Promise<BigNumber>;

    updateRewards(_account: string, overrides?: CallOverrides): Promise<void>;
  };

  filters: {};

  estimateGas: {
    claim(
      _account: string,
      _receiver: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    claimable(_account: string, overrides?: CallOverrides): Promise<BigNumber>;

    getTokensPerInterval(overrides?: CallOverrides): Promise<BigNumber>;

    updateRewards(
      _account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    claim(
      _account: string,
      _receiver: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    claimable(
      _account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTokensPerInterval(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    updateRewards(
      _account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
