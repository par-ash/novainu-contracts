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

interface OrderBookReaderInterface extends ethers.utils.Interface {
  functions: {
    "getDecreaseOrders(address,address,uint256[])": FunctionFragment;
    "getIncreaseOrders(address,address,uint256[])": FunctionFragment;
    "getSwapOrders(address,address,uint256[])": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getDecreaseOrders",
    values: [string, string, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getIncreaseOrders",
    values: [string, string, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getSwapOrders",
    values: [string, string, BigNumberish[]]
  ): string;

  decodeFunctionResult(
    functionFragment: "getDecreaseOrders",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getIncreaseOrders",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSwapOrders",
    data: BytesLike
  ): Result;

  events: {};
}

export class OrderBookReader extends BaseContract {
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

  interface: OrderBookReaderInterface;

  functions: {
    getDecreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[], string[]]>;

    getIncreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[], string[]]>;

    getSwapOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[], string[]]>;
  };

  getDecreaseOrders(
    _orderBookAddress: string,
    _account: string,
    _indices: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<[BigNumber[], string[]]>;

  getIncreaseOrders(
    _orderBookAddress: string,
    _account: string,
    _indices: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<[BigNumber[], string[]]>;

  getSwapOrders(
    _orderBookAddress: string,
    _account: string,
    _indices: BigNumberish[],
    overrides?: CallOverrides
  ): Promise<[BigNumber[], string[]]>;

  callStatic: {
    getDecreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[], string[]]>;

    getIncreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[], string[]]>;

    getSwapOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[], string[]]>;
  };

  filters: {};

  estimateGas: {
    getDecreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getIncreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSwapOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getDecreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getIncreaseOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getSwapOrders(
      _orderBookAddress: string,
      _account: string,
      _indices: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
