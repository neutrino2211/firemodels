import { ModelLink, AdminModelLink, FileModelLink } from "./link";

export function field(target: any, key: string) {
    if (!target?._converter_fields) target._converter_fields = [];

    target._converter_fields.push(key);
}

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
        

        target._model_opts.factories[key] = initiator;

        if (typeof target[key] == "undefined") {
            target[key] = target._model_opts.factories[key]();
        }
    }
}

export function listOf(model: any) {
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

export function adminListOf(model: any) {
    return function (target: any, key: string) {
        if (!target?._model_opts) target._model_opts = {};
        if (!target?._model_opts?.links) target._model_opts.links = {};

        target._model_opts.links[key] = (data: Array<string> | string) => {
            const m = new model()
            if (Array.isArray(data)) {
                return data.map(k => new AdminModelLink(k, m._firestore, m.converter))
            } else {
                return new AdminModelLink(data, m._firestore, m.converter)
            }
        }
    }
}

export function fileListOf(model: any) {
    return function (target: any, key: string) {
        if (!target?._model_opts) target._model_opts = {};
        if (!target?._model_opts?.links) target._model_opts.links = {};

        target._model_opts.links[key] = (data: Array<string> | string) => {
            if (Array.isArray(data)) {
                return data.map(k => new FileModelLink(k, model))
            } else {
                return new FileModelLink(data, model)
            }
        }
    }
}