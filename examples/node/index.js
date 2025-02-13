import { IExecWeb3telegram, getWeb3Provider } from '@iexec/web3telegram';
import { Wallet } from 'ethers';

const test = async () => {
  const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);

  const web3telegram = new IExecWeb3telegram(ethProvider);

  web3telegram.fetchMyContacts().then((contacts) => {
    console.log('contacts', contacts);
  });
};

test();
