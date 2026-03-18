import admin from 'firebase-admin'
import type { Firestore } from 'firebase-admin/firestore'

let firestoreInstance: Firestore | null = null

export function getFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance

  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
  }

  firestoreInstance = admin.firestore()
  return firestoreInstance
}
