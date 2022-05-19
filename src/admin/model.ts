import * as firestore from "firebase-admin/firestore";
import { AdminConverter } from "../converter";
import { AdminModelLink } from "../link";
import { ModelUtils } from "../utils";
import { AdminModelBase } from "../base";

export class AdminModel<T> extends AdminModelBase {

    private converter: AdminConverter<T>;
    private _firestore: firestore.Firestore;

    public model: ModelUtils;

    constructor(instance: new () => T, private collection: string) {
        super();
        this.converter = new AdminConverter<T>(instance);
        this.model = new ModelUtils(this);
        for (const f in this.converter["factories"]) {
            this[f] = this.converter["factories"][f]();
        }
        this._firestore = this._app.firestore()
    }

    link() {
        return new AdminModelLink(this.collection + '/' + this.model.key, this._firestore, this.converter)
    }

    private async from(key: string) {
        const col = this._firestore.collection(this.collection).withConverter(this.converter)
        const doc = col.doc(key)
        return (await doc.get()).data();
    }

    private async find(key: string, value: string): Promise<T | undefined> {
        const col = this._firestore.collection(this.collection).withConverter(this.converter)
        const query = col.where(key, "==", value);
        const results = await query.get();
        if (results.empty) return undefined;
        else return results.docs[0].data();
    }

    private async fetchAll() {
        const col = this._firestore.collection(this.collection).withConverter(this.converter)
        const docs = (await col.get()).docs;
        return docs.map(o => o.data())
    }

    async store() {
        const col = this._firestore.collection(this.collection).withConverter(this.converter)
        const doc = col.doc(this.model.key);
        await doc.set(this.model.fields);
    }

    async exists() {
        const col = this._firestore.collection(this.collection).withConverter(this.converter)
        const doc = col.doc(this.model.key)
        return (await doc.get()).exists;
    }

    async update() {
        const col = this._firestore.collection(this.collection).withConverter(this.converter)
        const doc = col.doc(this.model.key).withConverter(this.converter)
        await doc.update(this.model.fields);
    }

    async delete() {
        const col = this._firestore.collection(this.collection).withConverter(this.converter)
        const doc = col.doc(this.model.key)
        await doc.delete();
    }

}