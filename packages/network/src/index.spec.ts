import { createWeb3ReactStoreAndActions } from '@web3-react-x/store'
import type { Actions, Web3ReactStore } from '@web3-react-x/types'
import { Network } from './'

export class MockJsonRpcProvider {
  public chainId?: string

  public getNetwork() {
    return Promise.resolve({ chainId: this.chainId === undefined ? undefined : Number.parseInt(this.chainId, 16) })
  }
}

jest.doMock('@ethersproject/providers', () => ({
  JsonRpcProvider: MockJsonRpcProvider,
  FallbackProvider: class MockFallbackProvider extends MockJsonRpcProvider {},
}))

const chainId = '0x1'
const allAccounts: string[] = []
const chain = 'eip155:1'
const chain2 = 'eip155:2'
const accounts: string[] = []

describe('Network', () => {
  let store: Web3ReactStore
  let connector: Network
  let mockConnector: MockJsonRpcProvider

  describe('single url', () => {
    beforeEach(() => {
      let actions: Actions
      ;[store, actions] = createWeb3ReactStoreAndActions()
      connector = new Network({ actions, urlMap: { [chain]: 'https://mock.url' } })
    })

    test('is un-initialized', async () => {
      expect(store.getState()).toEqual({
        chainId: undefined,
        accounts: undefined,
        activating: false,
        error: undefined,
      })
    })

    describe('#activate', () => {
      beforeEach(async () => {
        // testing hack to ensure the provider is set
        await connector.activate()
        mockConnector = connector.customProvider as unknown as MockJsonRpcProvider
        mockConnector.chainId = chainId
      })

      test('works', async () => {
        await connector.activate()

        expect(store.getState()).toEqual({
          allAccounts,
          chainId: chain,
          accounts,
          activating: false,
          error: undefined,
        })
      })
    })
  })

  describe('array of urls', () => {
    beforeEach(async () => {
      let actions: Actions
      ;[store, actions] = createWeb3ReactStoreAndActions()
      connector = new Network({
        actions,
        urlMap: { [chain]: ['https://1.mock.url', 'https://2.mock.url'] },
      })
    })

    beforeEach(async () => {
      // testing hack to ensure the provider is set
      await connector.activate()
      mockConnector = connector.customProvider as unknown as MockJsonRpcProvider
      mockConnector.chainId = chainId
    })

    test('#activate', async () => {
      await connector.activate()

      expect(store.getState()).toEqual({
        allAccounts,
        chainId: chain,
        accounts,
        activating: false,
        error: undefined,
      })
    })
  })

  describe('multiple chains', () => {
    beforeEach(async () => {
      let actions: Actions
      ;[store, actions] = createWeb3ReactStoreAndActions()
      connector = new Network({
        actions,
        urlMap: { [chain]: 'https://mainnet.mock.url', [chain2]: 'https://testnet.mock.url' },
      })
    })

    describe('#activate', () => {
      test('chainId = 1', async () => {
        // testing hack to ensure the provider is set
        await connector.activate()
        mockConnector = connector.customProvider as unknown as MockJsonRpcProvider
        mockConnector.chainId = chainId
        await connector.activate()

        expect(store.getState()).toEqual({
          allAccounts,
          chainId: chain,
          accounts,
          activating: false,
          error: undefined,
        })
      })

      test('chainId = 2', async () => {
        // testing hack to ensure the provider is set
        await connector.activate({ desiredChain: 'eip155:2' })
        mockConnector = connector.customProvider as unknown as MockJsonRpcProvider
        mockConnector.chainId = '0x2'
        await connector.activate({ desiredChain: 'eip155:2' })

        expect(store.getState()).toEqual({
          allAccounts,
          chainId: 'eip155:2',
          accounts,
          activating: false,
          error: undefined,
        })
      })
    })
  })
})
