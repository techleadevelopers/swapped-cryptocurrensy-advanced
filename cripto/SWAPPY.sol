// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SWAPPY Token
 * - Fixed supply
 * - 1% transfer fee: 0.5% to treasury, 0.5% burned
 * - No minting/pausing/blacklist
 * - Minimal owner powers: set treasury wallet, manage fee exemptions, optional tx cap toggle
 */
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SWAPPY is ERC20, Ownable {
    // 1% fee (100 bps). Half to treasury, half burned.
    uint256 public constant FEE_BPS = 100;
    uint256 private constant HALF_FEE_BPS = 50;
    uint256 private constant BPS_DEN = 10_000;

    address public treasury;
    bool public maxTxEnabled = true;
    uint256 public maxTxAmount;

    mapping(address => bool) public isFeeExempt;

    event TreasuryUpdated(address indexed treasury);
    event FeeExemptionSet(address indexed account, bool exempt);
    event MaxTxToggled(bool enabled, uint256 maxAmount);

    constructor(
        address _treasury,
        uint256 _initialSupply, // e.g., 1_000_000e18
        uint256 _maxTxAmount // e.g., 20_000e18 (2% of supply) or 0 to disable cap
    ) ERC20("Swappy", "SWAPPY") Ownable(msg.sender) {
        require(_treasury != address(0), "treasury zero");
        treasury = _treasury;
        _mint(msg.sender, _initialSupply);

        if (_maxTxAmount == 0) {
            maxTxEnabled = false;
        } else {
            maxTxAmount = _maxTxAmount;
        }

        // Exempt owner and treasury from fees (avoids double taxing ops)
        isFeeExempt[msg.sender] = true;
        isFeeExempt[_treasury] = true;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "treasury zero");
        treasury = _treasury;
        isFeeExempt[_treasury] = true;
        emit TreasuryUpdated(_treasury);
    }

    function setFeeExempt(address account, bool exempt) external onlyOwner {
        isFeeExempt[account] = exempt;
        emit FeeExemptionSet(account, exempt);
    }

    function toggleMaxTx(bool enabled, uint256 newMax) external onlyOwner {
        if (enabled) {
            require(newMax > 0, "maxTx zero");
            maxTxAmount = newMax;
        }
        maxTxEnabled = enabled;
        emit MaxTxToggled(enabled, maxTxAmount);
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (maxTxEnabled && from != owner() && to != owner()) {
            require(amount <= maxTxAmount, "max tx exceeded");
        }

        // Feeless paths
        if (isFeeExempt[from] || isFeeExempt[to] || amount == 0) {
            super._update(from, to, amount);
            return;
        }

        uint256 fee = (amount * FEE_BPS) / BPS_DEN;
        uint256 toTreasury = (amount * HALF_FEE_BPS) / BPS_DEN;
        uint256 toBurn = fee - toTreasury;

        uint256 sendAmount = amount - fee;

        // Move fee portions
        super._update(from, treasury, toTreasury);
        super._burn(from, toBurn);
        // Transfer remainder
        super._update(from, to, sendAmount);
    }
}
