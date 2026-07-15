// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title SLAEnforcement
/// @notice SLA enforcement with slashing for ASPs that fail to deliver
contract SLAEnforcement {
    struct SLA {
        address user;
        address asp;
        uint256 stake;          // Amount the ASP staked
        uint256 deadline;       // Unix timestamp
        bytes32 deliverableHash; // keccak256 of the deliverable spec
        bool delivered;
        bool disputed;
        bool resolved;
        address resolver;       // Evaluator who resolved the dispute
    }

    mapping(bytes32 => SLA) public slas;
    uint256 public slaCount;

    event SLACreated(bytes32 indexed slaId, address indexed user, address indexed asp, uint256 stake, uint256 deadline);
    event Delivered(bytes32 indexed slaId);
    event Disputed(bytes32 indexed slaId, string reason);
    event Resolved(bytes32 indexed slaId, address resolver, bool aspAtFault, uint256 slashAmount);
    event StakeWithdrawn(bytes32 indexed slaId, address recipient, uint256 amount);

    /// @notice ASP creates an SLA with stake
    function createSLA(
        bytes32 slaId,
        address user,
        uint256 deadline,
        bytes32 deliverableHash
    ) external payable {
        require(deadline > block.timestamp, "Deadline must be in future");
        require(msg.value > 0, "Must stake > 0");
        require(slas[slaId].stake == 0, "SLA already exists");

        slas[slaId] = SLA({
            user: user,
            asp: msg.sender,
            stake: msg.value,
            deadline: deadline,
            deliverableHash: deliverableHash,
            delivered: false,
            disputed: false,
            resolved: false,
            resolver: address(0)
        });
        slaCount++;

        emit SLACreated(slaId, user, msg.sender, msg.value, deadline);
    }

    /// @notice ASP marks deliverable as completed
    function deliver(bytes32 slaId) external {
        SLA storage s = slas[slaId];
        require(msg.sender == s.asp, "Only ASP can deliver");
        require(!s.delivered, "Already delivered");
        require(block.timestamp <= s.deadline, "Deadline passed");

        s.delivered = true;
        emit Delivered(slaId);
    }

    /// @notice User disputes the delivery
    function dispute(bytes32 slaId, string calldata reason) external {
        SLA storage s = slas[slaId];
        require(msg.sender == s.user, "Only user can dispute");
        require(s.delivered, "Not delivered yet");
        require(!s.disputed, "Already disputed");

        s.disputed = true;
        emit Disputed(slaId, reason);
    }

    /// @notice Evaluator resolves a dispute
    function resolve(
        bytes32 slaId,
        bool aspAtFault,
        uint256 slashPercent // 0-100, percentage of stake to slash
    ) external {
        SLA storage s = slas[slaId];
        require(s.disputed, "Not disputed");
        require(!s.resolved, "Already resolved");
        require(slashPercent <= 100, "Invalid slash percent");

        s.resolved = true;
        s.resolver = msg.sender;

        uint256 slashAmount = 0;
        if (aspAtFault && slashPercent > 0) {
            slashAmount = (s.stake * slashPercent) / 100;
            // Slashed amount goes to user as compensation
            payable(s.user).transfer(slashAmount);
        }

        // Return remaining stake to ASP
        uint256 remaining = s.stake - slashAmount;
        if (remaining > 0) {
            payable(s.asp).transfer(remaining);
            emit StakeWithdrawn(slaId, s.asp, remaining);
        }

        emit Resolved(slaId, msg.sender, aspAtFault, slashAmount);
    }

    /// @notice ASP withdraws stake after successful delivery (no dispute after 3 days)
    function withdrawStake(bytes32 slaId) external {
        SLA storage s = slas[slaId];
        require(msg.sender == s.asp, "Only ASP can withdraw");
        require(s.delivered, "Not delivered");
        require(!s.disputed, "Cannot withdraw while disputed");
        require(block.timestamp > s.deadline + 3 days, "Wait 3 days after deadline");

        uint256 amount = s.stake;
        s.stake = 0;
        payable(s.asp).transfer(amount);
        emit StakeWithdrawn(slaId, s.asp, amount);
    }

    /// @notice Get SLA details
    function getSLA(bytes32 slaId) external view returns (SLA memory) {
        return slas[slaId];
    }
}
