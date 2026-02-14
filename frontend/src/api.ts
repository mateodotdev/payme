/**
 * Shared API helpers: axios instance with wallet auth header + address validation.
 */
import axios from 'axios';

/** Ethereum address regex: 0x + 40 hex chars */
const ETH_RE = /^0x[0-9a-fA-F]{40}$/;

export function isValidAddress(addr: string): boolean {
  return ETH_RE.test(addr);
}

/**
 * Create an axios instance that injects the X-Wallet-Address header
 * for authenticated requests.
 */
export function authAxios(walletAddress: string | undefined) {
  const instance = axios.create();
  if (walletAddress) {
    instance.defaults.headers.common['X-Wallet-Address'] = walletAddress;
  }
  return instance;
}
