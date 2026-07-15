// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title ASPReputation
/// @notice On-chain reputation system for Agent Service Providers
contract ASPReputation {
    struct Rating {
        address rater;
        uint8 score;        // 1-5 stars
        string comment;     // IPFS hash or short text
        uint256 timestamp;
    }

    struct ASP {
        address owner;
        uint256 totalScore;
        uint256 ratingCount;
        mapping(uint256 => Rating) ratings;
        uint256 ratingIndex;
        mapping(address => bool) hasRated; // One rating per user per ASP
    }

    mapping(address => ASP) private asps;
    mapping(address => bool) public registeredASPs;

    event ASPRegistered(address indexed asp);
    event Rated(address indexed asp, address indexed rater, uint8 score);
    event RatingUpdated(address indexed asp, address indexed rater, uint8 oldScore, uint8 newScore);

    modifier onlyRegistered() {
        require(registeredASPs[msg.sender], "ASP not registered");
        _;
    }

    /// @notice Register as an ASP to receive ratings
    function register() external {
        require(!registeredASPs[msg.sender], "Already registered");
        registeredASPs[msg.sender] = true;
        asps[msg.sender].owner = msg.sender;
        emit ASPRegistered(msg.sender);
    }

    /// @notice Rate an ASP (1-5 stars). One rating per user per ASP.
    function rate(address asp, uint8 score, string calldata comment) external {
        require(registeredASPs[asp], "ASP not registered");
        require(score >= 1 && score <= 5, "Score must be 1-5");
        require(msg.sender != asp, "Cannot rate yourself");

        ASP storage a = asps[asp];

        if (a.hasRated[msg.sender]) {
            // Update existing rating
            for (uint256 i = 0; i < a.ratingIndex; i++) {
                if (a.ratings[i].rater == msg.sender) {
                    uint8 oldScore = a.ratings[i].score;
                    a.totalScore = a.totalScore - oldScore + score;
                    a.ratings[i].score = score;
                    a.ratings[i].comment = comment;
                    a.ratings[i].timestamp = block.timestamp;
                    emit RatingUpdated(asp, msg.sender, oldScore, score);
                    return;
                }
            }
        }

        // New rating
        a.ratings[a.ratingIndex] = Rating({
            rater: msg.sender,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        });
        a.totalScore += score;
        a.ratingCount++;
        a.ratingIndex++;
        a.hasRated[msg.sender] = true;

        emit Rated(asp, msg.sender, score);
    }

    /// @notice Get ASP average rating (scaled by 100 for precision)
    function getAverageRating(address asp) external view returns (uint256) {
        ASP storage a = asps[asp];
        if (a.ratingCount == 0) return 0;
        return (a.totalScore * 100) / a.ratingCount;
    }

    /// @notice Get ASP rating count
    function getRatingCount(address asp) external view returns (uint256) {
        return asps[asp].ratingCount;
    }

    /// @notice Get a specific rating by index
    function getRating(address asp, uint256 index) external view returns (Rating memory) {
        return asps[asp].ratings[index];
    }

    /// @notice Check if a user has rated an ASP
    function hasRated(address asp, address rater) external view returns (bool) {
        return asps[asp].hasRated[rater];
    }
}
