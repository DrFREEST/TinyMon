import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc, startAt, updateDoc, where } from 'firebase/firestore';
import { appStorage, auth, firebaseApp, googleProvider } from 'src/boot/firebase'
import { deleteObject, getDownloadURL, getMetadata, getStorage, list, listAll, ref as storageRef, updateMetadata, uploadBytes, uploadBytesResumable, uploadString } from 'firebase/storage';

import { deleteContainedPetInfoFromFirestore } from 'src/js/breed/cages';
import { generateRandomString } from 'src/js/common/tinymonCommon';
import { ref } from 'vue'

// =============================================================================
// Pets 관련 함수 정의
// =============================================================================
const db = getFirestore(firebaseApp);

// 사용자 개체 목록 조회
const getUserPetsListFromFirestore = async () => {
  try {
    const petsCol = collection(db, 'pets');
    const petsQuery = query(petsCol, where('owner', '==', auth.currentUser.uid));
    const petsSnapshot = await getDocs(petsQuery);
    console.log('사용자 개체 목록을 조회합니다.', petsSnapshot);
    return petsSnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error(error);
    return null;
  }
}
// 개체 정보 생성
const registPetInfoToFirestore = async (petInfo) => {
  const petId = Date.now() + '_' + generateRandomString(20);
  const petDocRef = doc(db, 'pets', petId);
  console.log('개체 정보를 생성합니다.', petInfo);
  const initialData = {
    containedCageId: petInfo.containedCageId ? petInfo.containedCageId : '',
    containedCageIndex: petInfo.containedCageIndex ? petInfo.containedCageIndex : -1,
    createdAt: Date.now(),
    familyTree: {},
    gender: petInfo.gender ? petInfo.gender : '',
    hatchedAt: petInfo.hatchedAt ? petInfo.hatchedAt : '',
    history: {},
    id: petId,
    morph: petInfo.morph ? petInfo.morph : '',
    name: petInfo.name ? petInfo.name : '',
    owner: auth.currentUser.uid,
    medias: [],
    updatedAt: Date.now(),
    variety: petInfo.variety ? petInfo.variety : ''
  };
  try {
    await setDoc(petDocRef, initialData, { merge: true });
    console.log('개체 정보를 생성하였습니다.', petInfo);
    return petId;
  } catch (error) {
    console.error(error);
    return null;
  }
}
// 개체 기본 정보(profile) 수정
const updatePetInfoProfileToFirestore = async (petInfo) => {
  console.log('개체 정보를 수정합니다.', petInfo);
  const petDocRef = doc(db, 'pets', petInfo.id);
  const petData = await getDoc(petDocRef);
  const petInfoData = petData.data();
  petInfoData.gender = petInfo.gender ? petInfo.gender : '';
  petInfoData.hatchedAt = petInfo.hatchedAt ? petInfo.hatchedAt : '';
  petInfoData.morph = petInfo.morph ? petInfo.morph : '';
  petInfoData.name = petInfo.name ? petInfo.name : '';
  petInfoData.updatedAt = Date.now();
  petInfoData.variety = petInfo.variety ? petInfo.variety : '';
  try {
    await setDoc(petDocRef, petInfoData, { merge: true });
    const cagesRef = collection(db, 'cages');
    const cageRefQuery = query(cagesRef, where('owner', '==', auth.currentUser.uid));
    const cagesSnapshot = await getDocs(cageRefQuery);
    if (cagesSnapshot.docs.length > 0) {
      const cages = cagesSnapshot.docs.map(doc => doc.data());
      for (const cage of cages) {
        console.log("cage", cage)
        const targetCageRef = doc(db, 'cages', cage.id);
        if (cage.pets) {
          for (const petIndex in cage.pets) {
            if (cage.pets[petIndex].containedPetId === petInfoData.id) {
              // console.log('사육장에서 개체 정보를 수정합니다.', cage.pets[petIndex].containedPetInfo, petInfo)
              cage.pets[petIndex].containedPetInfo = {
                name: petInfoData.name,
                morph: petInfoData.morph,
                gender: petInfoData.gender,
                lastSpawnDate: petInfoData.lastSpawnDate,
                variety: petInfoData.variety,
              };
              await setDoc(targetCageRef, cage, { merge: true });
            }
          }
        }
      }
    }
    console.log('개체 정보를 수정하였습니다.', petInfo);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// 개체 정보 삭제
const deletePetInfo = async (petId) => {
  console.log('개체 정보를 삭제합니다.', petId);
  const petDocRef = doc(db, 'pets', petId);
  const petData = await getDoc(petDocRef);
  const petInfo = petData.data();
  try {
    // 개체 삭제 전 개체가 속한 사육장에서 개체 정보를 삭제한다.
    console.log(petInfo)
    if (petInfo.containedCageId) {
      await deleteContainedPetInfoFromFirestore(petInfo.containedCageId, petInfo.containedCageIndex);
    }
    // return false;
    await deleteDoc(petDocRef);
    console.log('개체 정보를 삭제하였습니다.', petId);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// 개체 사진 업로드
const uploadPetPhoto = async (files, description, petId, groupId) => {
  console.log('개체 사진을 업로드합니다.', petId, files);
  const db = getFirestore();
  const storage = getStorage();
  const petPhotoDocRef = doc(db, 'pets', petId);
  const petPhotoDocSnapshot = await getDoc(petPhotoDocRef);
  const petPhotoDocData = petPhotoDocSnapshot.data();
  petPhotoDocData.medias = petPhotoDocData.medias ? petPhotoDocData.medias : [];
  const mediaId = Date.now() + '_' + generateRandomString(20);
  const groupPhotos = {
    createdAt: Date.now(),
    description: description,
    groupId: groupId,
    petId: petId,
    userId: auth.currentUser.uid,
    files: []
  };

  files.forEach((file) => {
    const fileId = Date.now() + '_' + generateRandomString(20);
    console.log(file);
    console.log(`uploadFiles/pets/${mediaId}/${fileId}`)
    try {
      const petPhotoRef = storageRef(storage, `uploadFiles/pets/${mediaId}/${fileId}`);
      uploadBytes(petPhotoRef, file).then((snapshot) => {
        console.log('Uploaded a blob or file!', snapshot);
        getDownloadURL(snapshot.ref).then((url) => {
          console.log('File available at', url);
          groupPhotos.files.push({
            fileId: fileId,
            fileType: file.type,
            fileUrl: url,
            thumbnailUrl: file.thumbnailUrl,
          });
        });
      });
      // console.log('개체 사진을 업로드하였습니다.', petId, files);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  });
  petPhotoDocData.medias = petPhotoDocData.medias.concat(groupPhotos);
  setDoc(petPhotoDocRef, petPhotoDocData, { merge: true });
};


// =============================================================================
/* Pets History 관련 함수 */
// =============================================================================
// 개체 이벤트 추가
// eventType: "mating", "weight", "spawn", "born", "death", "sale", "purchase", "familyTree", "other"
const registPetsEvent = async (eventType, eventDetail) => {
  // eventType별로 분기
  switch (eventType) {
    case "mating":
      // mating: 암수 개체 정보를 받아서 matingEvent에 추가
      // eventDetail : {female,male,scheduleType,eventDate}
      console.log("개체 교배 이벤트를 등록합니다.", eventDetail);
      const femaleDbRef = doc(db, 'pets', eventDetail.female.id);
      const femaleDbSnapshot = await getDoc(femaleDbRef);
      const femaleDbData = femaleDbSnapshot.data();
      // femaleDbData.history.mating 이 없으면 빈 배열 생성
      if (!femaleDbData.history.mating) {
        femaleDbData.history.mating = [];
      } else {
      }
      femaleDbData.history.mating.push({ matingDate: eventDetail.eventDate, matingPartner: eventDetail.male.id })
      femaleDbData.history.mating = Object.values(femaleDbData.history.mating).sort((a, b) => b.matingDate - a.matingDate);
      console.log("femaleDbData.history.spawn 배열을 spawnDate 순으로 내림차순 정렬합니다.", femaleDbData.history.mating);
      // motherDbData.history.spawn 배열의 첫번째 요소의 spawnDate가 eventDetail.eventDate보다 크면 motherDbData.lastSpawnDate에 motherDbData.history.spawn 배열의 첫번째 요소의 spawnDate를 저장
      if (femaleDbData.history.mating.length > 0 && femaleDbData.history.mating[0].matingDate > eventDetail.eventDate) {
        femaleDbData.lastMatingDate = femaleDbData.history.mating[0].matingDate;
      } else {
        femaleDbData.lastMatingDate = eventDetail.eventDate;
      }


      const maleDbRef = doc(db, 'pets', eventDetail.male.id);
      const maleDbSnapshot = await getDoc(maleDbRef);
      const maleDbData = maleDbSnapshot.data();
      if (!maleDbData.history.mating) {
        maleDbData.history.mating = [];
      } else {
      }
      maleDbData.history.mating.push({ matingDate: eventDetail.eventDate, matingPartner: eventDetail.female.id })
      maleDbData.history.mating = Object.values(maleDbData.history.mating).sort((a, b) => b.matingDate - a.matingDate);
      console.log("maleDbData.history.spawn 배열을 spawnDate 순으로 내림차순 정렬합니다.", maleDbData.history.mating);
      // motherDbData.history.spawn 배열의 첫번째 요소의 spawnDate가 eventDetail.eventDate보다 크면 motherDbData.lastSpawnDate에 motherDbData.history.spawn 배열의 첫번째 요소의 spawnDate를 저장
      if (maleDbData.history.mating.length > 0 && maleDbData.history.mating[0].matingDate > eventDetail.eventDate) {
        maleDbData.lastMatingDate = maleDbData.history.mating[0].matingDate;
      } else {
        maleDbData.lastMatingDate = eventDetail.eventDate;
      }


      // femaleDbData.lastMatingDate = eventDetail.eventDate;
      // femaleDbData.history = { 'mating': { [eventDetail.eventDate]: { matingDate: eventDetail.eventDate, matingPartner: eventDetail.male.id } } };
      // maleDbData.lastMatingDate = eventDetail.eventDate;
      // maleDbData.history = { 'mating': { [eventDetail.eventDate]: { matingDate: eventDetail.eventDate, matingPartner: eventDetail.female.id } } };

      // femaleDbRef의 history 배열에 initialFemaleEvent 추가
      await setDoc(femaleDbRef, femaleDbData, { merge: true });
      await setDoc(maleDbRef, maleDbData, { merge: true });
      break;

    case "weight":
      // weight: 개체 체중을 받아서 weightEvent에 추가
      // eventDetail : {id,weight,eventDate}
      console.log("개체 체중 이벤트를 등록합니다.", eventDetail);
      const petDbRef = doc(db, 'pets', eventDetail.id);
      const petDbSnapshot = await getDoc(petDbRef);
      const petDbData = petDbSnapshot.data();
      if (!petDbData.history.weight) {
        petDbData.history.weight = [];
      }
      petDbData.history.weight.push({ weightDate: eventDetail.eventDate, weight: eventDetail.weight });
      await setDoc(petDbRef, petDbData, { merge: true });
      break;

    case "spawn":
      // spawn: 부모 개체 정보를 받아서 spawnEvent에 추가
      // eventDetail : {mother,father,eggCount,eggStatus,eventDate}
      console.log("개체 산란 이벤트를 등록합니다.", eventDetail);
      const motherDbRef = doc(db, 'pets', eventDetail.mother.id);
      const motherDbSnapshot = await getDoc(motherDbRef);
      const motherDbData = motherDbSnapshot.data();
      // motherDbData.history.spawn 배열을 spawnDate 순으로 내림차순 정렬
      if (!motherDbData.history.spawn) {
        motherDbData.history.spawn = [];
      }
      motherDbData.history.spawn = Object.values(motherDbData.history.spawn).sort((a, b) => b.spawnDate - a.spawnDate);
      console.log("motherDbData.history.spawn 배열을 spawnDate 순으로 내림차순 정렬합니다.", motherDbData.history.spawn);
      // motherDbData.history.spawn 배열의 첫번째 요소의 spawnDate가 eventDetail.eventDate보다 크면 motherDbData.lastSpawnDate에 motherDbData.history.spawn 배열의 첫번째 요소의 spawnDate를 저장
      if (motherDbData.history.spawn.length > 0 && motherDbData.history.spawn[0].spawnDate > eventDetail.eventDate) {
        motherDbData.lastSpawnDate = motherDbData.history.spawn[0].spawnDate;
      } else {
        motherDbData.lastSpawnDate = eventDetail.eventDate;
      }
      console.log("motherDbData.lastSpawnDate : ", new Date(motherDbData.lastSpawnDate).toLocaleDateString());
      motherDbData.history.spawn.push({ spawnDate: eventDetail.eventDate, eggCount: eventDetail.eggCount ? eventDetail.eggCount : 1, eggStatus: eventDetail.eggStatus ? eventDetail.eggStatus : true, matingPartner: eventDetail.father ? eventDetail.father.id : null });
      await setDoc(motherDbRef, motherDbData, { merge: true });

      // motherDbData에 containedCageId, containedCageIndex가 있으면 해당 케이지의 정보도 업데이트
      console.log("motherDbData.containedCageId && motherDbData.containedCageIndex", motherDbData.containedCageId, motherDbData.containedCageIndex);
      if (motherDbData.containedCageId !== '' && motherDbData.containedCageIndex !== -1) {
        const motherCageDbRef = doc(db, 'cages', motherDbData.containedCageId);
        const motherCageDbSnapshot = await getDoc(motherCageDbRef);
        const motherCageDbData = motherCageDbSnapshot.data();
        motherCageDbData.pets[motherDbData.containedCageIndex].containedPetInfo.lastSpawnDate = motherDbData.lastSpawnDate;
        await setDoc(motherCageDbRef, motherCageDbData, { merge: true });
      }
      break;

    case "familyTree":
      // familyTree: familyTree 정보를 받아서 펫의 familyTree에 업데이트
      // eventDetail : {}
      console.log("개체 familyTree 정보를 저장합니다.", eventDetail);
      const familyTargetPetDbRef = doc(db, 'pets', eventDetail.id);
      const familyTargetPetDbSnapshot = await getDoc(familyTargetPetDbRef);
      const familyTargetPetDbData = familyTargetPetDbSnapshot.data();
      familyTargetPetDbData.familyTree = eventDetail;
      await setDoc(familyTargetPetDbRef, familyTargetPetDbData, { merge: true });
      break;

    case "born":
      // born: 부모 개체 정보를 받아서 bornEvent에 추가
      // eventDetail : {id, mother,father,eventDate}
      console.log("개체 부화 이벤트를 등록합니다.", eventDetail);
      // eggs db에 있는 egg 정보를 eventDetail정보로 업데이트 후 가져와서 pet db에 추가
      const eggsDbRef = doc(db, 'eggs', eventDetail.id);
      const eggsDbSnapshot = await getDoc(eggsDbRef);
      const eggsDbData = eggsDbSnapshot.data();
      await setDoc(eggsDbRef, eventDetail, { merge: true }).then(async () => {
        console.log("eggsDbRef에 eventDetail정보로 업데이트했습니다.", eventDetail);
        const fromEggsDbRef = doc(db, 'eggs', eventDetail.id);
        const fromEggsDbSnapshot = await getDoc(fromEggsDbRef);
        const fromEggsDbData = fromEggsDbSnapshot.data();
        console.log("fromEggsDbData : ", fromEggsDbData);
        const toPetDbRef = doc(db, 'pets', eventDetail.id);
        const toPetDbSnapshot = await getDoc(toPetDbRef);
        const toPetDbData = toPetDbSnapshot.data();
        console.log("toPetDbData : ", toPetDbData);
        await setDoc(toPetDbRef, fromEggsDbData, { merge: true }).then(async () => {
          console.log("toPetDbRef에 fromEggsDbData를 추가했습니다.", fromEggsDbData);
          // eggs db에서 해당 egg 정보를 삭제
          await deleteDoc(fromEggsDbRef).then(() => {
            console.log("fromEggsDbRef에서 해당 egg 정보를 삭제했습니다.", fromEggsDbRef);
          });
        });

      });
      break;

    case "death":
      // death: 개체 정보를 받아서 deathEvent에 추가
      // eventDetail : {id,eventDate}
      console.log("개체 사망 이벤트를 등록합니다.", eventDetail);
      break;

    case "sale":
      // sale: 개체 정보를 받아서 saleEvent에 추가
      // eventDetail : {id,eventDate,price,seller,buyer}
      console.log("개체 판매 이벤트를 등록합니다.", eventDetail);
      break;
    case "purchase":
      // purchase: 개체 정보를 받아서 purchaseEvent에 추가
      // eventDetail : {id,eventDate,price,seller,buyer}
      console.log("개체 구매 이벤트를 등록합니다.", eventDetail);
      break;

    case "other":
      // other: 개체 정보를 받아서 otherEvent에 추가
      // eventDetail : {id,eventDate,description}
      console.log("개체 기타 이벤트를 등록합니다.", eventDetail);
      break;
  }
}
// 최종 history값 가져오기
const getPetLastHistory = (historyList) => {
  console.log(historyList);
  const historyKeys = Object.entries(historyList).sort((a, b) => {
    return a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0;
  });
  console.log(historyKeys);
  return historyKeys[0][0];

}
// 선택 개체의 familyTree 가져오기
const getFamilyTree = async (petId) => {
  const db = getFirestore();
  const petDbRef = doc(db, 'pets', petId);
  const petDbSnapshot = await getDoc(petDbRef).then((doc) => {
    const petDbData = doc.data();
    const familyTree = petDbData.familyTree;
    console.log("familyTree", familyTree);
    return familyTree;
  });
}


// =============================================================================
// Pets 관련 함수 내보내기
// =============================================================================
export { getUserPetsListFromFirestore, registPetInfoToFirestore, updatePetInfoProfileToFirestore, deletePetInfo, registPetsEvent, getPetLastHistory, getFamilyTree, uploadPetPhoto };
