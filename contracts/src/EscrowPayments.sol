// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title EscrowPayments
/// @notice Escrow-based task payments between Users and ASPs
contract EscrowPayments {
    struct Escrow {
        address user;
        address asp;
        uint256 amount;
        address token;      // 0xEeee... for native, otherwise ERC20
        uint256 deadline;
        bool released;
        bool refunded;
        address resolver;
    }

    mapping(bytes32 => Escrow) public escrows;
    uint256 public escrowCount;

    event EscrowCreated(bytes32 indexed escrowId, address indexed user, address indexed asp, uint256 amount, uint256 deadline);
    event FundsReleased(bytes32 indexed escrowId, address indexed asp, uint256 amount);
    event FundsRefunded(bytes32 indexed escrowId, address indexed user, uint256 amount);

    /// @notice User deposits funds into escrow
    function createEscrow(
        bytes32 escrowId,
        address asp,
        uint256 deadline
    ) external payable {
        require(asp != address(0), "Invalid ASP");
        require(asp != msg.sender, "Cannot escrow to yourself");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(msg.value > 0, "Must deposit > 0");
        require(escrows[escrowId].amount == 0, "Escrow already exists");

        escrows[escrowId] = Escrow({
            user: msg.sender,
            asp: asp,
            amount: msg.value,
            token: address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE),
            deadline: deadline,
            released: false,
            refunded: false,
            resolver: address(0)
        });
        escrowCount++;

        emit EscrowCreated(escrowId, msg.sender, asp, msg.value, deadline);
    }

    /// @notice User releases payment to ASP
    function releaseFunds(bytes32 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.user, "Only user can release");
        require(!e.released, "Already released");
        require(!e.refunded, "Already refunded");

        e.released = true;
        payable(e.asp).transfer(e.amount);
        emit FundsReleased(escrowId, e.asp, e.amount);
    }

    /// @notice User requests refund (before release)
    function refund(bytes32 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == e.user, "Only user can refund");
        require(!e.released, "Already released");
        require(!e.refunded, "Already refunded");

        e.refunded = true;
        payable(e.user).transfer(e.amount);
        emit FundsRefunded(escrowId, e.user, e.amount);
    }

    /// @notice ASP can claim refund if deadline passed and not released
    function claimExpired(bytes32 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(block.timestamp > e.deadline, "Deadline not passed");
        require(!e.released, "Already released");
        require(!e.refunded, "Already refunded");
        require(msg.sender == e.asp || msg.sender == e.user, "Not authorized");

        e.refunded = true;
        payable(e.user).transfer(e.amount);
        emit FundsRefunded(escrowId, e.user, e.amount);
    }

    /// @notice Get escrow details
    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
}
