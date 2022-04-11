import { InternalFactory } from "./types"

export class ModelUtils {
    private modelOptions: any;
    private converterFields: any;
    
    private collection: string;

    private getId: () => string;
    private getModel: () => any;

    constructor(_model: any) {
        this.modelOptions = _model._model_opts;
        this.converterFields = _model._converter_fields;
        this.getId = () => _model._id;
        this.getModel = () => _model;
        this.collection = _model.collection;
    }

    get key() {
        if (this.getId()) return this.getId();
        else if (!this.modelOptions?.key) throw new Error(`Database key not set for ${this.collection} model`);
        return this.getModel()[this.modelOptions.key];
    }

    get id(): string {
        return this.key;
    }

    get maskedFields() {
        const f = this.converterFields

        const obj: any = {};
        for (const field of f) {
            // Only add field if it does not exist in the maskedFields array
            if(this.modelOptions.maskedFields?.indexOf(field) == -1) obj[field] = this.getModel()[field];
        }
        return obj
    }

    set maskedFields(obj) {
        const f =  Object.getOwnPropertyNames(obj);
        for (const field of f) {
            // Only add field if it does not exist in the maskedFields array
            if(this.modelOptions.maskedFields?.indexOf(field) == -1) this.getModel()[field] = obj[field];
        }
    }

    get fields() {
        const f = this.converterFields;

        const obj: any = {};
        for (const field of f) {
            obj[field] = this.getModel()[field];
        }
        return obj
    }

    set fields(val) {
        const f = Object.getOwnPropertyNames(val);
        for (const field of f) {
            this.getModel()[field] = val[field];
        }
    }

    get factories(): InternalFactory {
        const factories = this.modelOptions.factories || {};

        const r: InternalFactory = {};

        Object.getOwnPropertyNames(factories).forEach((n: string) => {
            r[n] = {
                rerun: factories[n]
            }; 
        });

        return r;
    }
}
