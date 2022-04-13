import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'
import { ethers } from 'ethers'
import { default as React, useEffect, useState } from 'react'
import './App.css'
import { DisplayAddresses } from './DisplayAddresses'
import { setNewAddress } from './firebase'
import { initNotify, initWeb3Onboard } from './services'
import Header from './views/Header/Header.js'

let provider

const App = () => {
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  const [web3Onboard, setWeb3Onboard] = useState(null)
  const [notify, setNotify] = useState(null)

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard)
    setNotify(initNotify())
  }, [])

  useEffect(() => {
    /* 
      This is where we have access to the nested arrays in this format: connectedWallets -> accounts -> address 
      TODO: See if this can be done in a callback and not in an effect... check BlockNatives' docs
    */
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )

    const connectedWalletAddresses = connectedWallets
      .map(({ accounts }) => accounts.map(account => account.address))
      .flat()

    for (const address of connectedWalletAddresses) {
      setNewAddress(address).catch(e => console.log(e))
    }

    console.log('connectedWalletAddresses', connectedWalletAddresses)
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
  }, [connectedWallets])

  useEffect(() => {
    if (!wallet?.provider) {
      provider = null
    } else {
      provider = new ethers.providers.Web3Provider(wallet.provider, 'any')
    }
  }, [wallet])

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({ autoSelect: previouslyConnectedWallets[0] })
      }
      setWalletFromLocalStorage()
    }
  }, [web3Onboard, connect])

  if (!web3Onboard || !notify) return <div>Loading...</div>

  return (
    <main>
      <Header
        connectedChain={wallet ? connectedChain : null}
        address={wallet?.accounts[0]?.address}
        balance={wallet?.accounts[0]?.balance}
        ens={wallet?.accounts[0]?.ens}
      />
      <section className="main">
        <div className="main-content">
          <div className="vertical-main-container">
            <div className="container onboard">
              <h2>Onboarding Users with Web3-Onboard</h2>

              <DisplayAddresses />
              {wallet && (
                <div className="network-select">
                  <label>Switch Chains</label>
                  {settingChain ? (
                    <span>Switching Chains...</span>
                  ) : (
                    <select
                      onChange={({ target: { value } }) =>
                        setChain({ chainId: value })
                      }
                      value={connectedChain?.id}
                    >
                      {chains.map(({ id, label }) => {
                        return (
                          <option value={id} key={id}>
                            {label}
                          </option>
                        )
                      })}
                    </select>
                  )}
                </div>
              )}
              <div>
                {!wallet && (
                  <button
                    className="bn-demo-button"
                    onClick={() => {
                      connect()
                    }}
                  >
                    Select a Wallet
                  </button>
                )}

                {wallet && (
                  <button
                    className="bn-demo-button"
                    onClick={() => {
                      connect()
                    }}
                  >
                    Connect Another Wallet
                  </button>
                )}

                {wallet && (
                  <button
                    className="bn-demo-button"
                    onClick={() => {
                      disconnect(wallet)
                      const connectedWalletsList = connectedWallets.map(
                        ({ label }) => label
                      )
                      window.localStorage.setItem(
                        'connectedWallets',
                        JSON.stringify(connectedWalletsList)
                      )
                    }}
                  >
                    Reset Wallet State
                  </button>
                )}
                {wallet && wallet?.dashboard && (
                  <button
                    className="bn-demo-button"
                    onClick={wallet?.dashboard}
                  >
                    Open Wallet Dashboard
                  </button>
                )}
                {wallet &&
                  wallet?.type === 'hardware' &&
                  wallet.accounts[0].address && (
                    <button
                      className="bn-demo-button"
                      onClick={web3Onboard.accountSelect}
                    >
                      Switch Account
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
