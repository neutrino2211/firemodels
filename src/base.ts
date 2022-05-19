import { FirebaseApp } from "firebase/app";
import { app } from "firebase-admin"
import { listOf, adminListOf } from "./decorators";
import { ModelType } from "./types";

abstract class _base {
    protected _id: string;
    

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

export abstract class ModelBase extends _base {
    protected _app: FirebaseApp;

    static forApp<T = any>(app: FirebaseApp): ModelType<T> {
        this.prototype._app = app;
        return this as any;
    }
}

export abstract class AdminModelBase extends _base {
    protected _app: app.App;

    static forApp<T = any>(app: app.App): ModelType<T> {
        this.prototype._app = app;
        return this as any;
    }

    static links() {
        return adminListOf(this);
    }
}