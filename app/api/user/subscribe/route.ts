import { NextRequest, NextResponse } from 'next/server'
import { getUserByToken, upgradePlan } from '@/lib/server/user-store'
import { sendNotification } from '@/lib/server/user-store'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUserByToken(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const validPlans = ['fighter', 'leader', 'revolutionist']
  if (!validPlans.includes(plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  await upgradePlan(user.id, plan)

  const planNames: Record<string, string> = { fighter: 'Freedom Fighter', leader: 'Revolution Leader', revolutionist: 'Revolutionist' }
  await sendNotification({
    user_id: user.id,
    title: 'Subscription Activated!',
    message: `Welcome to ${planNames[plan]}! Your subscription is now active.`,
    type: 'success'
  })

  return NextResponse.json({ success: true })
}
