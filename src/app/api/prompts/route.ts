import { NextResponse } from 'next/server'
import { getPrompts, createPrompt } from '@/lib/firestore-service'
import type { CreatePromptRequest } from '@/types'

export async function GET() {
  try {
    const prompts = await getPrompts()
    return NextResponse.json(prompts)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as CreatePromptRequest
    if (!body.name?.trim() || !body.prompt?.trim()) {
      return NextResponse.json({ error: 'name and prompt are required' }, { status: 400 })
    }
    const created = await createPrompt(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
