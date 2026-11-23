import { ExplorerDataType, getExplorerLink, isAddress, shortenAddress } from '@cowprotocol/common-utils'
import { SupportedChainId } from '@cowprotocol/cow-sdk'
import { InfoTooltip } from '@cowprotocol/ui'

import styled from 'styled-components/macro'
import { Nullish } from 'types'

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-align: right;
  min-height: 24px;
  gap: 3px;
`

const Link = styled.a`
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

interface RecipientRowProps {
  chainId: SupportedChainId
  recipient: Nullish<string>
  account: Nullish<string>
  /**
   * Planet Swap: the address the tokens are actually sent to.
   * When set, it takes precedence over the `recipient` prop.
   */
  treasury?: Nullish<string>
}

export function RecipientRow(props: RecipientRowProps) {
  const { chainId, recipient, account, treasury } = props
  // Planet Swap: the output of the trade is sent to the treasury address
  const targetAddress = treasury ?? recipient

  return (
    <>
      {targetAddress && targetAddress.toLowerCase() !== account?.toLowerCase() && (
        <Row>
          <div>
            <span>Recipient</span>{' '}
            <InfoTooltip
              content={
                'The tokens received from this order will automatically be sent to this address. No need to do a second transaction!'
              }
            />
          </div>
          <div>
            <Link
              title={targetAddress}
              href={getExplorerLink(chainId, targetAddress, ExplorerDataType.ADDRESS)}
              target="_blank"
            >
              {isAddress(targetAddress) ? shortenAddress(targetAddress) : targetAddress}
            </Link>
          </div>
        </Row>
      )}
    </>
  )
}
