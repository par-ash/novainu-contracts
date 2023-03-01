// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/math/SafeMath.sol";
import "../libraries/token/IERC20.sol";
import "../libraries/token/SafeERC20.sol";
import "../libraries/utils/ReentrancyGuard.sol";
import "../libraries/utils/Address.sol";

import "./interfaces/IRewardTracker.sol";
import "../tokens/interfaces/IMintable.sol";
import "../tokens/interfaces/IWETH.sol";
import "../core/interfaces/INlpManager.sol";
import "../access/Governable.sol";

contract RewardRouter is ReentrancyGuard, Governable {
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

    address public stakedNlpTracker;
    address public feeNlpTracker;

    address public nlpManager;

    event StakeNova(address account, uint256 amount);
    event UnstakeNova(address account, uint256 amount);

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
        address _nlpManager
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
        _unstakeNova(msg.sender, nova, _amount);
    }

    function unstakeEsNova(uint256 _amount) external nonReentrant {
        _unstakeNova(msg.sender, esNova, _amount);
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

    function batchCompoundForAccounts(address[] memory _accounts) external nonReentrant onlyGov {
        for (uint256 i = 0; i < _accounts.length; i++) {
            _compound(_accounts[i]);
        }
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

        emit StakeNova(_account, _amount);
    }

    function _unstakeNova(address _account, address _token, uint256 _amount) private {
        require(_amount > 0, "RewardRouter: invalid _amount");

        uint256 balance = IRewardTracker(stakedNovaTracker).stakedAmounts(_account);

        IRewardTracker(feeNovaTracker).unstakeForAccount(_account, bonusNovaTracker, _amount, _account);
        IRewardTracker(bonusNovaTracker).unstakeForAccount(_account, stakedNovaTracker, _amount, _account);
        IRewardTracker(stakedNovaTracker).unstakeForAccount(_account, _token, _amount, _account);

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

        emit UnstakeNova(_account, _amount);
    }
}
