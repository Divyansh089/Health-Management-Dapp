# Hardhat Contracts Project

## Setup

1. Copy `.env.example` to `.env` and fill:

```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
RPC_URL=https://ethereum-holesky.publicnode.com
ETHERSCAN_API_KEY=YOUR_KEY
```

2. Install dependencies (from this `contracts/` folder):

```
npm install
```

## Commands

```
npm run compile
npm test
npm run deploy:holesky
npm run export
```

## Deployment Flow

1. `npm run deploy:holesky` – deploys `Healthcare` contract and now auto-writes a deployment json to `deployments/holesky-Healthcare.json`.
2. `npm run export` – copies ABI + address to `../app/src/abi/`.

Example deployment JSON written automatically:

```
{
  "address": "0x...deployedAddress",
  "network": "holesky",
  "blockNumber": 12345,
  "timestamp": 1700000000
}
```

## Notes

- Writer authorization is open (anyone can call `setWriter`) for demo purposes.
- Add access control / ownership for production (e.g. OpenZeppelin `AccessControl` or `Ownable`).
- Store only content identifiers (CIDs); keep PHI encrypted off-chain.

## Extending

- Add role-based access via OpenZeppelin.
- Emit events for writer revocation, record updates, or deletion markers.
- Consider upgradeability (UUPS or Transparent Proxy) if logic may change.
- Integrate subgraph indexing (The Graph) for richer querying.

## Testing

```
npm test
```

Uses Hardhat + Chai; see `test/Healthcare.test.js`.

## Verifying (optional)

After deployment (if ETHERSCAN_API_KEY set and network supported):

```
npx hardhat verify --network holesky <DEPLOYED_ADDRESS>
```

## Security TODO

- Restrict `setWriter` to contract owner or admin role.
- Add emergency pause (OpenZeppelin `Pausable`).
- Consider audit before mainnet deployment.
