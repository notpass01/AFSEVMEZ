// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract Casino is Ownable, ReentrancyGuard, VRFConsumerBaseV2 {
    using SafeERC20 for IERC20;

    // ─── Chainlink VRF ───────────────────────────────────────────────────────
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable keyHash;
    uint64  public subscriptionId;
    uint32  private constant CALLBACK_GAS_LIMIT = 200_000;
    uint16  private constant REQUEST_CONFIRMATIONS = 3;
    uint32  private constant NUM_WORDS = 1;

    // ─── Supported tokens ────────────────────────────────────────────────────
    // address(0) = native BNB
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;

    // ─── House edge: 2% ──────────────────────────────────────────────────────
    uint256 public constant HOUSE_EDGE_BPS = 200; // basis points
    uint256 public constant MAX_BET_BPS    = 500; // max bet = 5% of pool

    // ─── Games ───────────────────────────────────────────────────────────────
    enum GameType { ROULETTE, DICE, COIN_FLIP }

    struct BetRequest {
        address player;
        address token;
        uint256 amount;
        GameType game;
        uint256 param1; // roulette: start number | dice: target | coinflip: 0=heads
        uint256 param2; // roulette: end number   | dice: unused | coinflip: unused
        bool    fulfilled;
    }

    mapping(uint256 => BetRequest) public betRequests; // requestId → bet
    mapping(address => BetRecord[]) public history;

    struct BetRecord {
        GameType game;
        address  token;
        uint256  betAmount;
        uint256  payout;
        bool     win;
        uint256  timestamp;
        uint256  resultNumber;
    }

    // ─── Events ──────────────────────────────────────────────────────────────
    event BetPlaced(uint256 indexed requestId, address indexed player, address token, uint256 amount, GameType game);
    event BetResolved(uint256 indexed requestId, address indexed player, bool win, uint256 payout, uint256 result);
    event TokenAdded(address token);
    event TokenRemoved(address token);
    event HouseWithdraw(address token, uint256 amount);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64  _subscriptionId,
        address[] memory _initialTokens
    )
        Ownable(msg.sender)
        VRFConsumerBaseV2(_vrfCoordinator)
    {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash        = _keyHash;
        subscriptionId = _subscriptionId;

        // BNB native always supported
        supportedTokens[address(0)] = true;
        tokenList.push(address(0));

        for (uint i = 0; i < _initialTokens.length; i++) {
            _addToken(_initialTokens[i]);
        }
    }

    // ─── Admin ───────────────────────────────────────────────────────────────
    function addToken(address token) external onlyOwner { _addToken(token); }

    function removeToken(address token) external onlyOwner {
        require(token != address(0), "Cannot remove BNB");
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    function updateSubscription(uint64 _subId) external onlyOwner {
        subscriptionId = _subId;
    }

    function withdrawHouse(address token, uint256 amount) external onlyOwner nonReentrant {
        _transfer(token, owner(), amount);
        emit HouseWithdraw(token, amount);
    }

    // ─── Deposit (owner funds the pool) ──────────────────────────────────────
    function depositPool(address token, uint256 amount) external payable onlyOwner {
        if (token == address(0)) {
            require(msg.value == amount, "BNB mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
    }

    // ─── Play: Roulette (0-36, choose range) ─────────────────────────────────
    function playRoulette(
        address token,
        uint256 amount,
        uint256 start,
        uint256 end
    ) external payable nonReentrant returns (uint256 requestId) {
        require(start <= end && end <= 36, "Invalid range");
        require(start != end || (start == 0), "Range too narrow");
        _validateBet(token, amount);
        requestId = _requestRandom();
        betRequests[requestId] = BetRequest({
            player: msg.sender,
            token: token,
            amount: amount,
            game: GameType.ROULETTE,
            param1: start,
            param2: end,
            fulfilled: false
        });
        emit BetPlaced(requestId, msg.sender, token, amount, GameType.ROULETTE);
    }

    // ─── Play: Dice (1-6, choose number) ─────────────────────────────────────
    function playDice(
        address token,
        uint256 amount,
        uint256 target
    ) external payable nonReentrant returns (uint256 requestId) {
        require(target >= 1 && target <= 6, "Target 1-6");
        _validateBet(token, amount);
        requestId = _requestRandom();
        betRequests[requestId] = BetRequest({
            player: msg.sender,
            token: token,
            amount: amount,
            game: GameType.DICE,
            param1: target,
            param2: 0,
            fulfilled: false
        });
        emit BetPlaced(requestId, msg.sender, token, amount, GameType.DICE);
    }

    // ─── Play: Coin Flip (0=heads, 1=tails) ──────────────────────────────────
    function playCoinFlip(
        address token,
        uint256 amount,
        uint256 side
    ) external payable nonReentrant returns (uint256 requestId) {
        require(side == 0 || side == 1, "0=heads 1=tails");
        _validateBet(token, amount);
        requestId = _requestRandom();
        betRequests[requestId] = BetRequest({
            player: msg.sender,
            token: token,
            amount: amount,
            game: GameType.COIN_FLIP,
            param1: side,
            param2: 0,
            fulfilled: false
        });
        emit BetPlaced(requestId, msg.sender, token, amount, GameType.COIN_FLIP);
    }

    // ─── Chainlink VRF callback ───────────────────────────────────────────────
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        BetRequest storage bet = betRequests[requestId];
        require(!bet.fulfilled, "Already fulfilled");
        bet.fulfilled = true;

        uint256 rand = randomWords[0];
        bool win;
        uint256 payout;
        uint256 result;

        if (bet.game == GameType.ROULETTE) {
            result = rand % 37; // 0-36
            win = (result >= bet.param1 && result <= bet.param2);
            if (win) {
                uint256 range = bet.param2 - bet.param1 + 1;
                uint256 multiplier = 36 / range;
                payout = _applyHouseEdge(bet.amount * multiplier);
            }
        } else if (bet.game == GameType.DICE) {
            result = (rand % 6) + 1; // 1-6
            win = (result == bet.param1);
            if (win) {
                payout = _applyHouseEdge(bet.amount * 6);
            }
        } else if (bet.game == GameType.COIN_FLIP) {
            result = rand % 2; // 0 or 1
            win = (result == bet.param1);
            if (win) {
                payout = _applyHouseEdge(bet.amount * 2);
            }
        }

        uint256 poolBalance = _balance(bet.token);
        if (win && payout > poolBalance) {
            payout = poolBalance;
        }

        if (win && payout > 0) {
            _transfer(bet.token, bet.player, payout);
        } else if (!win) {
            // bet amount already in contract
        }

        history[bet.player].push(BetRecord({
            game: bet.game,
            token: bet.token,
            betAmount: bet.amount,
            payout: payout,
            win: win,
            timestamp: block.timestamp,
            resultNumber: result
        }));

        emit BetResolved(requestId, bet.player, win, payout, result);
    }

    // ─── View ─────────────────────────────────────────────────────────────────
    function getHistory(address player) external view returns (BetRecord[] memory) {
        return history[player];
    }

    function poolBalance(address token) external view returns (uint256) {
        return _balance(token);
    }

    function maxBet(address token) external view returns (uint256) {
        return (_balance(token) * MAX_BET_BPS) / 10_000;
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────
    function _addToken(address token) internal {
        require(!supportedTokens[token], "Already added");
        supportedTokens[token] = true;
        tokenList.push(token);
        emit TokenAdded(token);
    }

    function _validateBet(address token, uint256 amount) internal {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount = 0");
        uint256 max = (_balance(token) * MAX_BET_BPS) / 10_000;
        require(amount <= max, "Bet exceeds max");

        if (token == address(0)) {
            require(msg.value == amount, "BNB amount mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
    }

    function _requestRandom() internal returns (uint256) {
        return vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
    }

    function _applyHouseEdge(uint256 gross) internal pure returns (uint256) {
        return gross - (gross * HOUSE_EDGE_BPS / 10_000);
    }

    function _balance(address token) internal view returns (uint256) {
        if (token == address(0)) return address(this).balance;
        return IERC20(token).balanceOf(address(this));
    }

    function _transfer(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = payable(to).call{value: amount}("");
            require(ok, "BNB transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
