import { isAddress } from '@cowprotocol/common-utils'
import { SupportedChainId } from '@cowprotocol/cow-sdk'

/**
 * Planet Swap routes the output of every trade to a treasury address we control.
 *
 * The address is configurable per chain with `REACT_APP_PLANET_SWAP_TREASURY_<chainId>`
 * (chain id as a number, e.g. `_1` for Ethereum mainnet) so that the same build can
 * point at different treasury wallets per network. `REACT_APP_PLANET_SWAP_TREASURY`
 * sets a fallback used for every chain without a specific override.
 *
 * When nothing is configured we fall back to the default mainnet treasury.
 * Set `REACT_APP_PLANET_SWAP_TREASURY_DISABLED=true` to turn the redirection off
 * and get the stock CoW Swap behaviour (funds go to the user).
 *
 * IMPORTANT: the quote request and the order must use the exact same receiver,
 * otherwise the orderbook rejects the order (a quote is bound to its receiver).
 * Always resolve it through `getPlanetSwapTreasury()`.
 */
export const DEFAULT_PLANET_SWAP_TREASURY = '0x9113a25934949E2efa5B7b819deB926C2a9aF227'

/**
 * Per-chain treasury overrides.
 *
 * Note: env vars are inlined at build time (see tools/getReactProcessEnv.ts),
 * therefore every lookup has to be a static property access.
 */
function getTreasuryForChain(chainId: SupportedChainId): string | undefined {
  switch (chainId) {
    case SupportedChainId.MAINNET:
      return process.env.REACT_APP_PLANET_SWAP_TREASURY_1
    case SupportedChainId.GNOSIS_CHAIN:
      return process.env.REACT_APP_PLANET_SWAP_TREASURY_100
    case SupportedChainId.ARBITRUM_ONE:
      return process.env.REACT_APP_PLANET_SWAP_TREASURY_42161
    case SupportedChainId.SEPOLIA:
      return process.env.REACT_APP_PLANET_SWAP_TREASURY_11155111
    default:
      return undefined
  }
}

/**
 * Normalises and validates a configured address.
 * Returns `undefined` when the value is empty or is not a valid address.
 */
function normalizeTreasury(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) {
    return undefined
  }

  if (!isAddress(trimmed)) {
    console.error('[PlanetSwap] Invalid treasury address configured, ignoring it:', trimmed)
    return undefined
  }

  return trimmed
}

function isDisabled(): boolean {
  return process.env.REACT_APP_PLANET_SWAP_TREASURY_DISABLED === 'true'
}

/**
 * Returns the address that should receive the output of every trade, or `null`
 * when the redirection is disabled and the stock CoW Swap behaviour applies.
 *
 * Resolution order:
 *  1. per-chain override (`REACT_APP_PLANET_SWAP_TREASURY_<chainId>`)
 *  2. global fallback (`REACT_APP_PLANET_SWAP_TREASURY`)
 *  3. built-in default treasury
 */
export function getPlanetSwapTreasury(chainId: SupportedChainId): string | null {
  if (isDisabled()) {
    return null
  }

  const chainTreasury = normalizeTreasury(getTreasuryForChain(chainId))
  if (chainTreasury) {
    return chainTreasury
  }

  return (
    normalizeTreasury(process.env.REACT_APP_PLANET_SWAP_TREASURY) ?? normalizeTreasury(DEFAULT_PLANET_SWAP_TREASURY)
  )
}

/**
 * Whether the output of the trades is routed to the Planet Swap treasury.
 */
export function isPlanetSwapTreasuryEnabled(): boolean {
  return !isDisabled()
}
