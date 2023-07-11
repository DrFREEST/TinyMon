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
        <q-form>
          <q-input
            v-model="currentEggName"
            label="알 이름"
            placeholder="알 이름"
            require
          ></q-input>
          <q-select
            v-model="selectedVariety"
            :options="varietyOptions"
            :option-label="(item) => item"
            :option-value="(item) => item"
            label="품종"
            placeholder="품종"
          ></q-select>
          <template v-if="selectedVariety === '직접입력'">
            <q-input v-model="currentCustomVariety" label="품종 입력"></q-input>
          </template>
          <q-select
            v-model="currentMother"
            label="모개체 선택"
            placeholder="모개체 선택"
            :options="femalePetList"
            :option-label="(item) => item.name"
            :option-value="(item) => item"
          ></q-select>
          <q-select
            v-model="currentFather"
            label="부개체 선택"
            placeholder="부개체 선택"
            :options="malePetList"
            :option-label="(item) => item.name"
            :option-value="(item) => item"
          ></q-select>
          <q-input
            type="date"
            v-model="currentSpawnDate"
            label="산란일"
            placeholder="산란일"
          ></q-input>
          <q-input
            type="number"
            v-model="currentIncubatorTemp"
            label="인큐베이팅 온도"
            placeholder="인큐베이팅 온도"
          ></q-input>
        </q-form>
      </q-card-section>
      <q-card-actions>
        <q-btn label="취소" @click="onDialogCancelClick"></q-btn>
        <q-btn label="등록" @click="onDialogOKClick"></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
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
  query,
  where,
  orderBy,
  limit,
  and,
  or,
} from "firebase/firestore";
import {
  generateRandomString,
  estimateHatchDate,
} from "src/js/common/tinymonCommon";
import { getStorage } from "firebase/storage";
const props = defineProps({
  dialogTitle: {
    default: "",
    type: String,
  },
  father: {
    default: "",
    type: String,
  },
  id: {
    default: "",
    type: String,
  },
  incubatorTemp: {
    default: "",
    type: String,
  },
  mother: {
    default: "",
    type: String,
  },
  name: {
    default: "",
    type: String,
  },
  owner: {
    default: "",
    type: String,
  },
  spawnDate: {
    default: "",
    type: String,
  },
  variety: {
    default: "",
    type: String,
  },
});

console.log("개체 등록 다이얼로그 props", props);

// 로컬 스토리지에 있는 현재 유저 uid 가져오기
const currentEggId = ref(props.id);
const currentOwner = ref(
  props.owner
    ? props.owner
    : JSON.parse(localStorage.getItem("currentUser")).user.uid
);
const currentEggName = ref(props.name);
const femalePetList = ref([]);
const malePetList = ref([]);
const currentMother = ref(null);
const currentFather = ref(null);
const currentIncubatorTemp = ref(props.incubatorTemp);
const currentSpawnDate = ref(
  new Date(props.spawnDate).toISOString().substr(0, 10)
);
const estimatedHatchDate = ref("");
const currentVariety = ref(props.variety);
const currentCustomVariety = ref("");
const selectedVariety = ref(props.variety);
const varietyOptions = ["크레스티드 게코", "레오파드 게코", "직접입력"];
watch(selectedVariety, (newVal) => {
  console.log("품종 변경", newVal);
  if (newVal === "직접입력") {
    currentCustomVariety.value = "";
  }
});

console.log(
  "===================================================================="
);
console.log("props", props);
console.log(
  "===================================================================="
);

onMounted(async () => {
  const db = appFirestore;
  const petsColllection = collection(db, "pets");
  const femaleQuery = query(
    petsColllection,
    and(
      where(
        "owner",
        "==",
        JSON.parse(localStorage.getItem("currentUser")).user.uid
      ),
      where("gender", "==", "female")
    ),
    orderBy("name")
  );
  const femaleQuerySnapshot = await getDocs(femaleQuery);
  const meleQuery = query(
    petsColllection,
    and(
      where(
        "owner",
        "==",
        JSON.parse(localStorage.getItem("currentUser")).user.uid
      ),
      where("gender", "==", "male")
    ),
    orderBy("name")
  );
  const maleQuerySnapshot = await getDocs(meleQuery);
  femaleQuerySnapshot.forEach((doc) => {
    console.log("femaleQuerySnapshot", doc.id, " => ", doc.data());
    femalePetList.value.push(doc.data());
    if (doc.id === props.mother) {
      currentMother.value = doc.data();
    }
  });
  maleQuerySnapshot.forEach((doc) => {
    console.log("maleQuerySnapshot", doc.id, " => ", doc.data());
    malePetList.value.push(doc.data());
    if (doc.id === props.father) {
      currentFather.value = doc.data();
    }
  });
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
  console.log("개체 등록 시도");
  console.log("등록하려는 개체 정보", {
    id: currentEggId.value,
    owner: currentOwner.value,
    spawnDate: currentSpawnDate.value,
    incubatorTemp: currentIncubatorTemp.value,
    estimatedHatchDate: estimateHatchDate(
      "crested gecko",
      currentSpawnDate.value,
      currentIncubatorTemp.value
    ),
    profile: {
      name: currentEggName.value,
    },
    mother: currentMother.value,
    father: currentFather.value,
    variety:
      selectedVariety.value === "직접입력"
        ? currentCustomVariety.value
        : selectedVariety.value,
  });
  const registDate = new Date();
  onDialogOK({
    id: currentEggId.value,
    owner: currentOwner.value,
    spawnDate: currentSpawnDate.value,
    incubatorTemp: currentIncubatorTemp.value,
    estimatedHatchDate: estimateHatchDate(
      "crested gecko",
      currentSpawnDate.value,
      currentIncubatorTemp.value
    ),
    name: currentEggName.value,
    mother: currentMother.value,
    father: currentFather.value,
    variety:
      selectedVariety.value === "직접입력"
        ? currentCustomVariety.value
        : selectedVariety.value,
  });
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
