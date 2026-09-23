import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { db, isCloudEnabled } from './firebase';

export const cleanUndefined = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};

export const generateStableSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export function useSyncedList<T extends { id: string }>(collectionName: string, localKey: string, seed: T[]) {
  const [items, setItemsLocal] = useState<T[]>(() => {
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : seed;
  });

  useEffect(() => {
    if (!isCloudEnabled || !db) return;
    let isSeeding = false;

    const unsubscribe = onSnapshot(collection(db, collectionName), async (snapshot) => {
      // 1. Ignore snapshots do cache: só trate como verdade snapshot do servidor
      if (snapshot.metadata.fromCache) {
        return;
      }

      // 2. Coleção vazia no servidor
      if (snapshot.empty) {
        if (seed && seed.length > 0 && !isSeeding) {
          isSeeding = true;
          try {
            const metaSeedRef = doc(db, 'meta', 'seed');
            const metaSnap = await getDoc(metaSeedRef);
            const metaData = metaSnap.exists() ? metaSnap.data() : {};

            if (!metaData[collectionName]) {
              const batch = writeBatch(db);
              const collRef = collection(db, collectionName);

              seed.forEach((item: any) => {
                const docId = item.id || 
                  (item.title ? generateStableSlug(item.title) : 
                  (item.name ? generateStableSlug(item.name) : 'item'));
                const cleaned = cleanUndefined(item);
                const { id: _, ...data } = cleaned;
                batch.set(doc(collRef, docId), data, { merge: true });
              });

              batch.set(metaSeedRef, { [collectionName]: true }, { merge: true });
              await batch.commit();
            } else {
              // Já foi semeado no passado e a coleção ficou genuinamente vazia
              setItemsLocal([]);
              localStorage.setItem(localKey, JSON.stringify([]));
            }
          } catch (seedError) {
            console.error(`Erro ao verificar/semear coleção ${collectionName}:`, seedError);
          } finally {
            isSeeding = false;
          }
        }
        // Enquanto a coleção estiver vazia e a semeadura ainda não tiver rodado,
        // mantenha na tela os dados que já estão em memória — nunca substitua por lista vazia,
        // e nunca sobrescreva o localStorage com [].
        return;
      }

      // 3. Snapshot do servidor com dados
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
      setItemsLocal(data);
      // Só espelhe no localStorage os dados vindos do servidor
      localStorage.setItem(localKey, JSON.stringify(data));
    }, (error) => {
      console.error(`Error reading ${collectionName}:`, error);
    });

    return () => unsubscribe();
  }, [collectionName, localKey, seed]);

  const setItems = (action: T[] | ((prev: T[]) => T[])) => {
    setItemsLocal(prev => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;

      if (isCloudEnabled && db) {
        const batch = writeBatch(db);
        const collRef = collection(db, collectionName);
        
        const nextMap = new Map(next.map((item: any) => [item.id, item]));
        const prevMap = new Map(prev.map((item: any) => [item.id, item]));

        next.forEach((item: any) => {
          const cleaned = cleanUndefined(item);
          const { id, ...data } = cleaned;
          batch.set(doc(collRef, id), data, { merge: true });
        });

        prev.forEach((item: any) => {
          if (!nextMap.has(item.id)) {
            batch.delete(doc(collRef, item.id));
          }
        });

        batch.commit().catch(err => console.error(`Batch commit error in ${collectionName}:`, err));
      }
      return next;
    });
  };

  return [items, setItems] as const;
}

export function useSyncedDoc<T>(collectionName: string, docId: string, localKey: string, seed: T) {
  const [data, setDataLocal] = useState<T>(() => {
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : seed;
  });

  useEffect(() => {
    if (!isCloudEnabled || !db) return;
    const unsubscribe = onSnapshot(doc(db, collectionName, docId), (d) => {
      if (d.metadata.fromCache) {
        return;
      }
      if (d.exists()) {
        const docData = d.data() as T;
        setDataLocal(docData);
        // Só espelhe no localStorage os dados vindos do servidor
        localStorage.setItem(localKey, JSON.stringify(docData));
      }
    }, (error) => {
      console.error(`Error reading ${collectionName}/${docId}:`, error);
    });
    return () => unsubscribe();
  }, [collectionName, docId, localKey]);

  const setData = (action: T | ((prev: T) => T)) => {
    setDataLocal(prev => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;

      if (isCloudEnabled && db) {
        const cleaned = cleanUndefined(next);
        setDoc(doc(db, collectionName, docId), cleaned, { merge: true })
          .catch(err => console.error(`Error writing ${collectionName}/${docId}:`, err));
      }
      return next;
    });
  };

  return [data, setData] as const;
}
