import { writeFileSync } from 'fs';

const arbitrumSepoliaForkUrl =
  process.env.ARBITRUM_SEPOLIA_FORK_URL ||
  'https://sepolia-rollup.arbitrum.io/rpc';

const forkBlockNumber = await fetch(arbitrumSepoliaForkUrl, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1,
  }),
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((res) => res.json())
  .then((jsonRes) => {
    console.log(
      `Current block number of ${arbitrumSepoliaForkUrl} is ${JSON.stringify(jsonRes)}`
    );
    return parseInt(jsonRes.result.substring(2), 16);
  })
  .catch((e) => {
    throw Error(
      `Failed to get current block number from ${arbitrumSepoliaForkUrl}: ${e}`
    );
  });

console.log('Creating .env file for docker-compose test-stack');
writeFileSync(
  '.env',
  `############ THIS FILE IS GENERATED ############
# run "node prepare-test-env.js" to regenerate #
################################################

ARBITRUM_SEPOLIA_FORK_URL=${arbitrumSepoliaForkUrl}
ARBITRUM_SEPOLIA_FORK_BLOCK=${forkBlockNumber}`
);
