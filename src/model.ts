import * as firestore from "firebase/firestore";
import { Firestore, getFirestore, collection, where, getDoc, getDocs } from "firebase/firestore";
import { Converter } from "./converter";
import { ModelLink } from "./link";
import { ModelUtils } from "./utils";
import { ModelBase } from "./base";

export class Model<T> extends ModelBase {

    private converter: Converter<T>;
    private _firestore: Firestore;

    public model: ModelUtils;

    constructor(instance: new () => T, private collection: string) {
        super();
        this.converter = new Converter<T>(instance);
        this.model = new ModelUtils(this);
        for (const f in this.converter["factories"]) {
            this[f] = this.converter["factories"][f];
        }
        this._firestore = getFirestore(this._app);
    }

    link() {
        return new ModelLink(this.collection + '/' + this.model.key, this._firestore, this.converter)
    }

    private async from(key: string) {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, key)
        return (await getDoc<T>(doc)).data();
    }

    private async find(key: string, value: string): Promise<T | undefined> {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const query = firestore.query(col, where(key, "==", value));
        const results = (await firestore.getDocs(query));
        if (results.empty) return undefined;
        else return results.docs[0].data();
    }

    private async fetchAll() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const docs = (await getDocs(col)).docs;
        return docs.map(o => o.data())
    }

    async store() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.model.key)
        return firestore.setDoc(doc, this.model.fields);
    }

    async exists() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.model.key)
        return (await getDoc<T>(doc)).exists();
    }

    async update() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.model.key).withConverter(this.converter)
        return firestore.updateDoc(doc, this.model.fields);
    }

    async delete() {
        const col = collection(this._firestore, this.collection).withConverter(this.converter)
        const doc = firestore.doc(col, this.model.key)
        return firestore.deleteDoc(doc);
    }

}