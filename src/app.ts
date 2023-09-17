import { initializeApp as admin } from "firebase-admin/app";
import { initializeApp as normal } from "firebase/app";

export const createAdminApp = admin;
export const createApp = normal;