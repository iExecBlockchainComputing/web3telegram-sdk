import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';
import { getRandomAddress } from '../test-utils.js';
import { filterWorkerpoolOrders } from '../../src/utils/sendTelegram.models.js';

describe('sendTelegram.models', () => {
  describe('filterWorkerpoolOrders()', () => {
    describe('When workerpool orders is an empty array', () => {
      it('should answer with null', () => {
        const workerpoolOrders = [];

        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 0,
        });

        expect(foundOrder).toBeNull();
      });
    });

    describe('When all orders are too expensive', () => {
      it('should answer with null', () => {
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

        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 0,
        });

        expect(foundOrder).toBeNull();
      });
    });

    describe('When one order is cheap enough', () => {
      it('should answer with it', () => {
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

        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 1,
        });

        expect(foundOrder).toBeTruthy();
        expect(foundOrder!.workerpoolprice).toBe(1);
      });
    });

    describe('When multiple sponsored pools exist', () => {
      it('should pick the cheapest eligible order', () => {
        const workerpoolOrders = [
          {
            order: {
              workerpoolprice: 3,
              workerpool: '0x3779Da315D935D3E3957561667236BF6859C1b0E',
            },
          },
          {
            order: {
              workerpoolprice: 1,
              workerpool: '0x3779Da315D935D3E3957561667236BF6859C1b0E',
            },
          },
          {
            order: {
              workerpoolprice: 0,
              workerpool: getRandomAddress(),
            },
          },
        ] as PublishedWorkerpoolorder[];

        const foundOrder = filterWorkerpoolOrders({
          workerpoolOrders,
          workerpoolMaxPrice: 2,
        });

        expect(foundOrder).toBeTruthy();
        expect(foundOrder!.workerpoolprice).toBe(0);
      });
    });
  });
});
