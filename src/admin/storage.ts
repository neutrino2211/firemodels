import { AdminModelBase } from "../base";
import { ref, getStorage, FirebaseStorage, StorageReference, getDownloadURL, uploadBytes, getMetadata, FullMetadata, deleteObject, listAll } from "firebase/storage";
import { FileModelLink } from "../link";
import { v4 } from "uuid";
import { fileListOf } from "../decorators";
import axios from "axios";
import * as storage from "firebase-admin/storage"
import { File as CloudFile } from "@google-cloud/storage"
import { Readable } from "stream";


export class AdminFileModel<T> extends AdminModelBase {
    private data: Buffer
    private storage: storage.Storage
    private loadedData: boolean = false;
    private metadata: FullMetadata;

    public reference: CloudFile
    
    constructor(private instance: new () => T, private collection: string, fileType: string = "") {
        super()
        this.storage = this._app.storage();
        if (!this._id) this._id = v4() + "." + fileType;
        else this._id = this._id.split('/').slice(1).join('/');

        try {
            this.reference = this.storage.bucket().file(collection + '/' + this._id)
        } catch(error) {}
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
        const [all] = await this.reference.parent.getFiles()
        const res = all.map(d => {
            const i = new this.instance();
            (this as any)._id = d.id;
            return i
        });

        return res;
    }

    async fetchContent() {
        const [downloadUrl] = await this.reference.getSignedUrl({
            action: "read",
            expires: Date.now() + (1000 * 60 * 60 * 24)
        });
        const response = await axios.get(downloadUrl, {
            responseType: "blob"
        });
        this.content = Buffer.from(response.data);
        this.loadedData = true;
        this.metadata = await this.reference.metadata;
    }

    set content(data: Buffer) {
        this.data = data;
    }

    get content(): Buffer {
        return this.data;
    }

    link () {
        return new FileModelLink(this.reference.id, this.instance)
    }

    update(): Promise<void> {
        this.confirmDataLoad();
        return new Promise((res, rej) => {
            this.reference.setMetadata(this.metadata)
            Readable.from(this.content).pipe(this.reference.createWriteStream())
            .once("finish", res)
            .once("error", rej)
            // await uploadBytes(this.reference, this.content, this.metadata
        })
    }

    async delete(): Promise<void> {
        await this.reference.delete()
    }

    async store(metadata?: FullMetadata): Promise<void> {
        return new Promise((res, rej) => {
            Readable.from(this.content).pipe(this.reference.createWriteStream())
            .once("finish", () => {
                this.reference.setMetadata(metadata);
                res();
            })
            .once("error", rej)
            // await uploadBytes(this.reference, this.content, this.metadata
        })
    }

    async exists(): Promise<boolean> {
        const [r] = await this.reference.exists()
        return r
    }
}