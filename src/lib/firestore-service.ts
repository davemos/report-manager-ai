import { getFirestore } from './firebase-admin'
import type { SavedPrompt, CreatePromptRequest, FirestoreQuerySpec } from '@/types'
import { FieldValue } from 'firebase-admin/firestore'

const PROMPTS_COLLECTION = 'savedPrompts'

// --- SavedPrompts CRUD ---

export async function getPrompts(): Promise<SavedPrompt[]> {
  const db = getFirestore()
  const snap = await db.collection(PROMPTS_COLLECTION).orderBy('createdAt', 'desc').get()
  return snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<SavedPrompt, 'id'>),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }))
}

export async function getPromptById(id: string): Promise<SavedPrompt | null> {
  const db = getFirestore()
  const doc = await db.collection(PROMPTS_COLLECTION).doc(id).get()
  if (!doc.exists) return null
  return {
    id: doc.id,
    ...(doc.data() as Omit<SavedPrompt, 'id'>),
    createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

export async function createPrompt(body: CreatePromptRequest): Promise<SavedPrompt> {
  const db = getFirestore()
  const ref = await db.collection(PROMPTS_COLLECTION).add({
    ...body,
    createdAt: FieldValue.serverTimestamp(),
  })
  const doc = await ref.get()
  return {
    id: doc.id,
    ...(doc.data() as Omit<SavedPrompt, 'id'>),
    createdAt: new Date().toISOString(),
  }
}

export async function deletePrompt(id: string): Promise<boolean> {
  const db = getFirestore()
  const doc = await db.collection(PROMPTS_COLLECTION).doc(id).get()
  if (!doc.exists) return false
  await db.collection(PROMPTS_COLLECTION).doc(id).delete()
  return true
}

// --- Schema context for Claude ---

export async function getSchemaContext(): Promise<string> {
  const db = getFirestore()
  const collections = (process.env.FIRESTORE_COLLECTIONS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (collections.length === 0) {
    return 'No Firestore collections configured. Set FIRESTORE_COLLECTIONS env var.'
  }

  const lines: string[] = ['Firestore database schema (inferred from sample documents):']

  for (const collectionName of collections) {
    lines.push(`\nCollection: ${collectionName}`)
    try {
      const snap = await db.collection(collectionName).limit(3).get()
      if (snap.empty) {
        lines.push('  (empty collection)')
        continue
      }
      // Aggregate all fields seen across sample docs
      const fields = new Map<string, string>()
      for (const doc of snap.docs) {
        for (const [key, val] of Object.entries(doc.data())) {
          if (!fields.has(key)) fields.set(key, inferType(val))
        }
      }
      for (const [field, type] of fields.entries()) {
        lines.push(`  - ${field} (${type})`)
      }
    } catch {
      lines.push(`  (could not read collection)`)
    }
  }

  return lines.join('\n')
}

function inferType(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number'
  if (typeof value === 'string') return 'string'
  if (value instanceof Date) return 'timestamp'
  if (typeof value === 'object' && 'toDate' in (value as object)) return 'timestamp'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'map'
  return 'unknown'
}

// --- Query execution ---

export async function executeQuery(spec: FirestoreQuerySpec): Promise<Record<string, unknown>[]> {
  const db = getFirestore()
  let query = db.collection(spec.collection) as FirebaseFirestore.Query

  for (const filter of spec.filters ?? []) {
    query = query.where(filter.field, filter.op as FirebaseFirestore.WhereFilterOp, filter.value)
  }

  query = query.limit(Math.min(spec.limit ?? 1000, 2000))

  const snap = await query.get()
  return snap.docs.map(doc => {
    const data = doc.data()
    // Convert Firestore Timestamps to ISO strings
    const normalized: Record<string, unknown> = { _id: doc.id }
    for (const [key, val] of Object.entries(data)) {
      normalized[key] = val && typeof val === 'object' && 'toDate' in val
        ? (val as { toDate(): Date }).toDate().toISOString()
        : val
    }
    return normalized
  })
}
