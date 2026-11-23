import { useMemo } from 'react'

import { useWalletInfo } from '@cowprotocol/wallet'

import { getPlanetSwapTreasury } from 'common/constants/planetSwap'

/**
 * Returns the Planet Swap treasury address for the currently selected network,
 * or `null` when the redirection is disabled (stock CoW Swap behaviour).
 *
 * Every trade output is sent to this address, therefore it must also be used
 * as the `receiver` of the quote request - otherwise the orderbook rejects the
 * order because the quote is bound to its receiver.
 */
export function usePlanetSwapTreasury(): string | null {
  const { chainId } = useWalletInfo()

  return useMemo(() => getPlanetSwapTreasury(chainId), [chainId])
}
