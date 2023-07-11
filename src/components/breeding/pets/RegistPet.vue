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
          ></q-input>
          <div class="select-gender">
            성별
            <q-option-group
              v-model="currentGender"
              :options="genderOptions"
              inline
            ></q-option-group>
          </div>
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
        <q-btn
          :label="$props.dialogTitle === '개체 등록' ? '등록' : '저장'"
          @click="onDialogOKClick"
        ></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDialogPluginComponent } from "quasar";
const props = defineProps({
  dialogTitle: {
    default: "",
    type: String,
  },
  gender: {
    default: "",
    type: String,
  },
  hatchedAt: {
    default: "",
    type: String,
  },
  id: {
    default: "",
    type: String,
  },
  morph: {
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
  variety: {
    default: "",
    type: String,
  },
});

console.log("개체 등록 다이얼로그 props", props);

const currentPetId = ref(props.id);
const currentOwner = ref(props.owner);
const currentPetName = ref(props.name);
const currentVariety = ref(props.variety);
const currentCustomVariety = ref("");
const selectedVariety = ref(props.variety);
const currentMorph = ref(props.morph);
const currentGender = ref(props.gender);
const currentHatchDate = ref(props.hatchedAt);

const genderOptions = [
  { label: "암", value: "female" },
  { label: "수", value: "male" },
  { label: "미구분", value: "none" },
];

const varietyOptions = ["크레스티드 게코", "레오파드 게코", "직접입력"];

watch(selectedVariety, (newVal) => {
  console.log("품종 변경", newVal);
  if (newVal === "직접입력") {
    currentCustomVariety.value = "";
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
  console.log("개체 등록 시도", selectedVariety.value.value);
  console.log("등록하려는 개체 정보", {
    gender: currentGender.value,
    hatchedAt: new Date(currentHatchDate.value).getTime(),
    id: currentPetId.value,
    morph: currentMorph.value,
    name: currentPetName.value,
    owner: currentOwner.value,
    variety:
      selectedVariety.value === "직접입력"
        ? currentCustomVariety.value
        : selectedVariety.value,
  });
  onDialogOK({
    gender: currentGender.value,
    hatchedAt: new Date(currentHatchDate.value).getTime(),
    id: currentPetId.value,
    morph: currentMorph.value,
    name: currentPetName.value,
    owner: currentOwner.value,
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
