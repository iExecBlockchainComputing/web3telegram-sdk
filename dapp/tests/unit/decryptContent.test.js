/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

const {
  decryptContent,
  downloadEncryptedContent,
} = require('../../src/decryptContent');

const DEFAULT_IPFS_GATEWAY = 'https://ipfs-gateway.v8-bellecour.iex.ec';

describe('decryptContent', () => {
  it('should decrypt message correctly', async () => {
    const { IExec } = await import('iexec');

    const iexec = new IExec({
      ethProvider: 'bellecour',
    });

    const encryptionKey = iexec.dataset.generateEncryptionKey();
    const message = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur fringilla orci in neque laoreet, nec dictum justo cursus. Nulla facilisi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Maecenas non bibendum leo. 
`;
    const encryptedFile = await iexec.dataset.encrypt(
      Buffer.from(message, 'utf8'),
      encryptionKey
    );

    const decryptedMessage = decryptContent(encryptedFile, encryptionKey);
    expect(decryptedMessage.length).toEqual(message.length);
    expect(decryptedMessage).toEqual(message);
  });
});

describe('downloadEncryptedContent', () => {
  it('should return the encrypted content', async () => {
    const content = `{"JSONPath":"$['rates']['GBP']","body":"","dataType":"number","dataset":"0x0000000000000000000000000000000000000000","headers":{},"method":"GET","url":"https://api.exchangerate.host/latest?base=USD&symbols=GBP"}`;
    const textEncoder = new TextEncoder();
    const actualContent = await textEncoder.encode(content);
    const multiaddr = '/ipfs/Qmb1JLTVp4zfRMPaori9htzzM9D3B1tG8pGbZYTRC1favA';
    const expectedContent = await downloadEncryptedContent(multiaddr);
    expect(actualContent).toEqual(expectedContent);
  });

  it('should throw an error if the content cannot be loaded', async () => {
    const multiaddr =
      '/ipfs/QmYhXeg4p4D729m432t8b9877b35e756a82749723456789invalid';
    await expect(downloadEncryptedContent(multiaddr)).rejects.toThrowError(
      `Failed to load content from ${DEFAULT_IPFS_GATEWAY}/ipfs/QmYhXeg4p4D729m432t8b9877b35e756a82749723456789invalid`
    );
  });
});
