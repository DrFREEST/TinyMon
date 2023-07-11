import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { appStorage, auth, firebaseApp, googleProvider } from 'src/boot/firebase'
import { deleteObject, getDownloadURL, getMetadata, getStorage, list, listAll, ref as storageRef, updateMetadata, uploadBytes, uploadBytesResumable, uploadString } from "firebase/storage";
import { estimateHatchDate, generateRandomString } from "src/js/common/tinymonCommon";

import { ref } from 'vue'
import { userDocRef } from "src/js/auth/auth";

// =============================================================================
// Eggs 관련 함수 정의
// =============================================================================
const db = getFirestore();

// 사용자 알 목록 가져오기
const getUserEggList = async () => {
  const eggList = ref([]);
  const eggColRef = collection(db, 'eggs');
  const eggQuery = query(eggColRef, where("owner", "==", auth.currentUser.uid));
  const eggSnapshot = await getDocs(eggQuery);
  eggSnapshot.forEach((doc) => {
    eggList.value.push(doc.data());
  });

  return eggList;
}

// 알 정보 자동 등록
const registEggInfoToDatabase = async (eggInfo) => {
  console.log("registEggInfoToDatabase", eggInfo)
  // eggInfo 의 eggCount 만큼 알 정보를 생성한다.
  for (let i = 0; i < eggInfo.eggCount; i++) {
    const eggId = Date.now() + "_" + generateRandomString(20);
    const eggDocRef = doc(db, 'eggs', eggId);
    const eggDocSnapshot = await getDoc(eggDocRef);
    const eggData = {
      createdAt: Date.now(),
      estimatedHatchDate: estimateHatchDate("crested gecko", eggInfo.eventDate, eggInfo.incubatorTemp),
      familyTree: !eggInfo.father ? {
        mother: eggInfo.mother.id
      } : {
        father: eggInfo.father.id,
        mother: eggInfo.mother.id
      },
      id: eggId,
      incubatorTemp: eggInfo.incubatorTemp,
      medias: [],
      name: !eggInfo.father ? `${eggInfo.mother.name}의 ${i + 1}번 알` : `${eggInfo.father.name} & ${eggInfo.mother.name}의 ${i + 1}번 알(${new Date(eggInfo.eventDate).toLocaleDateString()})`,
      owner: auth.currentUser.uid,
      spawnDate: eggInfo.eventDate,
      variety: eggInfo.mother.variety
    }

    console.log("eggData", eggData);
    // eggInfo.eggStatus[i]가 true 이면 알의 정보를 DB에 저장한다.
    if (eggInfo.eggStatus[i]) {
      await setDoc(eggDocRef, eggData, { merge: true });
    }
  }
}
// 알 정보 수동 등록
const registEggInfoToDatabaseManual = async (eggInfo) => {
  console.log("registEggInfoToDatabaseManual", eggInfo)
  const eggId = eggInfo.id ? eggInfo.id : Date.now() + "_" + generateRandomString(20);
  const eggDocRef = doc(db, 'eggs', eggId);
  const eggData = {
    createdAt: Date.now(),
    estimatedHatchDate: eggInfo.estimatedHatchDate,
    father: eggInfo.father,
    id: eggId,
    mother: eggInfo.mother,
    name: eggInfo.name,
    owner: auth.currentUser.uid,
    spawnDate: eggInfo.spawnDate,
    variety: eggInfo.variety
  }
  await setDoc(eggDocRef, eggData, { merge: true });
}
// 알 정보 수정
const updateEggInfoToDatabase = async (eggInfo) => {
  // console.log("updateEggInfoToDatabase", eggInfo)
  const eggDocRef = doc(db, 'eggs', eggInfo.id);
  const eggData = {
    estimatedHatchDate: eggInfo.estimatedHatchDate,
    father: eggInfo.father,
    mother: eggInfo.mother,
    name: eggInfo.name,
    spawnDate: eggInfo.spawnDate,
    variety: eggInfo.variety,
    updatedAt: Date.now()
  }
  await setDoc(eggDocRef, eggData, { merge: true });
}

// 알 정보 삭제
const deleteEggInfoFromDatabase = async (eggId) => {
  console.log("deleteEggInfoFromDatabase", eggId)
  const eggDocRef = doc(db, 'eggs', eggId);
  await deleteDoc(eggDocRef);
}

// =============================================================================
// Eggs 관련 함수 내보내기
// =============================================================================
export { registEggInfoToDatabase, registEggInfoToDatabaseManual, updateEggInfoToDatabase, getUserEggList, deleteEggInfoFromDatabase }
