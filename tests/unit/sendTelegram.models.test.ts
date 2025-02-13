// import { Address, BN } from 'iexec';
import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';

// import { getRandomAddress } from '../test-utils.js';
import { filterWorkerpoolOrders } from '../../src/utils/sendTelegram.models.js';

// To import from 'iexec' once exported
// type VoucherInfo = {
//   owner: Address;
//   address: Address;
//   type: BN;
//   balance: BN;
//   expirationTimestamp: BN;
//   sponsoredApps: Address[];
//   sponsoredDatasets: Address[];
//   sponsoredWorkerpools: Address[];
//   allowanceAmount: BN;
//   authorizedAccounts: Address[];
// };

describe('sendTelegram.models', () => {
  // describe('checkUserVoucher', () => {
  //   describe('When voucher is expired', () => {
  //     it('should throw an Error with the correct message', async () => {
  //       // --- GIVEN
  //       const userVoucher = {
  //         expirationTimestamp: Date.now() / 1000 - 60, // Expired 1min ago
  //       } as unknown as VoucherInfo;

  //       expect(() =>
  //         checkUserVoucher({
  //           userVoucher,
  //         })
  //       ).toThrow(
  //         new Error(
  //           'Oops, it seems your voucher has expired. You might want to ask for a top up. Check on https://builder.iex.ec/'
  //         )
  //       );
  //     });
  //   });

  //   describe('When voucher has a balance equals to 0', () => {
  //     it('should throw an Error with the correct message', async () => {
  //       // --- GIVEN
  //       const userVoucher = {
  //         expirationTimestamp: Date.now() / 1000 + 3600, // Will expire in 1h
  //         balance: 0,
  //       } as unknown as VoucherInfo;

  //       expect(() =>
  //         checkUserVoucher({
  //           userVoucher,
  //         })
  //       ).toThrow(
  //         new Error(
  //           'Oops, it seems your voucher is empty. You might want to ask for a top up. Check on https://builder.iex.ec/'
  //         )
  //       );
  //     });
  //   });
  // });

  describe('filterWorkerpoolOrders()', () => {
    describe('When workerpool orders is an empty array', () => {
      it('should answer with null', () => {
        // --- GIVEN
        const workerpoolOrders = [];

        // --- WHEN
        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 0,
          // useVoucher: false,
          // userVoucher: undefined,
        });

        // --- THEN
        expect(foundOrder).toBeNull();
      });
    });

    describe('useVoucher === false', () => {
      describe('When all orders are too expensive', () => {
        it('should answer with null', () => {
          // --- GIVEN
          const workerpoolOrders = [
            {
              order: {
                workerpoolprice: 1,
              },
            },
            {
              order: {
                workerpoolprice: 2,
              },
            },
          ] as PublishedWorkerpoolorder[];

          // --- WHEN
          const foundOrder = filterWorkerpoolOrders({
            workerpoolOrders,
            workerpoolMaxPrice: 0, // <-- I want a free workerpool order
            // useVoucher: false,
            // userVoucher: undefined,
          });

          // --- THEN
          expect(foundOrder).toBeNull();
        });
      });

      describe('When one order is cheap enough', () => {
        it('should answer with it', () => {
          // --- GIVEN
          const workerpoolOrders = [
            {
              order: {
                workerpoolprice: 1,
              },
            },
            {
              order: {
                workerpoolprice: 2,
              },
            },
          ] as PublishedWorkerpoolorder[];

          // --- WHEN
          const foundOrder = filterWorkerpoolOrders({
            workerpoolOrders,
            workerpoolMaxPrice: 1,
          });

          // --- THEN
          expect(foundOrder).toBeTruthy();
          expect(foundOrder.workerpoolprice).toBe(1);
        });
      });
    });

    // describe('useVoucher === true', () => {
    //   describe('When there are workerpool orders but workerpool is NOT included in the voucher sponsored workerpools', () => {
    //     it('should answer with null', () => {
    //       // --- GIVEN
    //       const userVoucher = {
    //         balance: 4, // Technically it should be a BN
    //         sponsoredWorkerpools: [getRandomAddress()],
    //       } as unknown as VoucherInfo;
    //       const workerpoolOrders = [
    //         {
    //           order: {
    //             workerpoolprice: 3,
    //             workerpool: getRandomAddress(),
    //           },
    //         },
    //         {
    //           order: {
    //             workerpoolprice: 1,
    //             workerpool: getRandomAddress(),
    //           },
    //         },
    //       ] as PublishedWorkerpoolorder[];

    //       expect(() =>
    //         filterWorkerpoolOrders({
    //           workerpoolOrders,
    //           workerpoolMaxPrice: 0,
    //           useVoucher: true,
    //           userVoucher,
    //         })
    //       ).toThrow(
    //         new Error(
    //           'Found some workerpool orders but none can be sponsored by your voucher.'
    //         )
    //       );
    //     });
    //   });

    //   describe('When voucher balance is greater than asked maxPrice', () => {
    //     it('should answer with the cheapest sponsored order', () => {
    //       // --- GIVEN
    //       const userVoucher = {
    //         balance: 4, // Technically it should be a BN
    //         sponsoredWorkerpools: [
    //           '0x3779Da315D935D3E3957561667236BF6859C1b0E',
    //         ],
    //       } as unknown as VoucherInfo;
    //       const workerpoolOrders = [
    //         {
    //           order: {
    //             workerpoolprice: 3,
    //             workerpool: '0x3779Da315D935D3E3957561667236BF6859C1b0E',
    //           },
    //         },
    //         {
    //           order: {
    //             workerpoolprice: 1,
    //             workerpool: '0x3779Da315D935D3E3957561667236BF6859C1b0E',
    //           },
    //         },
    //         {
    //           order: {
    //             workerpoolprice: 0,
    //             workerpool: getRandomAddress(),
    //           },
    //         },
    //       ] as PublishedWorkerpoolorder[];

    //       // --- WHEN
    //       const foundOrder = filterWorkerpoolOrders({
    //         workerpoolOrders,
    //         workerpoolMaxPrice: 0,
    //         // useVoucher: true,
    //         // userVoucher,
    //       });

    //       // --- THEN
    //       expect(foundOrder).toBeTruthy();
    //       expect(foundOrder.workerpoolprice).toBe(1);
    //     });
    //   });

    //   describe('When voucher balance is not enough but user wants to pay the rest (workerpoolMaxPrice)', () => {
    //     it('should answer with the cheapest order', () => {
    //       // --- GIVEN
    //       const userVoucher = {
    //         balance: 2, // Technically it should be a BN
    //         sponsoredWorkerpools: [
    //           '0x3779Da315D935D3E3957561667236BF6859C1b0E',
    //         ],
    //       } as unknown as VoucherInfo;
    //       const workerpoolOrders = [
    //         {
    //           order: {
    //             workerpoolprice: 3,
    //             workerpool: '0x3779Da315D935D3E3957561667236BF6859C1b0E',
    //           },
    //         },
    //       ] as PublishedWorkerpoolorder[];

    //       // --- WHEN
    //       const foundOrder = filterWorkerpoolOrders({
    //         workerpoolOrders,
    //         workerpoolMaxPrice: 1,
    //         useVoucher: true,
    //         userVoucher,
    //       });

    //       // --- THEN
    //       expect(foundOrder).toBeTruthy();
    //       expect(foundOrder.workerpoolprice).toBe(3);
    //     });
    //   });
    // });
  });
});
