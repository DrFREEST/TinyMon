import { GoogleAuthProvider, browserLocalPersistence, browserPopupRedirectResolver, browserSessionPersistence, connectAuthEmulator, fetchSignInMethodsForEmail, getAuth, indexedDBLocalPersistence, initializeAuth, setPersistence, signInWithPopup } from 'firebase/auth'
import { collection, getFirestore } from 'firebase/firestore'
import { deleteObject, getDownloadURL, getMetadata, getStorage, list, listAll, ref as storageRef, updateMetadata, uploadBytes, uploadBytesResumable, uploadString } from "firebase/storage";
import { getAnalytics, setUserId } from 'firebase/analytics'
import {
  useDatabase,
  useFirebaseApp,
  useFirebaseStorage,
  useFirestore,
} from 'vuefire'

import { Capacitor } from "@capacitor/core";
import { generateRandomString } from "src/js/common/tinymonCommon";
import { get } from 'firebase/database';
import { initializeApp } from 'firebase/app'

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdjvozTJjBr5b3QDxUbnSFU1FDu3Hyy7U",
  appName: "TinyMon",
  // authDomain: "auth.tinymon.monster",
  authDomain: "crepapa-692d7.firebaseapp.com",
  databaseURL: "https://crepapa-692d7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crepapa-692d7",
  storageBucket: "gs://crepapa-692d7.appspot.com",
  messagingSenderId: "26773273390",
  appId: "1:26773273390:web:603fcd2f12373ad8af18bf",
  measurementId: "G-7JJDGY0W6Z",
  serviceAccountId: "26773273390-ojm3kalgig3ts0gnk2ro692c9pfdn0og@crepapa-692d7.iam.gserviceaccount.com",
};

// Firebase 초기화
const firebaseApp = initializeApp(firebaseConfig)
let auth;
if (Capacitor.isNativePlatform()) {
  console.log("이건 네이티브 플랫폼이야!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  // auth = initializeAuth(firebaseApp, {
  //   persistence: [browserLocalPersistence, browserSessionPersistence, indexedDBLocalPersistence],
  // })
  auth = getAuth(firebaseApp)
} else {
  auth = getAuth(firebaseApp)
}

const googleProvider = new GoogleAuthProvider()
const appFirestore = useFirestore()
const appStorage = useFirebaseStorage()
const analytics = getAnalytics(firebaseApp)

// 로그인 상태 유지
setPersistence(auth, browserLocalPersistence)

export {
  auth,
  firebaseApp,
  appFirestore,
  appStorage,
  googleProvider,
  analytics,
};
