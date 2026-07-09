// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface ISessionKeyManager {
    function validateSession(bytes32 sessionId, uint256 amount, bytes32 action) external view returns (bool);
    function recordSpend(bytes32 sessionId, uint256 amount) external;
    function createSession(bytes32 sessionId, address account, uint256 maxSpend, uint256 expiresAt, bytes32[] calldata allowedActions) external;
    function revokeSession(bytes32 sessionId) external;
}

contract FabricXAccount {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public owner;
    ISessionKeyManager public sessionManager;

    mapping(bytes32 => bool) private executedOps;

    event ExecutedFromSession(bytes32 indexed sessionId, address indexed to, uint256 value);
    event SessionKeyAdded(bytes32 indexed sessionId);
    event SessionKeyRevoked(bytes32 indexed sessionId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner, address _sessionManager) {
        owner = _owner;
        sessionManager = ISessionKeyManager(_sessionManager);
    }

    function executeFromSession(
        bytes32 sessionId,
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory) {
        require(
            sessionManager.validateSession(sessionId, value, bytes32(0)),
            "Session validation failed"
        );

        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Execution failed");

        if (value > 0) {
            sessionManager.recordSpend(sessionId, value);
        }

        emit ExecutedFromSession(sessionId, to, value);
        return result;
    }

    function addSessionKey(
        bytes32 sessionId,
        uint256 maxSpend,
        uint256 expiresAt,
        bytes32[] calldata allowedActions
    ) external onlyOwner {
        sessionManager.createSession(sessionId, address(this), maxSpend, expiresAt, allowedActions);
        emit SessionKeyAdded(sessionId);
    }

    function revokeSessionKey(bytes32 sessionId) external onlyOwner {
        sessionManager.revokeSession(sessionId);
        emit SessionKeyRevoked(sessionId);
    }

    function validateUserOp(
        bytes32 userOpHash,
        bytes calldata signature
    ) external view returns (bool) {
        bytes32 ethSignedHash = userOpHash.toEthSignedMessageHash();
        address recovered = ethSignedHash.recover(signature);
        return recovered == owner;
    }

    function getActiveSessions() external view returns (bytes32[] memory) {
        revert("Not implemented: query via SessionKeyManager events");
    }

    receive() external payable {}
}
