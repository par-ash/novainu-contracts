// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/math/SafeMath.sol";
import "../libraries/token/IERC20.sol";
import "../libraries/token/SafeERC20.sol";
import "../libraries/utils/ReentrancyGuard.sol";
import "../libraries/utils/Address.sol";

import "./interfaces/IRewardTracker.sol";
import "./interfaces/IRewardRouterV2.sol";
import "./interfaces/IVester.sol";
import "../tokens/interfaces/IMintable.sol";
import "../tokens/interfaces/IWETH.sol";
import "../core/interfaces/INlpManager.sol";
import "../access/Governable.sol";

contract RewardRouterV2 is IRewardRouterV2, ReentrancyGuard, Governable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Address for address payable;

    bool public isInitialized;

    address public weth;

    address public nova;
    address public esNova;
    address public bnNova;

    address public nlp; // NOVA Liquidity Provider token

    address public stakedNovaTracker;
    address public bonusNovaTracker;
    address public feeNovaTracker;

    address public override stakedNlpTracker;
    address public override feeNlpTracker;

    address public nlpManager;

    address public novaVester;
    address public nlpVester;

    mapping (address => address) public pendingReceivers;

    event StakeNova(address account, address token, uint256 amount);
    event UnstakeNova(address account, address token, uint256 amount);

    event StakeNlp(address account, uint256 amount);
    event UnstakeNlp(address account, uint256 amount);

    receive() external payable {
        require(msg.sender == weth, "Router: invalid sender");
    }

    function initialize(
        address _weth,
        address _nova,
        address _esNova,
        address _bnNova,
        address _nlp,
        address _stakedNovaTracker,
        address _bonusNovaTracker,
        address _feeNovaTracker,
        address _feeNlpTracker,
        address _stakedNlpTracker,
        address _nlpManager,
        address _novaVester,
        address _nlpVester
    ) external onlyGov {
        require(!isInitialized, "RewardRouter: already initialized");
        isInitialized = true;

        weth = _weth;

        nova = _nova;
        esNova = _esNova;
        bnNova = _bnNova;

        nlp = _nlp;

        stakedNovaTracker = _stakedNovaTracker;
        bonusNovaTracker = _bonusNovaTracker;
        feeNovaTracker = _feeNovaTracker;

        feeNlpTracker = _feeNlpTracker;
        stakedNlpTracker = _stakedNlpTracker;

        nlpManager = _nlpManager;

        novaVester = _novaVester;
        nlpVester = _nlpVester;
    }

    // to help users who accidentally send their tokens to this contract
    function withdrawToken(address _token, address _account, uint256 _amount) external onlyGov {
        IERC20(_token).safeTransfer(_account, _amount);
    }

    function batchStakeNovaForAccount(address[] memory _accounts, uint256[] memory _amounts) external nonReentrant onlyGov {
        address _nova = nova;
        for (uint256 i = 0; i < _accounts.length; i++) {
            _stakeNova(msg.sender, _accounts[i], _nova, _amounts[i]);
        }
    }

    function stakeNovaForAccount(address _account, uint256 _amount) external nonReentrant onlyGov {
        _stakeNova(msg.sender, _account, nova, _amount);
    }

    function stakeNova(uint256 _amount) external nonReentrant {
        _stakeNova(msg.sender, msg.sender, nova, _amount);
    }

    function stakeEsNova(uint256 _amount) external nonReentrant {
        _stakeNova(msg.sender, msg.sender, esNova, _amount);
    }

    function unstakeNova(uint256 _amount) external nonReentrant {
        _unstakeNova(msg.sender, nova, _amount, true);
    }

    function unstakeEsNova(uint256 _amount) external nonReentrant {
        _unstakeNova(msg.sender, esNova, _amount, true);
    }

    function mintAndStakeNlp(address _token, uint256 _amount, uint256 _minUsdg, uint256 _minNlp) external nonReentrant returns (uint256) {
        require(_amount > 0, "RewardRouter: invalid _amount");

        address account = msg.sender;
        uint256 nlpAmount = INlpManager(nlpManager).addLiquidityForAccount(account, account, _token, _amount, _minUsdg, _minNlp);
        IRewardTracker(feeNlpTracker).stakeForAccount(account, account, nlp, nlpAmount);
        IRewardTracker(stakedNlpTracker).stakeForAccount(account, account, feeNlpTracker, nlpAmount);

        emit StakeNlp(account, nlpAmount);

        return nlpAmount;
    }

    function mintAndStakeNlpETH(uint256 _minUsdg, uint256 _minNlp) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "RewardRouter: invalid msg.value");

        IWETH(weth).deposit{value: msg.value}();
        IERC20(weth).approve(nlpManager, msg.value);

        address account = msg.sender;
        uint256 nlpAmount = INlpManager(nlpManager).addLiquidityForAccount(address(this), account, weth, msg.value, _minUsdg, _minNlp);

        IRewardTracker(feeNlpTracker).stakeForAccount(account, account, nlp, nlpAmount);
        IRewardTracker(stakedNlpTracker).stakeForAccount(account, account, feeNlpTracker, nlpAmount);

        emit StakeNlp(account, nlpAmount);

        return nlpAmount;
    }

    function unstakeAndRedeemNlp(address _tokenOut, uint256 _nlpAmount, uint256 _minOut, address _receiver) external nonReentrant returns (uint256) {
        require(_nlpAmount > 0, "RewardRouter: invalid _nlpAmount");

        address account = msg.sender;
        IRewardTracker(stakedNlpTracker).unstakeForAccount(account, feeNlpTracker, _nlpAmount, account);
        IRewardTracker(feeNlpTracker).unstakeForAccount(account, nlp, _nlpAmount, account);
        uint256 amountOut = INlpManager(nlpManager).removeLiquidityForAccount(account, _tokenOut, _nlpAmount, _minOut, _receiver);

        emit UnstakeNlp(account, _nlpAmount);

        return amountOut;
    }

    function unstakeAndRedeemNlpETH(uint256 _nlpAmount, uint256 _minOut, address payable _receiver) external nonReentrant returns (uint256) {
        require(_nlpAmount > 0, "RewardRouter: invalid _nlpAmount");

        address account = msg.sender;
        IRewardTracker(stakedNlpTracker).unstakeForAccount(account, feeNlpTracker, _nlpAmount, account);
        IRewardTracker(feeNlpTracker).unstakeForAccount(account, nlp, _nlpAmount, account);
        uint256 amountOut = INlpManager(nlpManager).removeLiquidityForAccount(account, weth, _nlpAmount, _minOut, address(this));

        IWETH(weth).withdraw(amountOut);

        _receiver.sendValue(amountOut);

        emit UnstakeNlp(account, _nlpAmount);

        return amountOut;
    }

    function claim() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(feeNovaTracker).claimForAccount(account, account);
        IRewardTracker(feeNlpTracker).claimForAccount(account, account);

        IRewardTracker(stakedNovaTracker).claimForAccount(account, account);
        IRewardTracker(stakedNlpTracker).claimForAccount(account, account);
    }

    function claimEsNova() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(stakedNovaTracker).claimForAccount(account, account);
        IRewardTracker(stakedNlpTracker).claimForAccount(account, account);
    }

    function claimFees() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(feeNovaTracker).claimForAccount(account, account);
        IRewardTracker(feeNlpTracker).claimForAccount(account, account);
    }

    function compound() external nonReentrant {
        _compound(msg.sender);
    }

    function compoundForAccount(address _account) external nonReentrant onlyGov {
        _compound(_account);
    }

    function handleRewards(
        bool _shouldClaimNova,
        bool _shouldStakeNova,
        bool _shouldClaimEsNova,
        bool _shouldStakeEsNova,
        bool _shouldStakeMultiplierPoints,
        bool _shouldClaimWeth,
        bool _shouldConvertWethToEth
    ) external nonReentrant {
        address account = msg.sender;

        uint256 novaAmount = 0;
        if (_shouldClaimNova) {
            uint256 novaAmount0 = IVester(novaVester).claimForAccount(account, account);
            uint256 novaAmount1 = IVester(nlpVester).claimForAccount(account, account);
            novaAmount = novaAmount0.add(novaAmount1);
        }

        if (_shouldStakeNova && novaAmount > 0) {
            _stakeNova(account, account, nova, novaAmount);
        }

        uint256 esNovaAmount = 0;
        if (_shouldClaimEsNova) {
            uint256 esNovaAmount0 = IRewardTracker(stakedNovaTracker).claimForAccount(account, account);
            uint256 esNovaAmount1 = IRewardTracker(stakedNlpTracker).claimForAccount(account, account);
            esNovaAmount = esNovaAmount0.add(esNovaAmount1);
        }

        if (_shouldStakeEsNova && esNovaAmount > 0) {
            _stakeNova(account, account, esNova, esNovaAmount);
        }

        if (_shouldStakeMultiplierPoints) {
            uint256 bnNovaAmount = IRewardTracker(bonusNovaTracker).claimForAccount(account, account);
            if (bnNovaAmount > 0) {
                IRewardTracker(feeNovaTracker).stakeForAccount(account, account, bnNova, bnNovaAmount);
            }
        }

        if (_shouldClaimWeth) {
            if (_shouldConvertWethToEth) {
                uint256 weth0 = IRewardTracker(feeNovaTracker).claimForAccount(account, address(this));
                uint256 weth1 = IRewardTracker(feeNlpTracker).claimForAccount(account, address(this));

                uint256 wethAmount = weth0.add(weth1);
                IWETH(weth).withdraw(wethAmount);

                payable(account).sendValue(wethAmount);
            } else {
                IRewardTracker(feeNovaTracker).claimForAccount(account, account);
                IRewardTracker(feeNlpTracker).claimForAccount(account, account);
            }
        }
    }

    function batchCompoundForAccounts(address[] memory _accounts) external nonReentrant onlyGov {
        for (uint256 i = 0; i < _accounts.length; i++) {
            _compound(_accounts[i]);
        }
    }

    function signalTransfer(address _receiver) external nonReentrant {
        require(IERC20(novaVester).balanceOf(msg.sender) == 0, "RewardRouter: sender has vested tokens");
        require(IERC20(nlpVester).balanceOf(msg.sender) == 0, "RewardRouter: sender has vested tokens");

        _validateReceiver(_receiver);
        pendingReceivers[msg.sender] = _receiver;
    }

    function acceptTransfer(address _sender) external nonReentrant {
        require(IERC20(novaVester).balanceOf(_sender) == 0, "RewardRouter: sender has vested tokens");
        require(IERC20(nlpVester).balanceOf(_sender) == 0, "RewardRouter: sender has vested tokens");

        address receiver = msg.sender;
        require(pendingReceivers[_sender] == receiver, "RewardRouter: transfer not signalled");
        delete pendingReceivers[_sender];

        _validateReceiver(receiver);
        _compound(_sender);

        uint256 stakedNova = IRewardTracker(stakedNovaTracker).depositBalances(_sender, nova);
        if (stakedNova > 0) {
            _unstakeNova(_sender, nova, stakedNova, false);
            _stakeNova(_sender, receiver, nova, stakedNova);
        }

        uint256 stakedEsNova = IRewardTracker(stakedNovaTracker).depositBalances(_sender, esNova);
        if (stakedEsNova > 0) {
            _unstakeNova(_sender, esNova, stakedEsNova, false);
            _stakeNova(_sender, receiver, esNova, stakedEsNova);
        }

        uint256 stakedBnNova = IRewardTracker(feeNovaTracker).depositBalances(_sender, bnNova);
        if (stakedBnNova > 0) {
            IRewardTracker(feeNovaTracker).unstakeForAccount(_sender, bnNova, stakedBnNova, _sender);
            IRewardTracker(feeNovaTracker).stakeForAccount(_sender, receiver, bnNova, stakedBnNova);
        }

        uint256 esNovaBalance = IERC20(esNova).balanceOf(_sender);
        if (esNovaBalance > 0) {
            IERC20(esNova).transferFrom(_sender, receiver, esNovaBalance);
        }

        uint256 nlpAmount = IRewardTracker(feeNlpTracker).depositBalances(_sender, nlp);
        if (nlpAmount > 0) {
            IRewardTracker(stakedNlpTracker).unstakeForAccount(_sender, feeNlpTracker, nlpAmount, _sender);
            IRewardTracker(feeNlpTracker).unstakeForAccount(_sender, nlp, nlpAmount, _sender);

            IRewardTracker(feeNlpTracker).stakeForAccount(_sender, receiver, nlp, nlpAmount);
            IRewardTracker(stakedNlpTracker).stakeForAccount(receiver, receiver, feeNlpTracker, nlpAmount);
        }

        IVester(novaVester).transferStakeValues(_sender, receiver);
        IVester(nlpVester).transferStakeValues(_sender, receiver);
    }

    function _validateReceiver(address _receiver) private view {
        require(IRewardTracker(stakedNovaTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: stakedNovaTracker.averageStakedAmounts > 0");
        require(IRewardTracker(stakedNovaTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: stakedNovaTracker.cumulativeRewards > 0");

        require(IRewardTracker(bonusNovaTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: bonusNovaTracker.averageStakedAmounts > 0");
        require(IRewardTracker(bonusNovaTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: bonusNovaTracker.cumulativeRewards > 0");

        require(IRewardTracker(feeNovaTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: feeNovaTracker.averageStakedAmounts > 0");
        require(IRewardTracker(feeNovaTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: feeNovaTracker.cumulativeRewards > 0");

        require(IVester(novaVester).transferredAverageStakedAmounts(_receiver) == 0, "RewardRouter: novaVester.transferredAverageStakedAmounts > 0");
        require(IVester(novaVester).transferredCumulativeRewards(_receiver) == 0, "RewardRouter: novaVester.transferredCumulativeRewards > 0");

        require(IRewardTracker(stakedNlpTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: stakedNlpTracker.averageStakedAmounts > 0");
        require(IRewardTracker(stakedNlpTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: stakedNlpTracker.cumulativeRewards > 0");

        require(IRewardTracker(feeNlpTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: feeNlpTracker.averageStakedAmounts > 0");
        require(IRewardTracker(feeNlpTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: feeNlpTracker.cumulativeRewards > 0");

        require(IVester(nlpVester).transferredAverageStakedAmounts(_receiver) == 0, "RewardRouter: novaVester.transferredAverageStakedAmounts > 0");
        require(IVester(nlpVester).transferredCumulativeRewards(_receiver) == 0, "RewardRouter: novaVester.transferredCumulativeRewards > 0");

        require(IERC20(novaVester).balanceOf(_receiver) == 0, "RewardRouter: novaVester.balance > 0");
        require(IERC20(nlpVester).balanceOf(_receiver) == 0, "RewardRouter: nlpVester.balance > 0");
    }

    function _compound(address _account) private {
        _compoundNova(_account);
        _compoundNlp(_account);
    }

    function _compoundNova(address _account) private {
        uint256 esNovaAmount = IRewardTracker(stakedNovaTracker).claimForAccount(_account, _account);
        if (esNovaAmount > 0) {
            _stakeNova(_account, _account, esNova, esNovaAmount);
        }

        uint256 bnNovaAmount = IRewardTracker(bonusNovaTracker).claimForAccount(_account, _account);
        if (bnNovaAmount > 0) {
            IRewardTracker(feeNovaTracker).stakeForAccount(_account, _account, bnNova, bnNovaAmount);
        }
    }

    function _compoundNlp(address _account) private {
        uint256 esNovaAmount = IRewardTracker(stakedNlpTracker).claimForAccount(_account, _account);
        if (esNovaAmount > 0) {
            _stakeNova(_account, _account, esNova, esNovaAmount);
        }
    }

    function _stakeNova(address _fundingAccount, address _account, address _token, uint256 _amount) private {
        require(_amount > 0, "RewardRouter: invalid _amount");

        IRewardTracker(stakedNovaTracker).stakeForAccount(_fundingAccount, _account, _token, _amount);
        IRewardTracker(bonusNovaTracker).stakeForAccount(_account, _account, stakedNovaTracker, _amount);
        IRewardTracker(feeNovaTracker).stakeForAccount(_account, _account, bonusNovaTracker, _amount);

        emit StakeNova(_account, _token, _amount);
    }

    function _unstakeNova(address _account, address _token, uint256 _amount, bool _shouldReduceBnNova) private {
        require(_amount > 0, "RewardRouter: invalid _amount");

        uint256 balance = IRewardTracker(stakedNovaTracker).stakedAmounts(_account);

        IRewardTracker(feeNovaTracker).unstakeForAccount(_account, bonusNovaTracker, _amount, _account);
        IRewardTracker(bonusNovaTracker).unstakeForAccount(_account, stakedNovaTracker, _amount, _account);
        IRewardTracker(stakedNovaTracker).unstakeForAccount(_account, _token, _amount, _account);

        if (_shouldReduceBnNova) {
            uint256 bnNovaAmount = IRewardTracker(bonusNovaTracker).claimForAccount(_account, _account);
            if (bnNovaAmount > 0) {
                IRewardTracker(feeNovaTracker).stakeForAccount(_account, _account, bnNova, bnNovaAmount);
            }

            uint256 stakedBnNova = IRewardTracker(feeNovaTracker).depositBalances(_account, bnNova);
            if (stakedBnNova > 0) {
                uint256 reductionAmount = stakedBnNova.mul(_amount).div(balance);
                IRewardTracker(feeNovaTracker).unstakeForAccount(_account, bnNova, reductionAmount, _account);
                IMintable(bnNova).burn(_account, reductionAmount);
            }
        }

        emit UnstakeNova(_account, _token, _amount);
    }
}
