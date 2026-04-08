import { CowSwapWidget, CowSwapWidgetParams, TradeType } from '@cowprotocol/widget-react'
import { useEffect, useState } from 'react'

//  Fill this form https://cowprotocol.typeform.com/to/rONXaxHV once you pick your "appCode"


export const Swap = ({
    tokens
}) => {
    const [provider, setProvider] = useState(null);

    const customTokens = tokens?.map(t => {
        return {
            chainId: 1,
            address: t.zapAddress || t.address,
            symbol: t.symbol,
            name: t.name || t.symbol,
            decimals: t.decimals || 18,
            logoURI: t.image,
        };
    }) || []

    console.log(customTokens)

    const params: CowSwapWidgetParams = {
        "appCode": "Stableyields", // Name of your app (max 50 characters)
        "logoUrl": "http://localhost:3000/favicon.ico?favicon.65960910.ico",
        "width": "400px", // Width in pixels (or 100% to use all available space)
        "height": "600px",
        "maxHeight": 600,
        "chainId": 1, // 1 (Mainnet), 100 (Gnosis), 11155111 (Sepolia)
        "tokenLists": [ // All default enabled token lists. Also see https://tokenlists.org
            "https://files.cow.fi/tokens/CowSwap.json",
            "https://files.cow.fi/token-lists/CoinGecko.1.json"
        ],
        "sellTokenLists": [], // Token lists available only in the sell selector
        "buyTokenLists": [
            'https://www.stableyields.info/api/tokens',
        ], // Token lists available only in the buy selector
        "tradeType": TradeType.SWAP, // TradeType.SWAP, TradeType.LIMIT or TradeType.ADVANCED
        "sell": { // Sell token. Optionally add amount for sell orders
            "asset": "USDC",
            "amount": "1000"
        },
        "buy": { // Buy token. Optionally add amount for buy orders
            "asset": customTokens[0]?.address,
            "amount": "0"
        },
        "enabledTradeTypes": [ // TradeType.SWAP, TradeType.LIMIT and/or TradeType.ADVANCED
            TradeType.SWAP,
            // TradeType.LIMIT,
            // TradeType.ADVANCED,
            // TradeType.YIELD
        ],
        "theme": { // light/dark or provide your own color palette, plus optional `boxShadow`
            baseTheme: 'light',
            primary: '#00ff85',
            background: '#ff0000',
            paper: '#1a4435',
            text: '#ffffff',
            warning: '#ffb700',
            alert: '#b8ffb2',
            success: '#19ff64',
        },
        "hideNetworkSelector": true,
        "standaloneMode": false,
        "disableToastMessages": false,
        "disableProgressBar": false,
        "disablePostTradeTips": false, // Hide CoW Swap educational tips shown after a completed trade when there is no surplus card
        "disableCrossChainSwap": false,
        "disableTokenImport": false,
        "hideRecentTokens": false, // Hide the Recent section in the token selector
        "hideFavoriteTokens": false, // Hide the Favorites section in the token selector
        "hideBridgeInfo": false,
        "hideOrdersTable": false,
        "disableTrade": {
            "whenPriceImpactIsUnknown": false
        },
        "hooks": {},
        "images": {},
        "sounds": {},
        "customTokens": customTokens,
        "partnerFee": { // Partner fee, in Basis Points (BPS) and a receiver address
            "bps": 10,
            "recipient": "0x926dF14a23BE491164dCF93f4c468A50ef659D5B"
        },
        "banners": {
            
        },
    }

    useEffect(() => {
        setProvider(window.ethereum);
    }, [])

    if (!provider) return null;
    return <div >
        <CowSwapWidget params={params} provider={provider} />
    </div>
}