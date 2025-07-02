/* eslint-disable @typescript-eslint/dot-notation */
// needed to access and assert IExecDataProtector's private properties
import { describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecWeb3telegram } from '../../src/index.js';
import {
  getTestWeb3SignerProvider,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../test-utils.js';
import { CHAIN_CONFIG, CHAIN_IDS } from '../../src/config/config.js';

describe('IExecWeb3telegram()', () => {
  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const web3telegram = new IExecWeb3telegram(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    expect(web3telegram).toBeInstanceOf(IExecWeb3telegram);
  });

  it('should use default ipfs gateway url when ipfsGateway is not provided', async () => {
    const wallet = Wallet.createRandom();
    const web3telegram = new IExecWeb3telegram(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    await web3telegram.init();
    const ipfsGateway = web3telegram['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].ipfsGateway);
  });

  it('should use provided ipfs gateway url when ipfsGateway is provided', async () => {
    const customIpfsGateway = 'https://example.com/ipfs_gateway';
    const wallet = Wallet.createRandom();
    const web3telegram = new IExecWeb3telegram(
      getTestWeb3SignerProvider(wallet.privateKey),
      {
        ipfsGateway: customIpfsGateway,
      }
    );
    await web3telegram.init();
    const ipfsGateway = web3telegram['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
  });

  it('should use default data Protector Subgraph URL when subgraphUrl is not provided', async () => {
    const wallet = Wallet.createRandom();
    const web3telegram = new IExecWeb3telegram(
      getTestWeb3SignerProvider(wallet.privateKey)
    );
    await web3telegram.init();
    const graphQLClientUrl = web3telegram['graphQLClient'];
    expect(graphQLClientUrl['url']).toBe(CHAIN_CONFIG[CHAIN_IDS.BELLECOUR].dataProtectorSubgraph);
  });

  it('should use provided data Protector Subgraph URL when subgraphUrl is provided', async () => {
    const customSubgraphUrl = 'https://example.com/custom-subgraph';
    const wallet = Wallet.createRandom();
    const web3telegram = new IExecWeb3telegram(
      getTestWeb3SignerProvider(wallet.privateKey),
      {
        dataProtectorSubgraph: customSubgraphUrl,
      }
    );
    await web3telegram.init();
    const graphQLClient = web3telegram['graphQLClient'];
    expect(graphQLClient['url']).toBe(customSubgraphUrl);
  });

  it('instantiates with custom IExecWeb3telegram config options', async () => {
    const wallet = Wallet.createRandom();
    const customSubgraphUrl = 'https://example.com/custom-subgraph';
    const customIpfsGateway = 'https://example.com/ipfs_gateway';
    const customDapp = 'web3telegramstg.apps.iexec.eth';
    const customIpfsNode = 'https://example.com/node';
    const smsURL = 'https://custom-sms-url.com';
    const iexecGatewayURL = 'https://custom-market-api-url.com';
    const customDappWhitelistAddress =
      '0x781482C39CcE25546583EaC4957Fb7Bf04C277BB';
    const web3telegram = new IExecWeb3telegram(
      getTestWeb3SignerProvider(wallet.privateKey),
      {
        iexecOptions: {
          smsURL,
          iexecGatewayURL,
        },
        ipfsNode: customIpfsNode,
        ipfsGateway: customIpfsGateway,
        dataProtectorSubgraph: customSubgraphUrl,
        dappAddressOrENS: customDapp,
        dappWhitelistAddress: customDappWhitelistAddress,
      }
    );
    await web3telegram.init();
    const graphQLClient = web3telegram['graphQLClient'];
    const ipfsNode = web3telegram['ipfsNode'];
    const ipfsGateway = web3telegram['ipfsGateway'];
    const dappAddressOrENS = web3telegram['dappAddressOrENS'];
    const iexec = web3telegram['iexec'];
    const whitelistAddress = web3telegram['dappWhitelistAddress'];

    expect(graphQLClient['url']).toBe(customSubgraphUrl);
    expect(ipfsNode).toStrictEqual(customIpfsNode);
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
    expect(dappAddressOrENS).toStrictEqual(customDapp);
    expect(whitelistAddress).toStrictEqual(customDappWhitelistAddress.toLowerCase());
    expect(await iexec.config.resolveSmsURL()).toBe(smsURL);
    expect(await iexec.config.resolveIexecGatewayURL()).toBe(iexecGatewayURL);
  });

  it(
    'When calling a read method should work as expected',
    async () => {
      // --- GIVEN
      const web3telegram = new IExecWeb3telegram();
      const wallet = Wallet.createRandom();

      // --- WHEN/THEN
      await expect(
        web3telegram.fetchUserContacts({ userAddress: wallet.address })
      ).resolves.not.toThrow();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
