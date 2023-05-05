import { getAddress } from '@ethersproject/address'
import { default as TronWebType } from '@types-x/tronweb'
import type { Actions, Web3ReactState, Web3ReactStateUpdate, Web3ReactStore } from '@web3-react-x/types'
import { ChainNamespace } from '@web3-react-x/types'
import { createStore } from 'zustand'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TronWeb = require('tronweb') as typeof TronWebType
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const tronWebUtils = require('tronweb').utils as typeof utils

/**
 * MAX_SAFE_CHAIN_ID is the upper bound limit on what will be accepted for `chainId`
 * `MAX_SAFE_CHAIN_ID = floor( ( 2**53 - 39 ) / 2 ) = 4503599627370476`
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/blob/b6673731e2367e119a5fee9a454dd40bd4968948/shared/constants/network.js#L31}
 */
export const MAX_SAFE_CHAIN_ID = 4503599627370476

function validateChainId(chainId: string): void {
  if (typeof chainId !== 'string') {
    throw new Error(`Invalid chainId ${chainId}`)
  }
  const [namespace, id] = chainId.split(':')
  if (!namespace || !id) throw new Error(`Invalid chainId ${chainId}`)
  const chainNamespace = ChainNamespace[namespace as keyof typeof ChainNamespace]
  if (!chainNamespace) throw new Error(`Invalid network standard ${chainNamespace}`)
  if (chainNamespace === ChainNamespace.eip155) {
    const parsed = parseFloat(id)
    if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_SAFE_CHAIN_ID) {
      throw new Error(`Invalid eip155 chainId ${chainId}`)
    }
  } else if (chainNamespace === ChainNamespace.tron) {
    //
  } else throw new Error(`Unsupported network standard ${chainNamespace}`)
}

function validateAddress(chainNamespace: ChainNamespace, address: string): string {
  if (chainNamespace === ChainNamespace.eip155) return getAddress(address)
  else if (chainNamespace === ChainNamespace.tron) {
    if (!TronWeb.isAddress(address)) throw new Error(`invalid Tron address: ${address}`)
    return address
  } else throw new Error(`Unsupported network standard ${chainNamespace}`)
}

const DEFAULT_STATE = {
  allAccounts: undefined,
  chainId: undefined,
  accounts: undefined,
  accountName: undefined,
  activating: false,
}

export function createWeb3ReactStoreAndActions(): [Web3ReactStore, Actions] {
  const store = createStore<Web3ReactState>()(() => DEFAULT_STATE)

  // flag for tracking updates so we don't clobber data when cancelling activation
  let nullifier = 0

  /**
   * Sets activating to true, indicating that an update is in progress.
   *
   * @returns cancelActivation - A function that cancels the activation by setting activating to false,
   * as long as there haven't been any intervening updates.
   */
  function startActivation(): () => void {
    const nullifierCached = ++nullifier

    store.setState({ ...DEFAULT_STATE, activating: true })

    // return a function that cancels the activation iff nothing else has happened
    return () => {
      if (nullifier === nullifierCached) store.setState({ activating: false })
    }
  }

  /**
   * Used to report a `stateUpdate` which is merged with existing state. The first `stateUpdate` that results in chainId
   * and accounts being set will also set activating to false, indicating a successful connection.
   *
   * @param stateUpdate - The state update to report.
   */
  function update(stateUpdate: Web3ReactStateUpdate): void {
    // validate chainId statically, independent of existing state
    if (stateUpdate.chainId !== undefined) {
      validateChainId(stateUpdate.chainId)
    }

    nullifier++

    store.setState((existingState): Web3ReactState => {
      // determine the next chainId and accounts
      const allAccounts = stateUpdate.accounts ?? existingState.allAccounts
      const chainId = stateUpdate.chainId ?? existingState.chainId

      // validate accounts statically, independent of existing state
      const accountsInScope = stateUpdate.accounts
        ?.map((account) => {
          const [namespace, accountChainId, address] = account.split(':')
          const chainNamespace = ChainNamespace[namespace as keyof typeof ChainNamespace]

          if (accountChainId && accountChainId !== '_' && chainId && `${namespace}:${accountChainId}` !== chainId)
            return undefined

          return validateAddress(chainNamespace, address)
        })
        .filter((it) => it) as string[] | undefined

      const accounts = accountsInScope ?? existingState.accounts
      const accountName = stateUpdate.accountName ?? existingState.accountName

      // ensure that the activating flag is cleared when appropriate
      let activating = existingState.activating
      if (activating && chainId && accounts) {
        activating = false
      }

      return { allAccounts, chainId, accounts, accountName, activating }
    })
  }

  /**
   * Resets connector state back to the default state.
   */
  function resetState(): void {
    nullifier++
    store.setState(DEFAULT_STATE)
  }

  return [store, { startActivation, update, resetState }]
}
