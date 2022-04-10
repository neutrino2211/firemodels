import * as firestore from "firebase/firestore";

export function field(target: any, key: string) {
    if (!target?._converter_fields) target._converter_fields = [];

    target._converter_fields.push(key);
}

export class Converter<T> {
    private fields: string[] = []
    private factories: any = {};
    private links: any = {};
    constructor(private instance: new() => T) {
        this.fields = instance.prototype._converter_fields;
        this.factories = instance.prototype._model_opts?.factories || {}
        this.links = instance.prototype._model_opts?.links || {}
    }

    toFirestore(obj: any): firestore.DocumentData {
        const res: {[key: string]: any} = {}
        for (const field of this.fields) {
            if (this.factories[field]) res[field] = this.factories[field];
            else if (this.links[field]) {
                if (Array.isArray(obj[field])) {
                    res[field] = obj[field].map(o => o.reference)
                } else {
                    res[field] = obj[field].reference
                }
            } else {
                res[field] = obj[field];
            }
        }

        return res;
    }

    fromFirestore(snapshot: firestore.QueryDocumentSnapshot): T {
        const data = snapshot.data();
        const i = new this.instance();
        for (const field of this.fields) {
            if (this.links[field]) (i as any)[field] = this.links[field](data[field]);
            else (i as any)[field] = data[field];
        }
        (i as any)["_id"] = snapshot.id;
        return i
    }
}