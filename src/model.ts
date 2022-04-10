import { FirebaseApp } from "firebase/app";
import * as firestore from "firebase/firestore";
import { Firestore, getFirestore, collection, where, getDoc, getDocs } from "firebase/firestore";
import { Converter } from "./converter";

// if (process.env.MODE == "dev") {
//     firestore.useEmulator("localhost", 8080);
// }

export type InternalFactory = {[key: string]: {rerun: () => void}};

export function key(target: any, key: string) {
    if (!target?._model_opts) target._model_opts = {};
    target._model_opts["key"] = key;
}

export function masked(target: any, key: string) {
    if (!target?._model_opts) target._model_opts = {};
    if (!target?._model_opts?.maskedFields) target._model_opts.maskedFields = [];

    target._model_opts.maskedFields.push(key);
}

export function factory<T = any>(initiator: () => T) {
    return function (target: any, key: string) {
        if (!target?._model_opts) target._model_opts = {};
        if (!target?._model_opts?.factories) target._model_opts.factories = {};
        
        if (typeof target[key] == "undefined") {
            target._model_opts.factories[key] = initiator()
            target[key] = target._model_opts.factories[key];
        } else target._model_opts.factories[key] = target[key];
    }
}

function listOf(model: any) {
    return function (target: any, key: string) {
        if (!target?._model_opts) target._model_opts = {};
        if (!target?._model_opts?.links) target._model_opts.links = {};

        target._model_opts.links[key] = (data: Array<string> | string) => {
            const m = new model()
            if (Array.isArray(data)) {
                return data.map(k => new ModelLink(k, m._firestore, m.converter))
            } else {
                return new ModelLink(data, m._firestore, m.converter)
            }
        }
    }
}

export { field } from "./converter";

export class ModelLink<T> {
    constructor(private fullPath: string, private _firestore: Firestore, private converter: Converter<T>) {}

    get reference(): string {
        return this.fullPath;
    }

    async fromFirestore(): Promise<T> {
        const coll = this.fullPath.split('/')[0];
        const key = this.fullPath.split('/').slice(1).join('/');
        const col = collection(this._firestore, coll).withConverter(this.converter)
        const doc = firestore.doc(col, key)
        return (await getDoc<T>(doc)).data();
    }
}

export class Model<T> {

    private converter: Converter<T>;
    private _id: string = "";
    private _firestore: Firestore;
    private _app: FirebaseApp;

    constructor(instance: new () => T, private collection: string) {
        this.converter = new Converter<T>(instance);
        for (const f in this.converter["factories"]) {
            this[f] = this.converter["factories"][f];
        }
        this._firestore = getFirestore(this._app);
    }

    static forApp<T = any>(app: FirebaseApp): new () => T {
        this.prototype._app = app;
        return this as any;
    }

    static links() {
        return listOf(this);
    }

    link() {
        return new ModelLink(this.collection + '/' + this.key, this._firestore, this.converter)
    }

    async from(key: string) {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, key)
        return (await getDoc<T>(doc)).data();
    }

    async store() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.key)
        return firestore.setDoc(doc, this.fields);
    }

    async exists() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.key)
        return (await getDoc<T>(doc)).exists();
    }

    async update() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.key)
        return firestore.updateDoc(doc, this.fields);
    }

    async delete() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.key)
        return firestore.deleteDoc(doc);
    }

    async find(key: string, value: string): Promise<T | undefined> {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const query = firestore.query(col, where(key, "==", value));
        const results = (await firestore.getDocs(query));
        if (results.empty) return undefined;
        else return results.docs[0].data();
    }

    async fetchAll() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const docs = (await getDocs(col)).docs;
        return docs.map(o => o.data())
    }

    private get key() {
        if (this._id) return this._id;
        else if (!(this as any)._model_opts?.key) throw new Error(`Database key not set for ${this.collection} model`);
        return (this as any)[(this as any)._model_opts.key];
    }

    get id(): string {
        return this.key;
    }

    get maskedFields() {
        const f = (this as any)._converter_fields;

        const obj: any = {};
        for (const field of f) {
            // Only add field if it does not exist in the maskedFields array
            if((this as any)._model_opts.maskedFields?.indexOf(field) == -1) obj[field] = (this as any)[field];
        }
        return obj
    }

    set maskedFields(obj) {
        const f =  Object.getOwnPropertyNames(obj);
        for (const field of f) {
            // Only add field if it does not exist in the maskedFields array
            if((this as any)._model_opts.maskedFields?.indexOf(field) == -1) (this as any)[field] = obj[field];
        }
    }

    get fields() {
        const f = (this as any)._converter_fields;

        const obj: any = {};
        for (const field of f) {
            obj[field] = (this as any)[field];
        }
        return obj
    }

    set fields(val) {
        const f = Object.getOwnPropertyNames(val);
        for (const field of f) {
            (this as any)[field] = val[field];
        }
    }

    get factories(): InternalFactory {
        const factories = (this as any)._model_opts?.factories || {};

        const r: InternalFactory = {};

        Object.getOwnPropertyNames(factories).forEach((n: string) => {
            r[n] = {
                rerun: factories[n]
            }; 
        });

        return r;
    }

}