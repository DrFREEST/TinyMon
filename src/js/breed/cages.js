import { auth, firebaseApp, googleProvider } from 'src/boot/firebase'
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore'

import { generateRandomString } from "src/js/common/tinymonCommon";
import { ref } from 'vue'
import { useCurrentUser } from 'vuefire';
import { userDocRef } from 'src/js/auth/auth';

const db = getFirestore(firebaseApp)
console.log(auth)
// =============================================================================
// Cages 관련 함수 정의
// =============================================================================
// 사육장 정보를 Firestore에 등록
const registCageInfoToFirestore = async (cageInfo) => {
  console.log("사육장 정보를 등록합니다.", cageInfo);
  const pets = [];
  const cageId = Date.now() + "_" + generateRandomString(20);
  const cageDocRef = doc(db, 'cages', cageId);
  // 입력받은 (cageInfo.size.width * cageInfo.size.height) 크기만큼 pets 배열을 생성
  for (let i = 0; i < cageInfo.size.width * cageInfo.size.height; i++) {
    pets.push({
      index: i,
      containedPetId: "",
      containedPetName: "",
    });
  }
  try {
    const cage = {
      id: cageId,
      name: cageInfo.name,
      description: cageInfo.description,
      owner: JSON.parse(localStorage.getItem("currentUser")).user.uid,
      size: {
        width: cageInfo.size.width,
        height: cageInfo.size.height,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pets: pets,
    };
    await setDoc(cageDocRef, cage, { merge: true });
    console.log("사육장 정보를 등록하였습니다.", cage);
    return cage;
  } catch (error) {
    console.error(error);
    return null;
  }
};
// 사육장 정보를 Firestore에서 조회
const getCageInfoFromFirestore = async (cageId) => {
  try {
    const cageDocRef = doc(db, 'cages', cageId);
    const snapshot = await getDoc(cageDocRef);
    console.log("Firestore에서 사육장 정보를 조회합니다.", snapshot.data());
    if (snapshot.exists()) {
      console.log("Firestore에서 사육장 정보를 조회하였습니다.");
      return snapshot.data();
    } else {
      console.log("Firestore에서 사육장 정보를 조회하지 못하였습니다.");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
// 사육장 정보를 Firestore에서 수정
const updateCageInfoFromFirestore = async (cageInfo) => {
  console.log("사육장 정보를 수정합니다.", cageInfo);
  try {
    const cageDocRef = doc(db, 'cages', cageInfo.id);
    const cageSnapshot = await getDoc(cageDocRef);
    if (cageSnapshot.exists()) {
      const cage = cageSnapshot.data();
      if (cageInfo.size.width * cageInfo.size.height > cage.size.width * cage.size.height) {
        // 사육장 크기가 커지면 pets 배열에 추가로 생성된 pet 정보를 추가해야 함
        console.log("사육장 크기가 커짐");
        const newPets = [];
        for (let i = cage.size.width * cage.size.height; i < cageInfo.size.width * cageInfo.size.height; i++) {
          newPets.push({
            index: i,
            containedPetId: null,
            containedPetInfo: null,
          });
        }
        cage.pets = cage.pets.concat(newPets);
      } else if (cageInfo.size.width * cageInfo.size.height < cage.size.width * cage.size.height) {
        console.log("사육장 크기가 작아짐");
        console.log("cage.pets", cage.pets);
        // 사육장 크기가 작아지면 pets 배열에서 삭제된 pet 정보를 삭제해야 함
        // pet 정보를 삭제할 때 삭제될 pet 정보에 containedPetId가 있으면 해당 pet 정보에서 cageID를 ""로 수정해야 함
        for (let i = cageInfo.size.width * cageInfo.size.height; i < cage.size.width * cage.size.height; i++) {
          if (cage.pets[i].containedPetId !== "") {
            const petId = cage.pets[i].containedPetId;
            const petDocRef = doc(userDocRef, `pets/${petId}`);
            const petSnapshot = await getDoc(petDocRef);
            const pet = petSnapshot.data();
            pet.containedCageId = "";
            pet.containedCageIndex = -1;
            await updateDoc(petDocRef, pet);
          }
        }
        cage.pets = cage.pets.slice(0, cageInfo.size.width * cageInfo.size.height);
      }
      cage.name = cageInfo.name;
      cage.description = cageInfo.description;
      cage.size.width = cageInfo.size.width;
      cage.size.height = cageInfo.size.height;
      cage.updatedAt = Date.now();
      await updateDoc(cageDocRef, cage);
      console.log("Firestore에서 사육장 정보를 수정하였습니다.", cage);
      return cage;
    } else {
      console.log("Firestore에서 사육장 정보를 수정하지 못하였습니다.");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
// 사육장 정보를 Firestore에서 삭제
const deleteCageInfoFromFirestore = async (cageId) => {
  try {
    const cageDocRef = doc(db, 'cages', cageId);
    const cageSnapshot = await getDoc(cageDocRef);
    const cage = cageSnapshot.data();
    // 사육장에 속한 pets의 pet 정보에서 containedCageId값이 있으면 해당 pet 정보에서 containedCageId ""로 수정하고 containedCageIndex값도 -1로 수정
    console.log("cage.pets", cage.pets);
    for (let i = 0; i < cage.pets.length; i++) {
      console.log(cage.pets[i].containedPetId)
      if (cage.pets[i].containedPetId !== "") {
        const petId = cage.pets[i].containedPetId;
        const petDocRef = doc(db, 'pets', petId);
        const petSnapshot = await getDoc(petDocRef);
        const pet = petSnapshot.data();
        console.log("pet", pet)
        pet.containedCageId = "";
        pet.containedCageIndex = -1;
        await setDoc(petDocRef, pet, { merge: true });
      }
    }
    // 사육장 정보를 삭제
    await deleteDoc(cageDocRef);
    console.log("Firestore에서 사육장 정보를 삭제하였습니다.");
  } catch (error) {
    console.error(error);
    return false;
  }
};
// 사용자의 사육장 목록 조회
const getCageListFromFirestore = async () => {
  try {
    if (auth.currentUser) {
      const cagesDecRef = collection(db, 'cages');
      const q = query(cagesDecRef, where("owner", "==", JSON.parse(localStorage.getItem("currentUser")).user.uid));
      const querySnapshot = await getDocs(q);
      const cageList = [];
      querySnapshot.forEach((doc) => {
        const cage = doc.data();
        cage.id = doc.id;
        cageList.push(cage);
      });
      console.log("Firestore에서 사용자 사육장 목록을 조회하였습니다.", cageList);
      return cageList;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
// 사육장에 속한 pet 목록 조회
const getContainedPetListFromFirestore = async (cageId) => {
  try {
    const cageDocRef = doc(db, 'cages', cageId);
    const cageSnapshot = await getDoc(cageDocRef);
    if (cageSnapshot.exists()) {
      const cage = cageSnapshot.data();
      const petList = [];
      for (const pet of cage.pets) {
        if (pet.containedPetId !== "") {
          const petDocRef = doc(db, 'pets', pet.containedPetId);
          const petSnapshot = await getDoc(petDocRef);
          if (petSnapshot.exists()) {
            const petInfo = petSnapshot.data();
            petList.push(petInfo);
          }
        }
      }
      console.log("Firestore에서 사육장에 속한 pet 목록을 조회하였습니다.", petList);
      return petList;
    } else {
      console.log("Firestore에서 사육장에 속한 pet 목록을 조회하지 못하였습니다.");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

// 빈 사육장에 pet 배치
const addPetToEmptyCageInFirestore = async (cageId, pet, index) => {
  try {
    console.log("빈 사육장에 pet 배치", cageId, pet);
    const cageDocRef = doc(db, 'cages', cageId);
    const cageSnapshot = await getDoc(cageDocRef);
    if (cageSnapshot.exists) {
      const cageData = cageSnapshot.data();
      const petDocRef = doc(db, 'pets', pet.id);
      const petSnapshot = await getDoc(petDocRef);
      if (petSnapshot.exists) {
        const petData = petSnapshot.data();
        console.log("petData", petData);
        const userCageList = await getCageListFromFirestore(petData.owner);
        console.log("userCageList", userCageList);

        // userCageList의 cage들의 pets 중에 petData.id과 같은 pet을 찾아서 containedPetId, containedPetName 를 ""로 수정
        for (const cage of userCageList) {
          for (const pet of cage.pets) {
            if (pet.containedPetId === petData.id) {
              pet.containedPetId = "";
              pet.containedPetInfo = null;
            }
          }
        }

        // userCageList의 cage들 중 cageId와 같은 cage를 찾아서  pets[index]의 containedPetId, containedPetName을 petData.id, petData.profile.name으로 수정
        for (const cage of userCageList) {
          if (cage.id === cageId) {
            console.log("petData:", petData);
            cage.pets[index].containedPetId = petData.id;
            cage.pets[index].containedPetInfo = {
              name: petData.name ? petData.name : null,
              morph: petData.morph ? petData.morph : null,
              gender: petData.gender ? petData.gender : null,
              lastMatingDate: petData.lastMatingDate ? petData.lastMatingDate : null,
              lastSpawnDate: petData.lastSpawnDate ? petData.lastSpawnDate : null,
              variety: petData.variety ? petData.variety : null,
            };
          }
        }

        // userCageList의 cage들의 변경사항을 Firestore에 반영
        for (const cage of userCageList) {
          const cageDocRef = doc(db, 'cages', cage.id);
          await setDoc(cageDocRef, cage, { merge: true });
        }

        // petData의 변경사항을 Firestore에 반영
        petData.containedCageId = cageId;
        petData.containedCageIndex = index;
        await setDoc(petDocRef, petData);

        console.log("빈 사육장에 pet 배치를 완료하였습니다.");
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

// 사육장에 배치된 pet을 이동
const changePetOrderInFirestore = async (cageId, fromIndex, toIndex) => {
  try {
    console.log("사육장에 배치된 pet을 이동", cageId, fromIndex, toIndex);
    const cageDocRef = doc(db, 'cages', cageId);
    const cageSnapshot = await getDoc(cageDocRef);
    if (cageSnapshot.exists) {
      const cageData = cageSnapshot.data();
      const pet = cageData.pets[fromIndex];
      cageData.pets.splice(fromIndex, 1);
      cageData.pets.splice(toIndex, 0, pet);
      cageData.pets[toIndex].index = toIndex;
      if (fromIndex < toIndex) {
        for (let i = fromIndex; i < toIndex; i++) {
          cageData.pets[i].index = i;
        }
      } else if (fromIndex > toIndex) {
        for (let i = fromIndex; i > toIndex; i--) {
          cageData.pets[i].index = i;
        }
      }
      await setDoc(cageDocRef, cageData, { merge: true });

      // cageData.pets 배열의 정보를 조회하여 containedPetId가 ""가 아닌 pet들의 containedPetIndex를 Firestore에서 수정
      for (const pet of cageData.pets) {
        if (pet.containedPetId !== "") {
          const petDocRef = doc(db, 'pets', pet.containedPetId);
          await setDoc(petDocRef, { containedCageIndex: pet.index }, { merge: true });
        }
      }

      console.log("사육장에 배치된 pet을 이동을 완료하였습니다.");
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

// 사육장에 속한 pet의 배치정보 수정 (pet의 index, containedCageId)
const updateContainedPetInfoInFirestore = async (cageId, petId, petIndex) => {
  try {
    const cageDocRef = doc(db, 'cages', cageId);
    const petDocRef = doc(db, 'pets', petId);
    const [cageSnapshot, petSnapshot] = await Promise.all([cageDocRef.get(), petDocRef.get()]);

    if (cageSnapshot.exists && petSnapshot.exists) {
      const cageData = cageSnapshot.data();
      const petData = petSnapshot.data();

      if (petData.containedCageId === cageId && petData.containedPetId !== "") {
        cageData.pets[petData.containedCageIndex].containedPetId = "";
      }

      if (petIndex !== -1) {
        cageData.pets[petIndex].containedPetId = petId;
      }

      petData.containedCageId = cageId;
      petData.containedCageIndex = petIndex;

      await Promise.all([
        setDoc(cageDocRef, cageData, { merge: true }),
        setDoc(petDocRef, { containedCageId: cageId, containedCageIndex: petIndex }, { merge: true }),
      ]);

      console.log("DB에서 사육장에 속한 pet의 배치정보를 수정하였습니다.");
      return true;
    } else {
      console.log("DB에서 사육장에 속한 pet의 배치정보를 수정하지 못하였습니다.");
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

// 사육장에 속한 pet의 배치정보 삭제 (pet의 index, containedCageId)
const deleteContainedPetInfoFromFirestore = async (cageId, index) => {
  try {
    console.log("사육장에 속한 pet의 배치정보 삭제", cageId, index);
    const cageDocRef = doc(db, 'cages', cageId);
    const cageSnapshot = await getDoc(cageDocRef);

    if (cageSnapshot.exists) {
      const cageData = cageSnapshot.data();

      if (index >= 0 && index < cageData.pets.length) {
        const petId = cageData.pets[index].containedPetId;

        if (petId !== "") {
          const petDocRef = doc(db, 'pets', petId);
          const petSnapshot = await getDoc(petDocRef);

          if (petSnapshot.exists) {
            const petData = petSnapshot.data();

            petData.containedCageId = "";
            petData.containedCageIndex = "";

            await Promise.all([
              setDoc(petDocRef, petData, { merge: true }),
              cageData.pets[index].containedPetId = "",
              cageData.pets[index].containedPetInfo = null,
              setDoc(cageDocRef, cageData, { merge: true }),
            ]);

            console.log("DB에서 사육장에 속한 pet의 배치정보를 삭제하였습니다.");
            return true;
          }
        }
      }
    }

    console.log("DB에서 사육장에 속한 pet의 배치정보를 삭제하지 못하였습니다.");
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export {
  registCageInfoToFirestore,
  getCageInfoFromFirestore,
  getCageListFromFirestore,
  updateCageInfoFromFirestore,
  deleteCageInfoFromFirestore,
  getContainedPetListFromFirestore,
  addPetToEmptyCageInFirestore,
  changePetOrderInFirestore,
  updateContainedPetInfoInFirestore,
  deleteContainedPetInfoFromFirestore
}


