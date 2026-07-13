export const SessionKeyManagerAbi = [
  {
    type: "function",
    name: "createSession",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "account", type: "address" },
      { name: "maxSpend", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "allowedActions", type: "bytes32[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "validateSession",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "action", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recordSpend",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeSession",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getSession",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "maxSpend", type: "uint256" },
          { name: "spendSoFar", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "allowedActions", type: "bytes32[]" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isActive",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export const FabricXAccountAbi = [
  {
    type: "function",
    name: "addSessionKey",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "maxSpend", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "allowedActions", type: "bytes32[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeSessionKey",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeFromSession",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "action", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isSessionActive",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;
