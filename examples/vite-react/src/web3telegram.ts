import { IExecWeb3telegram, Contacts } from '@iexec/web3telegram';

export const test = async () => {
  if (!window.ethereum) {
    throw Error('missing injected ethereum provider in page');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const web3telegram = new IExecWeb3telegram(window.ethereum);

  web3telegram.fetchMyContacts().then((contacts: Contacts) => {
    console.log('contacts', contacts);
  });
};
