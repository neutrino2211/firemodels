import { FirebaseApp } from "firebase/app";
import { listOf } from "./decorators";
import { ModelType } from "./types"

export abstract class ModelBase {
    protected _id: string = "";
    protected _app: FirebaseApp;

    static forApp<T = any>(app: FirebaseApp): ModelType<T> {
        this.prototype._app = app;
        return this as any;
    }

    static links() {
        return listOf(this);
    }

    static async from(key: string) {
        return new (this as any)().from(key);
    }

    static async find(key: string, value: string) {
        return new (this as any)().find(key, value);
    }

    static async fetchAll() {
        return new (this as any)().fetchAll();
    }

    abstract store(): Promise<void>;
    abstract exists(): Promise<boolean>;
    abstract update(): Promise<void>;
    abstract delete(): Promise<void>;
}