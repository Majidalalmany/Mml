import { QuerySnapshot, DocumentData, Unsubscribe } from 'firebase/firestore';
import { db, collection, query, onSnapshot } from './firebase';

export function mapSnapshotDocs<T>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as T[];
}

export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const collectionQuery = query(collection(db, collectionName));
  return onSnapshot(collectionQuery, (snapshot) => {
    onData(mapSnapshotDocs<T>(snapshot));
  }, (error) => {
    if (onError) {
      onError(error);
    } else {
      console.warn(`${collectionName} listener fallback:`, error);
    }
  });
}
