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
            v-model="cageName"
            placeholder="사육장 이름"
            label="사육장 이름"
            name="cageName"
            required
          ></q-input>
          <q-input
            v-model="cageDescription"
            name="cageInfo"
            placeholder="사육장 설명"
            label="사육장 설명"
          ></q-input>
          <q-input
            type="number"
            label="가로 칸 수"
            placeholder="가로 칸 수"
            v-model="cageSizeX"
            name="cageSizeW"
          >
          </q-input>
          <q-input
            type="number"
            label="세로 칸 수"
            placeholder="세로 칸 수"
            v-model="cageSizeY"
            name="cageSizeH"
          >
          </q-input>
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDialogPluginComponent } from "quasar";

const props = defineProps({
  // ...your custom props
  action: {
    type: String,
    default: "",
  },
  dialogTitle: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  size: {
    width: {
      type: Number,
      default: 1,
    },
    height: {
      type: Number,
      default: 1,
    },
  },
  pets: {
    type: Array,
    default: null,
  },
});
console.log(props);
const cageName = ref(props.name);
const cageDescription = ref(props.description);
const cageSizeX = ref(props.size.width);
const cageSizeY = ref(props.size.height);
const cagePets = ref(props.pets);

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
  console.log("사육장 등록 시도");
  console.log(
    "등록하려는 케이지 정보",
    cageName.value,
    cageDescription.value,
    cageSizeX.value,
    cageSizeY.value
  );
  const registDate = new Date();
  onDialogOK({
    action: props.action,
    id: props.id,
    name: cageName.value,
    description: cageDescription.value,
    size: {
      width: cageSizeX.value,
      height: cageSizeY.value,
    },
    pets: cagePets.value,
  });
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
