import { Model } from "./model";
import { FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export class FiremodelApp {
    constructor(private app?: FirebaseApp) {}

    FireModel<T> (model: any): new () => T {
        const app = this.app;
        (model as any).prototype._app = app;
        (model as any).prototype._firestore = getFirestore(app);
        return model;
    }
}

export * from "./link";
export * from "./model";
export * from "./decorators"

/**
 * const instance = new Instance(app);
 * 
 * const AppUser = instance.FireModel<User>();
 * const user = AppUser.from()
 */