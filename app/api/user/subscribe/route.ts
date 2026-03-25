import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, requestPlanUpgrade } from '@/lib/server/user-store'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUserByToken(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const validPlans = ['fighter', 'leader', 'revolutionist']
  if (!validPlans.includes(plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  // Don't allow if already pending or active on same plan
  if (user.subscription_status === 'pending') {
    return NextResponse.json({ error: 'You already have a pending subscription awaiting verification.' }, { status: 400 })
  }

  await requestPlanUpgrade(user.id, plan)

  return NextResponse.json({ success: true, pending: true })
}
