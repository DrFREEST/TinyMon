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
      <!-- 선택된 대표 사진 영역 -->
      <q-card-section>
        <q-img ratio="1" :src="selectedImgUrl"></q-img>
      </q-card-section>
      <!-- //선택된 대표 사진 영역 -->
      <!-- 앨범 목록 영역 -->
      <q-card-section>
        <template v-if="targetData">
          <div
            class="list tw-grid tw-grid-cols-3 sm:tw-grid-cols-5 md:tw-grid-cols-7 tw-gap-[0.5rem]"
          >
            <template v-for="(media, index) in targetData.medias" :key="index">
              <template
                v-for="(file, fileIndex) in media.files"
                :key="fileIndex"
              >
                <div
                  v-if="file.fileType.indexOf('image') !== -1"
                  @click="handleSelImage(file)"
                >
                  <q-img
                    :src="
                      file.thumbnailUrl
                        ? file.thumbnailUrl[2]
                        : file.downloadUrl
                    "
                    ratio="1"
                    draggable
                  ></q-img>
                </div>
              </template>
            </template>
          </div>
        </template>
        <template v-else>
          <div>
            현재 앨범에 등록된 이미지가 없습니다.<br />앨범에 이미지를
            등록해보세요.
          </div>
          <q-btn label="앨범 관리" color="primary" class="tw-w-full"></q-btn>
        </template>
      </q-card-section>
      <!-- //앨범 목록 영역 -->

      <q-card-actions>
        <q-btn label="취소" @click="onDialogCancelClick"></q-btn>
        <q-btn label="확인" @click="onDialogOKClick"></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDialogPluginComponent, useQuasar, morph as morphDOM } from "quasar";
import { useCollection, useDocument, useDatabaseObject } from "vuefire";
import { auth, appFirestore, appStorage } from "src/boot/firebase";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  getDoc,
} from "firebase/firestore";

import {
  generateRandomString,
  uploadMedia,
  deleteMedia,
} from "src/js/common/tinymonCommon";
import { registPetsEvent } from "src/js/breed/pets";
import MediaUpload from "src/components/common/MediaUpload.vue";
import MediaZoomDialog from "src/components/common/MediaZoomDialog.vue";

const $q = useQuasar();
const props = defineProps({
  dialogTitle: {
    type: String,
    default: "",
  },
  item: {
    type: Object,
    default: () => {},
  },
});

const selectedImgUrl = ref("");
const db = appFirestore;
const targetData = useDocument(query(doc(db, `pets/${props.item.id}`)));
onMounted(async () => {
  if (targetData) {
    setTimeout(() => {
      selectedImgUrl.value = targetData.value.medias[0].files[0].downloadUrl;
    }, 10);
    // console.log("targetData", targetData.value.medias[0].files[0].downloadUrl);
    // selectedImgUrl.value = targetData.value.medias
    //   ? targetData.value.medias[0].files[0].downloadUrl
    //   : "";
  }
});

const currentItem = ref(props.item);

const currentPet = ref({});

const selFiles = ref(null);
const imageUrls = ref([]);

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
  onDialogOK();
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
