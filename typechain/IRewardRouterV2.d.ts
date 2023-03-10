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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface IRewardRouterV2Interface extends ethers.utils.Interface {
  functions: {
    "feeNlpTracker()": FunctionFragment;
    "stakedNlpTracker()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "feeNlpTracker",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "stakedNlpTracker",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "feeNlpTracker",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "stakedNlpTracker",
    data: BytesLike
  ): Result;

  events: {};
}

export class IRewardRouterV2 extends BaseContract {
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

  interface: IRewardRouterV2Interface;

  functions: {
    feeNlpTracker(overrides?: CallOverrides): Promise<[string]>;

    stakedNlpTracker(overrides?: CallOverrides): Promise<[string]>;
  };

  feeNlpTracker(overrides?: CallOverrides): Promise<string>;

  stakedNlpTracker(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    feeNlpTracker(overrides?: CallOverrides): Promise<string>;

    stakedNlpTracker(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    feeNlpTracker(overrides?: CallOverrides): Promise<BigNumber>;

    stakedNlpTracker(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    feeNlpTracker(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    stakedNlpTracker(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
