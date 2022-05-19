import { Converter, AdminConverter } from "./converter";
import { Firestore, collection, getDoc, doc as document } from "firebase/firestore";
import { Firestore as AdminFirestore } from "firebase-admin/firestore";
import { FirebaseStorage } from "firebase/storage";

export class AdminModelLink<T> {
    constructor(private fullPath: string, private _firestore: AdminFirestore, private converter: AdminConverter<T>) {}

    get reference(): string {
        return this.fullPath;
    }

    async fromFirestore(): Promise<T> {
        const coll = this.fullPath.split('/')[0];
        const key = this.fullPath.split('/').slice(1).join('/');
        const doc = this._firestore.collection(coll).withConverter(this.converter).doc(key)
        return (await doc.get()).data();
    }
}

export class ModelLink<T> {
    constructor(private fullPath: string, private _firestore: Firestore, private converter: Converter<T>) {}

    get reference(): string {
        return this.fullPath;
    }

    async fromFirestore(): Promise<T> {
        const coll = this.fullPath.split('/')[0];
        const key = this.fullPath.split('/').slice(1).join('/');
        const col = collection(this._firestore, coll).withConverter(this.converter)
        const doc = document(col, key)
        return (await getDoc<T>(doc)).data();
    }
}

export class FileModelLink<T> {
    constructor(private fullPath: string, private instance: new () => T) {}

    get reference(): string {
        return this.fullPath;
    }

    async fromStorage(): Promise<T> {
        this.instance.prototype._id = this.fullPath;
        const i = new this.instance();
        return i;
    }
}