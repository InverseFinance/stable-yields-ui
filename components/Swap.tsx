"use client"

import { CowSwapWidget, CowSwapWidgetParams, TradeType } from '@cowprotocol/widget-react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

//  Fill this form https://cowprotocol.typeform.com/to/rONXaxHV once you pick your "appCode"

const darkThemeColors = {
    baseTheme: 'dark' as const,
    background: '#131314',  // --background dark
    paper: '#19191b',       // --card dark
    text: '#EEEEEE',
    primary: '#4f8ef7',
    warning: '#f59e0b',
    alert: '#ef4444',
    success: '#22c55e',
}

const lightThemeColors = {
    baseTheme: 'light' as const,
    background: '#ffffff',
    paper: '#ffffff',
    text: '#1a1a1a',
    primary: '#3b82f6',
    warning: '#f59e0b',
    alert: '#ef4444',
    success: '#22c55e',
}

export const Swap = ({
    tokens
}: {
    tokens: any[]
}) => {
    const [provider, setProvider] = useState<any>(null)
    const { resolvedTheme } = useTheme()

    const customTokens = tokens?.map(t => ({
        chainId: 1,
        address: t.zapAddress || t.address,
        symbol: t.zapSymbol || t.symbol,
        name: t.name || t.symbol,
        decimals: t.decimals || 18,
        logoURI: t.image,
    })) || []

    const theme = resolvedTheme === 'light' ? lightThemeColors : darkThemeColors;

    const params: CowSwapWidgetParams = {
        appCode: 'Stableyields',
        width: '100%',
        height: '600px',
        maxHeight: 640,
        chainId: 1,
        tokenLists: [
            'https://files.cow.fi/tokens/CowSwap.json',
            'https://files.cow.fi/token-lists/CoinGecko.1.json',
        ],
        buyTokenLists: [
            'https://www.stableyields.info/api/tokens',
        ],
        tradeType: TradeType.SWAP,
        sell: {
            asset: 'USDC',
            // amount: '0',
        },
        buy: {
            asset: customTokens[0]?.address,
            // amount: '0',
        },
        enabledTradeTypes: [TradeType.SWAP],
        theme,
        hideNetworkSelector: true,
        standaloneMode: false,
        disableToastMessages: false,
        disableProgressBar: false,
        disablePostTradeTips: false,
        disableCrossChainSwap: false,
        disableTokenImport: false,
        hideRecentTokens: false,
        hideFavoriteTokens: false,
        hideBridgeInfo: false,
        hideOrdersTable: false,
        disableTrade: { whenPriceImpactIsUnknown: false },
        customTokens,
        partnerFee: {
            bps: 10,
            recipient: '0x926dF14a23BE491164dCF93f4c468A50ef659D5B',
        },
    }

    useEffect(() => {
        setProvider(window.ethereum)
    }, [])

    // Inject allowtransparency on the iframe CoW creates so its background can be transparent
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const iframe = document.querySelector('iframe[src*="cow.fi"]') as HTMLIFrameElement | null
            if (iframe) {
                iframe.setAttribute('allowtransparency', 'true')
                iframe.style.background = 'transparent'
                iframe.style.borderRadius = '25px'
                iframe.style.borderBottomRightRadius = '108px'
                iframe.style.borderBottomLeftRadius = '108px'
                observer.disconnect()
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    if (!provider) return null

    return (
        <div style={{
            width: '100%',
            background: 'var(--background)',
            borderRadius: 25,
            borderBottomRightRadius: '108px',
            borderBottomLeftRadius: '108px',
            overflow: 'hidden',
            position: 'relative',
        }}>
            <div style={{ background: theme.paper, height: '42px', width: '100%', position: 'absolute', bottom: '0' }}>&nbsp;</div>
            <CowSwapWidget params={params} provider={provider} />
        </div>
    )
}
