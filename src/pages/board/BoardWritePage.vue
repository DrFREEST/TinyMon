<template>
  <q-page class="tw-flex tw-flex-col tw-px-[1rem]">
    <!-- content -->
    <!-- 게시판 상단 헤더 -->
    <q-toolbar class="tw-px-0">
      <q-btn
        flat
        round
        dense
        icon="fa-solid fa-arrow-left"
        @click="$router.go(-1)"
      />
      <q-toolbar-title>[{{ currentBoardName }}] 글 쓰기</q-toolbar-title>
    </q-toolbar>
    <!-- //게시판 상단 헤더 -->
    <!-- 게시판 작성 영역 -->
    <div class="tw-h-full tw-flex tw-flex-col tw-flex-[1_0_auto]">
      <div class="tw-flex tw-flex-col tw-flex-[1_0_auto]">
        <q-input
          v-model="currentTitle"
          label="제목"
          lazy-rules
          :rules="[(val) => !!val || '제목을 입력해주세요.']"
          class="tw-flex-[0_0_auto]"
        />
        <QuillEditor
          :ref="quill"
          theme="snow"
          toolbar="full"
          contentType="html"
          v-model:content="currentContent"
          class="tw-min-h-[50vw] tw-flex-[1_0_auto]"
          :content="currentContent"
          @text-change="onTextChange"
          @ready="onReady"
        >
        </QuillEditor>
      </div>
      <q-card-section>
        <q-btn
          type="submit"
          label="글 작성"
          @click="createBoardContent"
          class="full-width"
          color="primary"
        />
      </q-card-section>
    </div>
    <!-- //게시판 작성 영역 -->
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query as storeQuery,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  appStorage,
  auth,
  firebaseApp,
  googleProvider,
} from "src/boot/firebase";
import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  getStorage,
  list,
  listAll,
  ref as storageRef,
  updateMetadata,
  uploadBytes,
  uploadBytesResumable,
  uploadString,
} from "firebase/storage";
import {
  createBoard,
  getBoards,
  loadBoardContentList,
  getBoardId,
  createBoardContentToDatabase,
} from "src/js/board/board";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import ImageUploader from "quill-image-uploader";

import {
  generateRandomString,
  uploadMedia,
  uploadMediaBase64,
} from "src/js/common/tinymonCommon";
import { get } from "firebase/database";
import { useQuasar } from "quasar";
const $q = useQuasar();
const router = useRouter();
const query = router.currentRoute.value.query;
const currentBoardName = ref(query.boardName);
const currentTitle = ref("");
const currentContent = ref("");
const createBoardContent = async () => {
  $q.loading.show();
  // const boardContent = {
  //   boardId: getBoardId(currentBoardName.value),
  //   name: currentBoardName.value,
  //   title: currentTitle.value,
  //   content: currentContent.value,
  //   writer: auth.currentUser.uid,
  //   createdAt: new Date().toLocaleString(),
  // };
  // boardContent에서 img 태그를 추출하여 이미지를 업로드하고, 업로드된 이미지의 url을 받아온다.
  const pickImgTags = (content) => {
    const imgTags = content.match(/<img[^>]*src=[\"']?([^>\"']+)[\"']?[^>]*>/g);
    return imgTags;
  };
  const imgTags = pickImgTags(currentContent.value);
  console.log(imgTags);
  // boardContent에 이미지 url을 추가한다.
  const addImgUrlToBoardContent = async (imgTags) => {
    const imgUrls = [];
    // img 태그를 추출하여 이미지를 업로드하고, 업로드된 이미지의 url을 받아온다.
    for (const imgTag of imgTags) {
      // imgTag의 src를 base64로 변환한다.
      const imgBase64 = imgTag.replace(
        /<img[^>]*src=[\"']?([^>\"']+)[\"']?[^>]*>/g,
        "$1"
      );
      const imgUrl = await uploadMediaBase64(
        "boardContents",
        imgBase64,
        await getBoardId(currentBoardName.value)
      );
      imgUrls.push(imgUrl);
    }
    return imgUrls;
  };
  if (imgTags) {
    const imgUrls = await addImgUrlToBoardContent(imgTags);
    // imgTags를 imgUrls로 변환한다.
    const convertImgTagsToImgUrls = async (imgTags, imgUrls) => {
      console.log(imgTags, imgUrls);
      for (let i = 0; i < imgTags.length; i++) {
        const imgTag = imgTags[i];
        const imgUrl = imgUrls[i];
        const newImgTag = imgTag.replace(
          /<img[^>]*src=[\"']?([^>\"']+)[\"']?[^>]*>/g,
          `<img src="${imgUrl}">`
        );
        currentContent.value = currentContent.value.replace(imgTag, newImgTag);
      }
    };
    await convertImgTagsToImgUrls(imgTags, imgUrls);
    // boardContent에 이미지 url을 추가한다.
    console.log(currentContent.value);
  }
  // return false;

  // boardContent를 데이터베이스에 저장한다.
  const boardContent = {
    boardId: getBoardId(currentBoardName.value),
    name: currentBoardName.value,
    title: currentTitle.value,
    content: currentContent.value,
    writer: auth.currentUser.uid,
    createdAt: new Date().toLocaleString(),
  };

  await createBoardContentToDatabase(currentBoardName.value, boardContent);
  console.log(boardContent);
  router.go(-1);
  $q.loading.hide();
};
const quill = ref(null);
const onReady = (target) => {
  console.log("quill ready", target);
  quill.value = target;
};

const getImgUrls = (delta) => {
  // if (!delta) {
  //   return;
  // } else {
  //   console.log("getImgUrls", delta.delta.ops);
  //   delta.delta.ops.forEach((op) => {
  //     if (op.insert && op.insert.image) {
  //       console.log("image", op.insert.image);
  //     }
  //   });
  // }
  return delta.delta.ops
    .filter((i) => i.insert && i.insert.image)
    .map((i) => i.insert.image);
};
const onTextChange = (delta) => {
  console.log("text-change", delta, delta.oldContents, delta.source);
  const diffDelta = quill.value.getContents().diff(delta.oldContents);
  const diffDelta2 = delta.oldContents.diff(quill.value.getContents());
  // console.log(diffDelta, diffDelta2);
  const inserted = getImgUrls(delta);
  if (diffDelta.ops.length < diffDelta2.ops.length) {
    console.log("삭제됨");
    console.log("삭제된 이미지", diffDelta.ops);
  } else {
    console.log("추가됨");
    console.log("추가된 이미지", diffDelta2.ops);
  }
};

const modules = {
  name: "imageUploader",
  module: ImageUploader,
  options: {
    upload: async (file) => {
      const boardId = await getBoardId(currentBoardName.value);
      return new Promise((resolve, reject) => {
        const db = getFirestore(firebaseApp);
        const boardStorageRef = storageRef(
          appStorage,
          `uploadFiles/boardContents/${boardId}`
        );
        const fileName = Date.now() + "_" + generateRandomString(10);
        const fileRef = storageRef(boardStorageRef, fileName);
        const uploadTask = uploadBytes(fileRef, file).then((snapshot) => {
          console.log("Uploaded a blob or file!");
          getDownloadURL(snapshot.ref).then((downloadURL) => {
            console.log("File available at", downloadURL);
            resolve(downloadURL);
          });
        });
      });
    },
    delete: (file) => {
      console.log("delete", file);
    },
  },
};

onMounted(() => {});
watch(currentContent, (newVal, oldVal) => {});
</script>
