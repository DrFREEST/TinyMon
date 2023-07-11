<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card flat class="tw-w-[40rem] tw-max-w-[90vw]">
      <q-card-section
        class="dialog-title tw-p-[1rem] tw-leading-[1.5]"
        tag="h2"
      >
        {{ $props.dialogTitle }}
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
        <h3>현재 개체</h3>
        <p>이름: {{ currentPet.name }}</p>
        <p>성별: {{ currentPet.gender }}</p>
        <p>모프: {{ currentPet.morph }}</p>
      </q-card-section>
      <q-card-section>
        <h3>메이팅 파트너</h3>
        <q-select
          v-model="selectedPartner"
          label="메이팅 파트너"
          :options="partnerOptions"
          :option-value="(item) => item"
          :option-label="
            (item) => `${item.name} (${item.morph}/${item.weight}g)`
          "
          :options-dense="true"
        >
          <!--  -->
        </q-select>

        <q-input v-model="matingDate" label="메이팅 날짜" type="date"></q-input>
        <q-btn
          label="기록 추가"
          class="tw-w-full tw-mt-[1rem]"
          color="primary"
          @click="addMatingHistory"
        ></q-btn>
      </q-card-section>
      <q-card-section v-if="matingList">
        <h3>메이팅 이력</h3>
        <!-- 메이팅 이력 표 -->
        <q-table
          flat
          dense
          :rows="matingList"
          no-data-label="메이팅 이력이 없습니다."
          binary-state-sort
          column-sort-order="ad"
          rows-per-page-label="페이지 당 행 수:"
          :pagination="tablePagination"
          @request="
            console.log(
              '-----------------------------------------------------------------'
            )
          "
        >
          <template v-slot:header-cell="headerProps">
            <q-th :props="headerProps">{{
              headerProps.col.name === "partnerName" ? "파트너" : "메이팅 날짜"
            }}</q-th>
          </template>
          <template v-slot:body="bodyProps">
            <q-tr :props="bodyProps">
              <q-td key="partnerName" :props="bodyProps">{{
                bodyProps.row.partnerName
              }}</q-td>
              <q-td key="matingDate" :props="bodyProps">{{
                new Date(bodyProps.row.matingDate).toLocaleDateString()
              }}</q-td>
            </q-tr>
          </template>
        </q-table>
        <!-- //메이팅 이력 표 -->
      </q-card-section>
      <q-card-actions>
        <q-btn label="취소" @click="onDialogCancelClick"></q-btn>
        <q-btn label="확인" @click="onDialogOKClick"></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useDatabaseList, useDocument, useCollection } from "vuefire";
import { useRouter } from "vue-router";
import { useDialogPluginComponent } from "quasar";
import { auth, firebaseApp, appFirestore } from "boot/firebase";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  and,
  or,
} from "firebase/firestore";
import { registPetsEvent } from "src/js/breed/pets";
const props = defineProps({
  dialogTitle: {
    type: String,
    default: "",
  },
  currentPetId: {
    type: String,
    default: "",
  },
  currentPetName: {
    type: String,
    default: "",
  },
  currentPetGender: {
    type: String,
    default: "",
  },
  currentPetMorph: {
    type: String,
    default: "",
  },
  currentPetVariety: {
    type: String,
    default: "",
  },
  currentPetBirthDate: {
    type: String,
    default: "",
  },
  currentPetWeight: {
    type: Number,
    default: 0,
  },
});
console.log("props", props);

const currentTargetPetId = ref(props.currentPetId);
const currentTargetPetName = ref(props.currentPetName);
const currentTargetPetGender = ref(props.currentPetGender);
const currentTargetPetMorph = ref(props.currentPetMorph);
const currentTargetPetVariety = ref(props.currentPetVariety);
const currentTargetPetBirthDate = ref(props.currentPetBirthDate);
const currentTargetPetWeight = ref(props.currentPetWeight);

const currentPet = ref({});
currentPet.value = {
  id: currentTargetPetId.value,
  name: currentTargetPetName.value,
  gender: currentTargetPetGender.value,
  morph: currentTargetPetMorph.value,
  variety: currentTargetPetVariety.value,
  birthDate: currentTargetPetBirthDate.value,
  weight: currentTargetPetWeight.value,
};
watch(currentPet, (newValue, oldValue) => {
  console.log("selectedPet changed");
  console.log(newValue);
  console.log(oldValue);
});
const selectedPartner = ref(null);
const partnerOptions = ref([]);
const matingDate = ref(null);
const matingList = ref([]);

// 사용자 DB 'users/${JSON.parse(localStorage.getItem("currentUser")).user.uid}/pets/'에서 현재 선택된 펫의 반대 성별 개체들 중에서 메이팅 파트너를 선택할 수 있도록 리스트를 생성 후 partnerOptions에 넣는다.

const getTargetInfo = async (id) => {
  const db = getFirestore(firebaseApp);
  const matingPartnerRef = doc(db, "pets", id);
  const matingPartnerDoc = await getDoc(matingPartnerRef);
  const matingPartnerData = matingPartnerDoc.data();
  return matingPartnerData;
};

const getPetName = async (id) => {
  const db = getFirestore(firebaseApp);
  const petRef = doc(db, "pets", id);
  const petDoc = await getDoc(petRef);
  const petData = petDoc.data();
  // petData.name 를 텍스트로 리턴
  return petData.name;
};

const addMatingHistory = async () => {
  const dataSet = {
    female:
      currentPet.value.gender === "female"
        ? currentPet.value
        : selectedPartner.value,
    male:
      currentPet.value.gender === "male"
        ? currentPet.value
        : selectedPartner.value,
    scheduleType: "mating",
    eventDate: new Date(matingDate.value).getTime(),
  };
  await registPetsEvent("mating", dataSet).then((result) => {
    loadMatingHistory();
  });
};

const tablePagination = ref({
  sortBy: "matingDate",
  descending: true,
  page: 1,
  rowsPerPage: 0,
});

const loadMatingHistory = async () => {
  const db = getFirestore(firebaseApp);
  const targetPetDocRef = doc(db, "pets", currentTargetPetId.value);
  const targetPetDocSnapshot = await getDoc(targetPetDocRef);
  const targetPetDoc = targetPetDocSnapshot.data();
  matingList.value = [];
  targetPetDoc.history.mating.forEach(async (mating) => {
    const targetInfo = await getTargetInfo(mating.matingPartner);
    const mateData = {
      partnerName: `${targetInfo.name}(${targetInfo.morph})`,
      matingDate: mating.matingDate,
    };
    matingList.value.push(mateData);

    // mating.matingPartner = null;
  });
  console.log("matingList", matingList.value);
};

onMounted(async () => {
  loadMatingHistory();
  // console.log("targetPetDoc", targetPetDoc.value.history.mating);
  const db = getFirestore(firebaseApp);
  const userPetsRef = collection(db, "pets");
  const userPetsQuery = query(
    userPetsRef,
    and(
      where(
        "owner",
        "==",
        JSON.parse(localStorage.getItem("currentUser")).user.uid
      ),
      where("variety", "==", currentPet.value.variety)
    )
  );
  const userPetsSnapshot = await getDocs(userPetsQuery);
  try {
    console.log("userPetsSnapshot", userPetsSnapshot);
    const userPets = userPetsSnapshot.docs.map((doc) => doc.data());
    for (const pet in userPets) {
      if (
        userPets[pet].gender !== "" &&
        userPets[pet].gender !== "none" &&
        userPets[pet].gender !== currentTargetPetGender.value
      ) {
        partnerOptions.value.push({
          id: userPets[pet].id,
          name: userPets[pet].name,
          gender: userPets[pet].gender,
          morph: userPets[pet].morph,
          variety: userPets[pet].variety,
          birthDate: userPets[pet].birthDate,
          weight: userPets[pet].weight,
        });
      }
      console.log(userPets[pet]);
    }
    console.log("partnerOptions", partnerOptions);
    console.log("userPetsRef", userPets);
  } catch (error) {
    console.log("userPetsSnapshot error", error);
  }
});

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

// this is part of our example (so not required)
function onDialogOKClick() {
  console.log("메이팅 스케쥴 등록 시도");
  onDialogOK();
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
