import { IExecWeb3telegram } from '../../src/index.js';

describe('When instantiating SDK without a signer', () => {
  describe('When calling a write method', () => {
    it('should throw an error for unauthorized method', async () => {
      // --- GIVEN
      const web3telegram = new IExecWeb3telegram();

      // --- WHEN/THEN
      await expect(web3telegram.fetchMyContacts()).rejects.toThrow(
        'Unauthorized method. Please log in with your wallet, you must set a valid provider with a signer.'
      );
    });
  });
});
