jest.mock('api/cowProtocol', () => ({
  getTrades: jest.fn(),
  getIsOrderBookTypedError: jest.fn(),
}))

jest.mock('api/cowProtocol/api', () => ({
  getProfileData: jest.fn(),
}))

jest.mock('cowSdk', () => ({
  orderBookApi: { sendOrder: jest.fn() },
}))

import { COW, WETH_SEPOLIA } from '@cowprotocol/common-const'
import { OrderClass, OrderKind, SupportedChainId } from '@cowprotocol/cow-sdk'
import { CurrencyAmount } from '@uniswap/sdk-core'

import { getAppData } from 'modules/appData/utils/fullAppData'

import { getSignOrderParams, PostOrderParams } from './trade'

const ACCOUNT = '0x333333f332a06ecb5d20d35da44ba07986d6e203'
const CHAIN_ID = SupportedChainId.SEPOLIA

const appData = getAppData()

function buildParams(overrides: Partial<PostOrderParams> = {}): PostOrderParams {
  return {
    account: ACCOUNT,
    chainId: CHAIN_ID,
    signer: {} as any,
    kind: OrderKind.SELL,
    inputAmount: CurrencyAmount.fromRawAmount(WETH_SEPOLIA, 10_000_000),
    outputAmount: CurrencyAmount.fromRawAmount(COW[SupportedChainId.SEPOLIA], 2_000_000),
    sellAmountBeforeFee: CurrencyAmount.fromRawAmount(WETH_SEPOLIA, 10_000_000),
    feeAmount: CurrencyAmount.fromRawAmount(WETH_SEPOLIA, 0),
    sellToken: WETH_SEPOLIA,
    buyToken: COW[SupportedChainId.SEPOLIA],
    validTo: 1700000000,
    recipient: ACCOUNT,
    allowsOffchainSigning: true,
    appData,
    class: OrderClass.MARKET,
    partiallyFillable: false,
    isSafeWallet: false,
    ...overrides,
  }
}

describe('getSignOrderParams()', () => {
  describe('When the treasury redirection is enabled', () => {
    it('Then the order receiver should be the treasury address', () => {
      const { order } = getSignOrderParams(buildParams({ recipient: '0x1111111111111111111111111111111111111111' }))

      expect(order.receiver).toBe('0x9113a25934949E2efa5B7b819deB926C2a9aF227')
    })

    it('Then the summary should mention the treasury address', () => {
      const { summary } = getSignOrderParams(buildParams())

      expect(summary).toContain('0x9113...F227')
    })
  })

  describe('When the treasury redirection is disabled', () => {
    beforeEach(() => {
      process.env.REACT_APP_PLANET_SWAP_TREASURY_DISABLED = 'true'
    })

    afterEach(() => {
      delete process.env.REACT_APP_PLANET_SWAP_TREASURY_DISABLED
    })

    it('Then the order receiver should be the user recipient', () => {
      const recipient = '0x1111111111111111111111111111111111111111'
      const { order } = getSignOrderParams(buildParams({ recipient }))

      expect(order.receiver).toBe(recipient)
    })
  })
})
