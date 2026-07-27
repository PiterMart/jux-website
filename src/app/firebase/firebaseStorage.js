"use client";
import { getStorage } from "firebase/storage";
import { app } from "./firebaseConfig";

const storage = getStorage(app);
storage.maxUploadRetryTime = 20000;
storage.maxOperationRetryTime = 20000;

export { storage };
