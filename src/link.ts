import { Converter } from "./converter";
import { Firestore, collection, getDoc, doc as document } from "firebase/firestore";

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