import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const COINPAYMENTS_URL = 'https://www.coinpayments.net/api.php'
const CLIENT_ID = 'b7d4495d928c4aeaa66936b1aef2795b'
// User needs to add their Client Secret here
const CLIENT_SECRET = process.env.COINPAYMENTS_SECRET || ''

async function coinpaymentsApi(cmd: string, params: Record<string, string> = {}) {
  const nonce = crypto.randomUUID()
  
  const payload = {
    key: CLIENT_ID,
    cmd,
    nonce,
    ...params
  }
  
  // Generate HMAC signature
  const hmac = crypto.createHmac('sha512', CLIENT_SECRET)
  hmac.update(new URLSearchParams(payload).toString())
  const signature = hmac.digest('hex')
  
  const response = await fetch(COINPAYMENTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HMAC': signature
    },
    body: new URLSearchParams(payload)
  })
  
  return response.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, amount, coin, email, userId } = body
    
    switch (action) {
      case 'create-transaction': {
        // Create a crypto payment address
        const result = await coinpaymentsApi('create_transaction', {
          amount: amount.toString(),
          currency: 'USD',
          crypto_currency: coin,
          buyer_email: email || 'donor@bullzgamez.com',
          custom: userId || ''
        })
        
        if (result.error === 'ok') {
          return NextResponse.json({
            success: true,
            data: {
              address: result.result.address,
              amount: result.result.amount,
              coin: result.result.crypto_currency,
              timeout: result.result.timeout,
              status_url: result.result.status_url,
              txn_id: result.result.txn_id
            }
          })
        } else {
          return NextResponse.json({ success: false, error: result.error })
        }
      }
      
      case 'get-addr': {
        // Get payment address for specific coin
        const result = await coinpaymentsApi('get_callback_address', {
          currency: coin
        })
        
        if (result.error === 'ok') {
          return NextResponse.json({
            success: true,
            data: {
              address: result.result.address,
              coin
            }
          })
        } else {
          return NextResponse.json({ success: false, error: result.error })
        }
      }
      
      case 'get-balance': {
        // Get coin balances
        const result = await coinpaymentsApi('get_balances')
        
        if (result.error === 'ok') {
          return NextResponse.json({ success: true, balances: result.result })
        } else {
          return NextResponse.json({ success: false, error: result.error })
        }
      }
      
      case 'get-tx': {
        // Check transaction status
        const { txnId } = body
        const result = await coinpaymentsApi('get_transaction', { txid: txnId })
        
        if (result.error === 'ok') {
          return NextResponse.json({
            success: true,
            status: result.result.status,
            amount: result.result.amount
          })
        } else {
          return NextResponse.json({ success: false, error: result.error })
        }
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Donate API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}