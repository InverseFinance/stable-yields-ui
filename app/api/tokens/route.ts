import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cacheDuration = 60;

    const headers = {
        'Cache-Control': `public, max-age=${cacheDuration}`,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    };

    try {
        return NextResponse.json({
            "name": "Inverse Finance",
            "timestamp": "2026-03-19T13:00:00+00:00",
            "version": {
                "major": 7,
                "minor": 0,
                "patch": 0
            },
            "logoURI": "https://files.cow.fi/token-lists/images/list-logo.png",
            "keywords": [
                "default",
                "list",
                "cowswap"
            ],
            "tags": {
                "circle": {
                    "name": "Issued by Circle",
                    "description": "Token officially issued by Circle"
                }
            },
            "tokens": [
                {
                    "address": "0xb45ad160634c528Cc3D2926d9807104FA3157305",
                    "symbol": "sDOLA",
                    "name": "Savings DOLA",
                    "decimals": 18,
                    "chainId": 1,
                    "logoURI": "https://assets.coingecko.com/coins/images/35495/standard/sDOLAlogoFINAL.png"
                }
            ]
        }, { headers });
    } catch (err) {

    }
}