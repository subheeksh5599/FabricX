// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title SessionKeyManagerV2
/// @notice Multi-token session keys with gas abstraction and per-action spend limits
contract SessionKeyManagerV2 {
    struct TokenLimit {
        address token;      // ERC20 token address (0xEeee... for native)
        uint256 maxSpend;   // Max spend in this token
        uint256 spendSoFar; // Cumulative spend tracked
    }

    struct Session {
        address owner;
        uint256 expiresAt;
        uint256 gasLimit;           // Max gas the agent can consume (0 = unlimited)
        uint256 gasUsed;            // Cumulative gas used
        bytes32[] allowedActions;   // keccak256("swap"), keccak256("bridge"), etc.
        TokenLimit[] tokenLimits;   // One per token the agent can spend
        bool isActive;
    }

    mapping(bytes32 => Session) private sessions;

    event SessionCreated(bytes32 indexed sessionId, address indexed owner, uint256 expiresAt, uint256 gasLimit);
    event SessionRevoked(bytes32 indexed sessionId);
    event SpendUpdated(bytes32 indexed sessionId, address token, uint256 spendSoFar);
    event GasUsed(bytes32 indexed sessionId, uint256 gasUsed);

    modifier onlyOwner(bytes32 sessionId) {
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        _;
    }

    /// @notice Create a session with multi-token limits and gas abstraction
    function createSession(
        bytes32 sessionId,
        address account,
        uint256 expiresAt,
        uint256 gasLimit,
        bytes32[] calldata allowedActions,
        address[] calldata tokens,
        uint256[] calldata maxSpends
    ) external {
        require(sessions[sessionId].owner == address(0), "Session already exists");
        require(expiresAt > block.timestamp, "Expiry must be in the future");
        require(tokens.length == maxSpends.length, "Tokens/spends length mismatch");

        Session storage s = sessions[sessionId];
        s.owner = account;
        s.expiresAt = expiresAt;
        s.gasLimit = gasLimit;
        s.isActive = true;

        for (uint256 i = 0; i < allowedActions.length; i++) {
            s.allowedActions.push(allowedActions[i]);
        }

        for (uint256 i = 0; i < tokens.length; i++) {
            s.tokenLimits.push(TokenLimit({
                token: tokens[i],
                maxSpend: maxSpends[i],
                spendSoFar: 0
            }));
        }

        emit SessionCreated(sessionId, account, expiresAt, gasLimit);
    }

    /// @notice Validate a session for a given token, amount, and action
    function validateSession(bytes32 sessionId, address token, uint256 amount, bytes32 action)
        external view returns (bool)
    {
        Session storage s = sessions[sessionId];
        if (!s.isActive) return false;
        if (block.timestamp > s.expiresAt) return false;

        // Check action is allowed
        bool actionAllowed = false;
        for (uint256 i = 0; i < s.allowedActions.length; i++) {
            if (s.allowedActions[i] == action) { actionAllowed = true; break; }
        }
        if (!actionAllowed) return false;

        // Check token spend limit
        for (uint256 i = 0; i < s.tokenLimits.length; i++) {
            if (s.tokenLimits[i].token == token) {
                return s.tokenLimits[i].spendSoFar + amount <= s.tokenLimits[i].maxSpend;
            }
        }
        return false; // Token not in allowlist
    }

    /// @notice Record spend against a session for a specific token
    function recordSpend(bytes32 sessionId, address token, uint256 amount) external {
        Session storage s = sessions[sessionId];
        require(s.isActive, "Session not active");
        require(block.timestamp <= s.expiresAt, "Session expired");

        for (uint256 i = 0; i < s.tokenLimits.length; i++) {
            if (s.tokenLimits[i].token == token) {
                require(
                    s.tokenLimits[i].spendSoFar + amount <= s.tokenLimits[i].maxSpend,
                    "Exceeds token spend limit"
                );
                s.tokenLimits[i].spendSoFar += amount;
                emit SpendUpdated(sessionId, token, s.tokenLimits[i].spendSoFar);
                return;
            }
        }
        revert("Token not in session limits");
    }

    /// @notice Record gas used by an agent session
    function recordGas(bytes32 sessionId, uint256 gasAmount) external {
        Session storage s = sessions[sessionId];
        require(s.isActive, "Session not active");
        require(block.timestamp <= s.expiresAt, "Session expired");
        if (s.gasLimit > 0) {
            require(s.gasUsed + gasAmount <= s.gasLimit, "Exceeds gas limit");
        }
        s.gasUsed += gasAmount;
        emit GasUsed(sessionId, s.gasUsed);
    }

    /// @notice Revoke a session
    function revokeSession(bytes32 sessionId) external onlyOwner(sessionId) {
        require(sessions[sessionId].isActive, "Session not active");
        sessions[sessionId].isActive = false;
        emit SessionRevoked(sessionId);
    }

    // ── View functions ──

    function getSession(bytes32 sessionId) external view returns (Session memory) {
        return sessions[sessionId];
    }

    function isActive(bytes32 sessionId) external view returns (bool) {
        Session storage s = sessions[sessionId];
        return s.isActive && block.timestamp <= s.expiresAt;
    }

    function getTokenLimit(bytes32 sessionId, address token)
        external view returns (uint256 maxSpend, uint256 spendSoFar)
    {
        Session storage s = sessions[sessionId];
        for (uint256 i = 0; i < s.tokenLimits.length; i++) {
            if (s.tokenLimits[i].token == token) {
                return (s.tokenLimits[i].maxSpend, s.tokenLimits[i].spendSoFar);
            }
        }
        return (0, 0);
    }

    function getRemainingGas(bytes32 sessionId) external view returns (uint256) {
        Session storage s = sessions[sessionId];
        if (s.gasLimit == 0) return type(uint256).max; // Unlimited
        if (s.gasUsed >= s.gasLimit) return 0;
        return s.gasLimit - s.gasUsed;
    }
}
