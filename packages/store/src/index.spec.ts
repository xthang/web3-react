import { createWeb3ReactStoreAndActions, MAX_SAFE_CHAIN_ID } from '.'

describe('#createWeb3ReactStoreAndActions', () => {
  test('uninitialized', () => {
    const [store] = createWeb3ReactStoreAndActions()
    expect(store.getState()).toEqual({
      chainId: undefined,
      accounts: undefined,
      activating: false,
      error: undefined,
    })
  })

  describe('#startActivation', () => {
    test('works', () => {
      const [store, actions] = createWeb3ReactStoreAndActions()
      actions.startActivation()
      expect(store.getState()).toEqual({
        chainId: undefined,
        accounts: undefined,
        activating: true,
        error: undefined,
      })
    })

    test('cancellation works', () => {
      const [store, actions] = createWeb3ReactStoreAndActions()
      const cancelActivation = actions.startActivation()

      cancelActivation()

      expect(store.getState()).toEqual({
        chainId: undefined,
        accounts: undefined,
        activating: false,
        error: undefined,
      })
    })
  })

  describe('#update', () => {
    test('throws on bad chainIds', () => {
      const [, actions] = createWeb3ReactStoreAndActions()
      for (const chainId of ['eip155:1.1', 'eip155:0', `eip155:${MAX_SAFE_CHAIN_ID + 1}`]) {
        expect(() => actions.update({ chainId })).toThrow(`Invalid eip155 chainId ${chainId}`)
      }
    })

    test('throws on bad accounts', () => {
      const [, actions] = createWeb3ReactStoreAndActions()
      expect(() => actions.update({ accounts: ['eip155:_:0x000000000000000000000000000000000000000'] })).toThrow()
    })

    test('chainId', () => {
      const [store, actions] = createWeb3ReactStoreAndActions()
      const chainId = 'eip155:1'
      actions.update({ chainId })
      expect(store.getState()).toEqual({
        chainId,
        accounts: undefined,
        activating: false,
        error: undefined,
      })
    })

    describe('accounts', () => {
      test('empty', () => {
        const [store, actions] = createWeb3ReactStoreAndActions()
        const allAccounts: string[] = []
        const accounts: string[] = []
        actions.update({ accounts })
        expect(store.getState()).toEqual({
          allAccounts,
          chainId: undefined,
          accounts,
          activating: false,
          error: undefined,
        })
      })

      test('single', () => {
        const [store, actions] = createWeb3ReactStoreAndActions()
        const allAccounts = ['0x0000000000000000000000000000000000000000'].map((it) => `eip155:_:${it}`)
        const accounts = ['0x0000000000000000000000000000000000000000']
        actions.update({ accounts: allAccounts })
        expect(store.getState()).toEqual({
          allAccounts,
          chainId: undefined,
          accounts,
          activating: false,
          error: undefined,
        })
      })

      test('multiple', () => {
        const [store, actions] = createWeb3ReactStoreAndActions()
        const accounts = [
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000001',
        ]
        const allAccounts = accounts.map((it) => `eip155:_:${it}`)
        actions.update({ accounts: allAccounts })
        expect(store.getState()).toEqual({
          allAccounts,
          chainId: undefined,
          accounts,
          activating: false,
          error: undefined,
        })
      })
    })

    test('both', () => {
      const [store, actions] = createWeb3ReactStoreAndActions()
      const chainId = 'eip155:1'
      const allAccounts: string[] = []
      const accounts: string[] = []
      actions.update({ chainId, accounts })
      expect(store.getState()).toEqual({
        allAccounts,
        chainId,
        accounts,
        activating: false,
        error: undefined,
      })
    })

    test('chainId does not unset activating', () => {
      const [store, actions] = createWeb3ReactStoreAndActions()
      const chainId = 'eip155:1'
      actions.startActivation()
      actions.update({ chainId })
      expect(store.getState()).toEqual({
        allAccounts: undefined,
        chainId,
        accounts: undefined,
        activating: true,
        error: undefined,
      })
    })

    test('accounts does not unset activating', () => {
      const [store, actions] = createWeb3ReactStoreAndActions()
      const allAccounts: string[] = []
      const accounts: string[] = []
      actions.startActivation()
      actions.update({ accounts })
      expect(store.getState()).toEqual({
        allAccounts,
        chainId: undefined,
        accounts,
        activating: true,
        error: undefined,
      })
    })

    test('unsets activating', () => {
      const [store, actions] = createWeb3ReactStoreAndActions()
      const chainId = 'eip155:1'
      const allAccounts: string[] = []
      const accounts: string[] = []
      actions.startActivation()
      actions.update({ chainId, accounts })
      expect(store.getState()).toEqual({
        allAccounts,
        chainId,
        accounts,
        activating: false,
        error: undefined,
      })
    })
  })
})
