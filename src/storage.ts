import { ModelBase } from "./base";
import { ref, getStorage, FirebaseStorage, StorageReference, getDownloadURL, uploadBytes, getMetadata, FullMetadata, deleteObject, listAll } from "firebase/storage";
import { FileModelLink } from "./link";
import { v4 } from "uuid";
import { fileListOf } from "./decorators";
import axios from "axios";

export class FileModel<T> extends ModelBase {
    private data: Buffer
    private storage: FirebaseStorage
    private reference: StorageReference
    private loadedData: boolean = false;
    private metadata: FullMetadata;
    constructor(private instance: new () => T, private collection: string, fileType: string = "") {
        super()
        this.storage = getStorage(this._app);
        if (!this._id) this._id = v4() + "." + fileType;
        else this._id = this._id.split('/').slice(1).join('/');

        this.reference = ref(this.storage, collection + '/' + this._id)
    }

    static links(): (target: any, key: string) => void {
        return fileListOf(this);
    }

    private confirmDataLoad() {
        if (!this.loadedData) throw new Error(`Data for ${this.collection} file model not loaded`);
    }

    private async from(key: string): Promise<T> {
        const i = new this.instance();
        (this as any)._id = key;
        return i;
    }

    private async fetchAll(): Promise<Array<T>> {
        const all = await listAll(ref(this.storage, this.collection))
        const res = all.items.map(d => {
            const i = new this.instance();
            (this as any)._id = d;
            return i
        });

        return res;
    }

    async fetchContent() {
        const downloadUrl = await getDownloadURL(this.reference);
        const response = await axios.get(downloadUrl, {
            responseType: "blob"
        });
        this.content = Buffer.from(response.data);
        this.loadedData = true;
        this.metadata = await getMetadata(this.reference);
    }

    set content(data: Buffer) {
        this.data = data;
    }

    get content(): Buffer {
        return this.data;
    }

    link () {
        return new FileModelLink(this.reference.fullPath, this.instance)
    }

    async update(): Promise<void> {
        this.confirmDataLoad();
        await uploadBytes(this.reference, this.content, this.metadata)
    }

    async delete(): Promise<void> {
        await deleteObject(this.reference);
    }

    async store(metadata?: FullMetadata): Promise<void> {
        await uploadBytes(this.reference, this.content, metadata || this.metadata)
    }

    async exists(): Promise<boolean> {
        try {
            await getDownloadURL(this.reference);
            return true;
        } catch (e) {
            return false;
        }
    }
}