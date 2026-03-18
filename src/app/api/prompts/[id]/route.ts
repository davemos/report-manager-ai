import { NextResponse } from 'next/server'
import { getPromptById, deletePrompt } from '@/lib/firestore-service'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prompt = await getPromptById(id)
    if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(prompt)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deleted = await deletePrompt(id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
