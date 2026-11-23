import { SupportedChainId } from '@cowprotocol/cow-sdk'

import { DEFAULT_PLANET_SWAP_TREASURY, getPlanetSwapTreasury, isPlanetSwapTreasuryEnabled } from './planetSwap'

const MAINNET_TREASURY = '0x1111111111111111111111111111111111111111'
const GNOSIS_TREASURY = '0x2222222222222222222222222222222222222222'
const ARBITRUM_TREASURY = '0x3333333333333333333333333333333333333333'
const SEPOLIA_TREASURY = '0x4444444444444444444444444444444444444444'
const GLOBAL_TREASURY = '0x5555555555555555555555555555555555555555'

describe('getPlanetSwapTreasury()', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Assigning undefined stringifies to "undefined" on process.env, which is an invalid address.
    delete process.env.REACT_APP_PLANET_SWAP_TREASURY
    delete process.env.REACT_APP_PLANET_SWAP_TREASURY_1
    delete process.env.REACT_APP_PLANET_SWAP_TREASURY_100
    delete process.env.REACT_APP_PLANET_SWAP_TREASURY_42161
    delete process.env.REACT_APP_PLANET_SWAP_TREASURY_11155111
    delete process.env.REACT_APP_PLANET_SWAP_TREASURY_DISABLED
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return the default treasury when nothing is configured', () => {
    expect(getPlanetSwapTreasury(SupportedChainId.MAINNET)).toBe(DEFAULT_PLANET_SWAP_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.GNOSIS_CHAIN)).toBe(DEFAULT_PLANET_SWAP_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.ARBITRUM_ONE)).toBe(DEFAULT_PLANET_SWAP_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.SEPOLIA)).toBe(DEFAULT_PLANET_SWAP_TREASURY)
  })

  it('should use the per-chain override when it is set', () => {
    process.env.REACT_APP_PLANET_SWAP_TREASURY_1 = MAINNET_TREASURY
    process.env.REACT_APP_PLANET_SWAP_TREASURY_100 = GNOSIS_TREASURY
    process.env.REACT_APP_PLANET_SWAP_TREASURY_42161 = ARBITRUM_TREASURY
    process.env.REACT_APP_PLANET_SWAP_TREASURY_11155111 = SEPOLIA_TREASURY

    expect(getPlanetSwapTreasury(SupportedChainId.MAINNET)).toBe(MAINNET_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.GNOSIS_CHAIN)).toBe(GNOSIS_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.ARBITRUM_ONE)).toBe(ARBITRUM_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.SEPOLIA)).toBe(SEPOLIA_TREASURY)
  })

  it('should fall back to the global treasury when the chain has no override', () => {
    process.env.REACT_APP_PLANET_SWAP_TREASURY = GLOBAL_TREASURY
    process.env.REACT_APP_PLANET_SWAP_TREASURY_100 = GNOSIS_TREASURY

    expect(getPlanetSwapTreasury(SupportedChainId.MAINNET)).toBe(GLOBAL_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.GNOSIS_CHAIN)).toBe(GNOSIS_TREASURY)
    expect(getPlanetSwapTreasury(SupportedChainId.ARBITRUM_ONE)).toBe(GLOBAL_TREASURY)
  })

  it('should ignore an invalid address and use the default treasury', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    process.env.REACT_APP_PLANET_SWAP_TREASURY_1 = 'not-an-address'

    expect(getPlanetSwapTreasury(SupportedChainId.MAINNET)).toBe(DEFAULT_PLANET_SWAP_TREASURY)

    expect(console.error).toHaveBeenCalled()
  })

  it('should ignore an empty address and use the default treasury', () => {
    process.env.REACT_APP_PLANET_SWAP_TREASURY_1 = '   '

    expect(getPlanetSwapTreasury(SupportedChainId.MAINNET)).toBe(DEFAULT_PLANET_SWAP_TREASURY)
  })

  it('should return null when the redirection is disabled', () => {
    process.env.REACT_APP_PLANET_SWAP_TREASURY_DISABLED = 'true'
    process.env.REACT_APP_PLANET_SWAP_TREASURY_1 = MAINNET_TREASURY

    expect(getPlanetSwapTreasury(SupportedChainId.MAINNET)).toBeNull()
    expect(isPlanetSwapTreasuryEnabled()).toBe(false)
  })

  it('should be enabled by default', () => {
    expect(isPlanetSwapTreasuryEnabled()).toBe(true)
  })
})
