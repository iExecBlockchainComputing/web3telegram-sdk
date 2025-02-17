import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';
import { filterWorkerpoolOrders } from '../../../src/utils/sendTelegram.models.js';

describe('filterWorkerpoolOrders', () => {
  it('should return null if there are no workerpool orders', () => {
    expect(
      filterWorkerpoolOrders({
        workerpoolOrders: [],
        workerpoolMaxPrice: 100,
        useVoucher: false,
      })
    ).toBeNull();
  });

  it('should return the only order if its price is within the max price limit', () => {
    const orders: PublishedWorkerpoolorder[] = [
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 80,
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
    ];

    expect(
      filterWorkerpoolOrders({
        workerpoolOrders: orders,
        workerpoolMaxPrice: 100,
        useVoucher: false,
      })
    ).toEqual(orders[0].order);
  });

  it('should return null if the only order is too expensive', () => {
    const orders: PublishedWorkerpoolorder[] = [
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 120,
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
    ];

    expect(
      filterWorkerpoolOrders({
        workerpoolOrders: orders,
        workerpoolMaxPrice: 100,
        useVoucher: false,
      })
    ).toBeNull();
  });

  it('should return the cheapest valid order when multiple orders exist', () => {
    const orders: PublishedWorkerpoolorder[] = [
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 150, // too expensive
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 90, // OK
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 100, // OK
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
    ];

    expect(
      filterWorkerpoolOrders({
        workerpoolOrders: orders,
        workerpoolMaxPrice: 100,
        useVoucher: false,
      })
    ).toEqual(orders[1].order); // the cheapest
  });

  it('should return null if all orders are too expensive', () => {
    const orders: PublishedWorkerpoolorder[] = [
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 150,
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 200,
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 300,
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
    ];

    expect(
      filterWorkerpoolOrders({
        workerpoolOrders: orders,
        workerpoolMaxPrice: 100,
        useVoucher: false,
      })
    ).toBeNull();
  });

  it('should return the cheapest order when all orders are valid', () => {
    const orders: PublishedWorkerpoolorder[] = [
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 95,
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 90, // the cheapest
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
      {
        orderHash: '0xhash',
        chainId: 1,
        remaining: 1,
        status: 'open',
        signer: '0xsigner',
        publicationTimestamp: '1234567890',
        order: {
          workerpool: '0xworkerpool',
          workerpoolprice: 100,
          volume: 1,
          tag: '0xtag',
          category: 1,
          trust: 0,
          apprestrict: '0x0',
          datasetrestrict: '0x0',
          requesterrestrict: '0x0',
          salt: '0xsalt',
          sign: '0xsign',
        },
      },
    ];

    expect(
      filterWorkerpoolOrders({
        workerpoolOrders: orders,
        workerpoolMaxPrice: 100,
        useVoucher: false,
      })
    ).toEqual(orders[1].order);
  });
});
