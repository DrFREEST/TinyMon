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
        <q-input v-model="description" label="미디어 설명"></q-input>
      </q-card-section>
      <q-card-section>
        <div class="file-uploader">
          <label>
            <q-chip label="미디어 파일 선택" clickable></q-chip>
            <q-file
              for="fileUpload"
              label="미디어 파일"
              class="tw-hidden"
              :v-model="selFiles"
              multiple
              accept="image/*,video/*"
              max-total-size="107374182"
              max-files="30"
              loading
              clearable
              @update:model-value="updateContainedFiles"
            />
          </label>
        </div>
      </q-card-section>
      <!-- 업로드 예정 파일 목록 -->
      <q-card-section>
        <template v-if="selFiles.length > 0">
          <q-list class="tw-grid tw-grid-cols-3 tw-gap-[0.5rem]">
            <temaplate v-for="(file, index) in selFiles" :key="index">
              <q-item class="tw-p-0">
                <q-card class="tw-w-full">
                  <q-card-section class="tw-p-0">
                    <q-img :src="file.url" ratio="1"></q-img>
                  </q-card-section>
                  <q-btn
                    class="tw-absolute tw-top-[0] tw-right-[0] tw-p-[0.25rem] tw-rounded-[0.5rem]"
                    title="삭제"
                    icon="fa-solid fa-close"
                    color="negative"
                    @click="removeFile(index)"
                    rounded
                    size="sm"
                  ></q-btn>
                </q-card>
              </q-item>
            </temaplate>
          </q-list>
        </template>
      </q-card-section>
      <!-- //업로드 예정 파일 목록 -->

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
  and,
  or,
} from "firebase/firestore";

import { generateRandomString } from "src/js/common/tinymonCommon";
import { registPetsEvent, uploadPetPhoto } from "src/js/breed/pets";

const props = defineProps({
  dialogTitle: {
    type: String,
    default: "",
  },
  currentPet: {
    type: Object,
    default: () => {},
  },
});

const description = ref("");
const selFiles = ref([]);
const createMediaBlob = (file) => {
  const blob = new Blob([file], { type: file.type });
};
const updateContainedFiles = (files) => {
  console.log("updateContainedFiles", files);
  selFiles.value = files;
  files.forEach((file) => {
    createMediaBlob(file);
    file.url = URL.createObjectURL(file);
  });
  console.log("selFiles", selFiles.value);
};
const removeFile = (index) => {
  selFiles.value.splice(index, 1);
};

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
  onDialogOK({
    currentPet: props.currentPet,
    description: description,
    selFiles: selFiles.value,
  });
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
