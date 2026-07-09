// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract SessionKeyManager {
    struct Session {
        address owner;
        uint256 maxSpend;
        uint256 spendSoFar;
        uint256 expiresAt;
        bytes32[] allowedActions;
        bool isActive;
    }

    mapping(bytes32 => Session) private sessions;

    event SessionCreated(bytes32 indexed sessionId, address indexed owner, uint256 maxSpend, uint256 expiresAt);
    event SessionRevoked(bytes32 indexed sessionId);
    event SpendUpdated(bytes32 indexed sessionId, uint256 spendSoFar);

    modifier onlyOwner(bytes32 sessionId) {
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        _;
    }

    function createSession(
        bytes32 sessionId,
        address account,
        uint256 maxSpend,
        uint256 expiresAt,
        bytes32[] calldata allowedActions
    ) external {
        require(sessions[sessionId].owner == address(0), "Session already exists");
        require(expiresAt > block.timestamp, "Expiry must be in the future");

        sessions[sessionId] = Session({
            owner: account,
            maxSpend: maxSpend,
            spendSoFar: 0,
            expiresAt: expiresAt,
            allowedActions: allowedActions,
            isActive: true
        });

        emit SessionCreated(sessionId, account, maxSpend, expiresAt);
    }

    function validateSession(bytes32 sessionId, uint256 amount, bytes32 action) external view returns (bool) {
        Session storage session = sessions[sessionId];
        if (!session.isActive) return false;
        if (block.timestamp > session.expiresAt) return false;
        if (session.spendSoFar + amount > session.maxSpend) return false;

        bool actionAllowed = false;
        for (uint256 i = 0; i < session.allowedActions.length; i++) {
            if (session.allowedActions[i] == action) {
                actionAllowed = true;
                break;
            }
        }
        return actionAllowed;
    }

    function recordSpend(bytes32 sessionId, uint256 amount) external {
        Session storage session = sessions[sessionId];
        require(session.isActive, "Session not active");
        require(block.timestamp <= session.expiresAt, "Session expired");
        require(session.spendSoFar + amount <= session.maxSpend, "Exceeds max spend");

        session.spendSoFar += amount;
        emit SpendUpdated(sessionId, session.spendSoFar);
    }

    function revokeSession(bytes32 sessionId) external onlyOwner(sessionId) {
        require(sessions[sessionId].isActive, "Session not active");
        sessions[sessionId].isActive = false;
        emit SessionRevoked(sessionId);
    }

    function getSession(bytes32 sessionId) external view returns (Session memory) {
        return sessions[sessionId];
    }

    function sessionExists(bytes32 sessionId) external view returns (bool) {
        return sessions[sessionId].isActive;
    }
}
