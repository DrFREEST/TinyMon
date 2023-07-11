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
            v-model="currentPetName"
            label="개체 이름"
            placeholder="개체 이름"
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
          <q-input
            v-model="currentMorph"
            label="모프"
            placeholder="모프"
            require
          ></q-input>
          <q-input
            type="date"
            v-model="currentHatchDate"
            label="부화일"
            placeholder="부화일"
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
const props = defineProps({
  dialogTitle: {
    type: String,
    default: "",
  },
  item: {
    type: Object,
    default: () => ({}),
  },
});

console.log("개체 등록 다이얼로그 props", props);

const currentItem = ref(props.item);

const currentHatchDate = ref(new Date().toISOString().substr(0, 10));

const currentPetName = ref(props.item.name);
const currentMorph = ref(props.item.morph);
const currentVariety = ref(props.item.variety);
const currentCustomVariety = ref("");
const selectedVariety = ref(props.item.variety);
const varietyOptions = ["크레스티드 게코", "레오파드 게코", "직접입력"];
watch(selectedVariety, (newVal) => {
  console.log("품종 변경", newVal);
  if (newVal === "직접입력") {
    currentCustomVariety.value = "";
  }
});

console.log("=======================================================");
console.log("props.item", props.item);
console.log("=======================================================");

console.log("currentItem", currentItem);

onMounted(async () => {});

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
    hatchDate: new Date(currentHatchDate.value).getTime(),
    id: props.item.id,
    incubatorTemp: props.item.incubatorTemp,
    morph: currentMorph.value,
    name: currentPetName.value,
    owner: props.item.owner,
  });
  const registDate = new Date();
  onDialogOK({
    hatchDate: new Date(currentHatchDate.value).getTime(),
    id: props.item.id,
    incubatorTemp: props.item.incubatorTemp,
    morph: currentMorph.value,
    name: currentPetName.value,
    owner: props.item.owner,
  });
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
