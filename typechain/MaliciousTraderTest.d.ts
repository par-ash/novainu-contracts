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
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface MaliciousTraderTestInterface extends ethers.utils.Interface {
  functions: {
    "createIncreasePositionETH(address[],address,uint256,uint256,bool,uint256,uint256,bytes32,address)": FunctionFragment;
    "positionRouter()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "createIncreasePositionETH",
    values: [
      string[],
      string,
      BigNumberish,
      BigNumberish,
      boolean,
      BigNumberish,
      BigNumberish,
      BytesLike,
      string
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "positionRouter",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "createIncreasePositionETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "positionRouter",
    data: BytesLike
  ): Result;

  events: {
    "Received()": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Received"): EventFragment;
}

export class MaliciousTraderTest extends BaseContract {
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

  interface: MaliciousTraderTestInterface;

  functions: {
    createIncreasePositionETH(
      _path: string[],
      _indexToken: string,
      _minOut: BigNumberish,
      _sizeDelta: BigNumberish,
      _isLong: boolean,
      _acceptablePrice: BigNumberish,
      _executionFee: BigNumberish,
      _referralCode: BytesLike,
      _callbackTarget: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    positionRouter(overrides?: CallOverrides): Promise<[string]>;
  };

  createIncreasePositionETH(
    _path: string[],
    _indexToken: string,
    _minOut: BigNumberish,
    _sizeDelta: BigNumberish,
    _isLong: boolean,
    _acceptablePrice: BigNumberish,
    _executionFee: BigNumberish,
    _referralCode: BytesLike,
    _callbackTarget: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  positionRouter(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    createIncreasePositionETH(
      _path: string[],
      _indexToken: string,
      _minOut: BigNumberish,
      _sizeDelta: BigNumberish,
      _isLong: boolean,
      _acceptablePrice: BigNumberish,
      _executionFee: BigNumberish,
      _referralCode: BytesLike,
      _callbackTarget: string,
      overrides?: CallOverrides
    ): Promise<void>;

    positionRouter(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    Received(): TypedEventFilter<[], {}>;
  };

  estimateGas: {
    createIncreasePositionETH(
      _path: string[],
      _indexToken: string,
      _minOut: BigNumberish,
      _sizeDelta: BigNumberish,
      _isLong: boolean,
      _acceptablePrice: BigNumberish,
      _executionFee: BigNumberish,
      _referralCode: BytesLike,
      _callbackTarget: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    positionRouter(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    createIncreasePositionETH(
      _path: string[],
      _indexToken: string,
      _minOut: BigNumberish,
      _sizeDelta: BigNumberish,
      _isLong: boolean,
      _acceptablePrice: BigNumberish,
      _executionFee: BigNumberish,
      _referralCode: BytesLike,
      _callbackTarget: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    positionRouter(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}