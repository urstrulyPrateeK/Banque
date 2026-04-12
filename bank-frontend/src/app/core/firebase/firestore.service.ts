// Banque — Firestore Service
// Central data layer wrapping Firebase Firestore for all CRUD operations

import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    Firestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    DocumentData,
    QueryConstraint,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
// Firebase Storage removed — avatar stored as base64 in Firestore
import { firebaseConfig } from './firebase.config';

const STORAGE_USER_KEY = 'banque_user_id';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
    private readonly app: FirebaseApp;
    private readonly db: Firestore;
    private _userId: string | null = null;

    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        // Restore userId from localStorage on init
        this._userId = localStorage.getItem(STORAGE_USER_KEY);
    }

    get userId(): string {
        return this._userId || 'guest';
    }

    /** Set the active user ID (called on login) */
    setUserId(id: string): void {
        this._userId = id;
        localStorage.setItem(STORAGE_USER_KEY, id);
    }

    /** Clear the active user ID (called on logout) */
    clearUserId(): void {
        this._userId = null;
        localStorage.removeItem(STORAGE_USER_KEY);
    }

    // ─── Document Operations ───

    async getDocument<T>(path: string): Promise<T | null> {
        const snap = await getDoc(doc(this.db, path));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
    }

    async setDocument(path: string, data: Record<string, unknown>): Promise<void> {
        await setDoc(doc(this.db, path), {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    }

    async addDocument(collectionPath: string, data: Record<string, unknown>): Promise<string> {
        const docRef = await addDoc(collection(this.db, collectionPath), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    }

    async updateDocument(path: string, data: Record<string, unknown>): Promise<void> {
        await updateDoc(doc(this.db, path), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    }

    async deleteDocument(path: string): Promise<void> {
        await deleteDoc(doc(this.db, path));
    }

    // ─── Collection Queries ───

    async getCollection<T>(
        collectionPath: string,
        constraints: QueryConstraint[] = []
    ): Promise<T[]> {
        const q = query(collection(this.db, collectionPath), ...constraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    }

    async getSubCollection<T>(
        parentPath: string,
        subCollection: string,
        constraints: QueryConstraint[] = []
    ): Promise<T[]> {
        const colPath = `${parentPath}/${subCollection}`;
        return this.getCollection<T>(colPath, constraints);
    }

    // ─── User-Scoped Helpers ───

    userPath(): string {
        return `users/${this.userId}`;
    }

    userCollection(sub: string): string {
        return `users/${this.userId}/${sub}`;
    }

    // ─── File as Base64 (stored in Firestore, no Storage needed) ───

    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ─── Query Helpers (re-exported for convenience) ───

    where = where;
    orderBy = orderBy;
    limit = limit;

    // ─── Timestamp Helpers ───

    toDate(ts: unknown): string {
        if (ts instanceof Timestamp) return ts.toDate().toISOString();
        if (typeof ts === 'string') return ts;
        return new Date().toISOString();
    }

    // ─── Seed Check ───

    async isSeeded(): Promise<boolean> {
        const userDoc = await this.getDocument<DocumentData>(this.userPath());
        return userDoc !== null && (userDoc as Record<string, unknown>)['seeded'] === true;
    }

    async markSeeded(): Promise<void> {
        await this.setDocument(this.userPath(), { seeded: true });
    }
}
