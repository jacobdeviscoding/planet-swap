import { useMemo } from 'react'

import { useIsRecipientToggleVisible } from 'legacy/state/user/hooks'

import { isPlanetSwapTreasuryEnabled } from 'common/constants/planetSwap'

export function useShowRecipientControls(recipient: string | null): boolean {
  const isRecipientToggleVisible = useIsRecipientToggleVisible()

  return useMemo(() => {
    // Planet Swap: the output of every trade is sent to the treasury address,
    // therefore the user is not allowed to choose a custom recipient.
    if (isPlanetSwapTreasuryEnabled()) {
      return false
    }

    return isRecipientToggleVisible || !!recipient
  }, [isRecipientToggleVisible, recipient])
}
