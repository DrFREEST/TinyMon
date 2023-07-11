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
        <p v-if="currentPet.gender">성별: {{ currentPet.gender }}</p>
        <p v-if="currentPet.morph">모프: {{ currentPet.morph }}</p>
      </q-card-section>
      <!-- 앨범 목록 영역 -->
      <q-card-section>
        <q-btn
          label="미디어 등록하기"
          color="primary"
          :icon="'fa-solid fa-plus'"
          @click="openPetMediaUploadDialog(currentPet)"
        ></q-btn>
        <!-- {{ petData.medias }} -->
        <template v-if="targetData">
          <div class="list tw-grid tw-grid-cols-1 tw-gap-y-[1rem]">
            <template v-for="(media, index) in targetData.medias" :key="index">
              <q-card class="list-item">
                <q-card-section class="tw-flex tw-items-center">
                  {{
                    new Date(media.createdAt).toLocaleDateString() +
                    " " +
                    new Date(media.createdAt).toLocaleTimeString([], {
                      hour12: true,
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}
                  <q-btn
                    class="tw-ml-auto"
                    :icon="'fa-solid fa-trash'"
                    @click="
                      openMediaDeleteDialog(
                        'pets',
                        media.mediaId,
                        currentPet.id
                      )
                    "
                    size="sm"
                  ></q-btn>
                </q-card-section>
                <template v-if="media.description">
                  <q-card-section dense>
                    {{ media.description }}
                  </q-card-section>
                </template>
                <q-separator></q-separator>
                <q-card-section class="tw-p-[0.5rem]">
                  <q-list
                    class="tw-grid tw-grid-cols-3 tw-gap-[0.5rem] tw-auto-rows-max tw-row-auto"
                  >
                    <template
                      v-for="(file, fileIndex) in media.files"
                      :key="fileIndex"
                    >
                      <q-item
                        class="tw-p-0 tw-block tw-h-auto tw-shadow-md"
                        ratio="1"
                      >
                        <template v-if="file.fileType.indexOf('video') === -1">
                          <q-img
                            class="tw-w-full"
                            :src="
                              file.thumbnailUrl
                                ? file.thumbnailUrl[0]
                                : file.downloadUrl
                            "
                            :initial-ratio="1"
                            fit="contain"
                            loading="lazy"
                            :class="index === indexZoomed ? 'zoomed' : void 0"
                            :ref="
                              (el) => {
                                thumbRef[(index, fileIndex)] = el;
                              }
                            "
                            @click="
                              zoomMediaModal(media.files, index, fileIndex)
                            "
                          >
                          </q-img>
                        </template>
                        <template v-else>
                          <video
                            preload="metadata"
                            class="tw-w-full tw-aspect-[1] tw-object-cover"
                            :src="file.downloadUrl + '#t=0.5'"
                            :type="file.fileType"
                            ratio="1"
                            loading="lazy"
                            :class="index === indexZoomed ? 'zoomed' : void 0"
                            :ref="
                              (el) => {
                                thumbRef[(index, fileIndex)] = el;
                              }
                            "
                            no-controls
                            @click="
                              zoomMediaModal(media.files, index, fileIndex)
                            "
                          ></video>
                        </template>
                        <!-- {{file.thumbnailUrl?file.thumbnailUrl[0]:file.downloadUrl}} -->
                      </q-item>
                    </template>
                  </q-list>
                </q-card-section>
              </q-card>
            </template>
          </div>
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
  id: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  gender: {
    type: String,
    default: "",
  },
  morph: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "",
  },
  variety: {
    type: String,
    default: "",
  },
  familyTree: {
    type: Object,
    default: () => {},
  },
});

const db = appFirestore;
const targetData = useDocument(query(doc(db, `${props.type}/${props.id}`)));
console.log("targetData", targetData);

const currentTargetPetId = ref(props.id);
const currentTargetPetName = ref(props.name);
const currentTargetPetGender = ref(props.gender);
const currentTargetPetMorph = ref(props.morph);
const currentTargetPetVariety = ref(props.variety);
const currentTargetPetFamilyTree = ref(props.familyTree);

const currentPet = ref({});
currentPet.value = {
  id: currentTargetPetId.value,
  name: currentTargetPetName.value,
  gender: currentTargetPetGender.value,
  morph: currentTargetPetMorph.value,
  variety: currentTargetPetVariety.value,
  familyTree: currentTargetPetFamilyTree.value,
};

const selFiles = ref(null);
const imageUrls = ref([]);

const openPetMediaUploadDialog = (currentPet) => {
  $q.dialog({
    component: MediaUpload,
    componentProps: {
      dialogTitle: "미디어 등록",
      currentPet: currentPet,
    },
    parent: this,
  }).onOk(async (data) => {
    console.log("onOk", data);
    await uploadMedia(
      props.type,
      data.description,
      data.selFiles,
      data.currentPet.id
    );
  });
};

// openMediaDeleteDialog 팝업 메시지 "미디어를 삭제하시겠습니까?"를 띄우고 확인 버튼을 누르면 실행되는 함수
const openMediaDeleteDialog = (mediaType, mediaId, petId) => {
  $q.dialog({
    title: "미디어 삭제",
    message: "미디어를 삭제하시겠습니까?",
    cancel: "취소",
    ok: "삭제",
    parent: this,
  }).onOk(async (data) => {
    console.log("onOk", data);
    await deleteMedia(mediaType, mediaId, petId);
  });
};

const thumbRef = ref([]);
const indexZoomed = ref((void 0, void 0));
const zoomMediaModal = (target, index, fileIndex) => {
  console.log("zoomMediaModal", target, index, fileIndex);
  $q.dialog({
    component: MediaZoomDialog,
    componentProps: {
      index: index,
      fileIndex: fileIndex,
      files: target,
    },
    parent: this,
  }).onOk(async (data) => {
    console.log("onOk", data);
  });
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
  onDialogOK();
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
