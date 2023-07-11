<template>
  <div class="tw-px-[1rem]">
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
      <q-toolbar-title>{{ currentBoardName }}</q-toolbar-title>
    </q-toolbar>
    <!-- //게시판 상단 헤더 -->
    <!-- 게시판 리스트 -->
    <q-list separator>
      <template v-if="boardContentList">
        <q-item v-for="(item, index) in boardContentList" :key="index">
          {{ item }}
        </q-item>
      </template>
      <template v-else>
        <q-item>게시판에 글이 없습니다. <br />새 글을 작성해보세요.</q-item>
      </template>
    </q-list>
    <!-- //게시판 리스트 -->
    <!-- 페이징 -->
    <div class="tw-flex tw-justify-center tw-flex-[0_0_auto] tw-py-[1rem]">
      <q-pagination
        v-model="currentPage"
        color="primary"
        :max="parseInt(totalCount)"
        :max-pages="5"
        boundary-numbers
        boundary-links
        direction-links
        icon-first="skip_previous"
        icon-last="skip_next"
        icon-prev="fast_rewind"
        icon-next="fast_forward"
        @update:model-value="onPageChange"
      />
    </div>
    <!-- //페이징 -->

    <q-page-sticky position="bottom-right" :offset="[20, 20]" class="tw-z-[10]">
      <q-btn
        fab
        icon="fa-solid fa-pen-to-square"
        color="accent"
        :to="`write?boardName=${currentBoardName}`"
      />
    </q-page-sticky>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { auth } from "boot/firebase";
import {
  createBoard,
  getBoards,
  loadBoardContentList,
  getBoardContentListTotalCount,
} from "src/js/board/board";

// 현재 페이지의 query 값 확인
const router = useRouter();
const query = router.currentRoute.value.query;
const currentPagingStartAt = ref(0);
const pagingLimit = ref(10);
const currentPage = ref(1);
const currentPagingEndAt = ref(10);
const currentBoardName = ref(query.boardName);
const boardContentList = ref([]);
const totalCount = ref(0);

const onPageChange = (page) => {
  console.log(page);
  currentPage.value = page;
  currentPagingStartAt.value = (page - 1) * pagingLimit.value;
  currentPagingEndAt.value = page * pagingLimit.value;
  loadBoardContentList(
    query.boardName,
    currentPagingStartAt.value,
    pagingLimit.value,
    "createdAt",
    "desc"
  ).then((res) => {
    // console.log(res);
    boardContentList.value = res;
    console.log(boardContentList.value);
  });
};

console.log(query);
onMounted(async () => {
  // 현재 페이지의 query 값 확인
  console.log(query.boardName);
  totalCount.value = Math.ceil(
    (await getBoardContentListTotalCount(query.boardName)) / pagingLimit.value
  );
  console.log("totalCount.value : ", totalCount.value);
  // loadBoardContentList : 게시판의 게시글 목록을 가져온다.
  // query.boardName : 게시판 이름
  // 0 : 시작 번호
  // 20 : 호출할 길이
  // 정렬 기준 : createdAt(생성일), updatedAt(수정일), viewCount(조회수), likeCount(좋아요수), commentCount(댓글수)
  // 정렬 방식 : asc(오름차순), desc(내림차순)
  loadBoardContentList(
    query.boardName,
    currentPage.value,
    pagingLimit.value,
    "createdAt",
    "desc"
  ).then((res) => {
    console.log(res);
    // res 값들을 기존 boardContentList에 넣는다.
    boardContentList.value = res;
    console.log(boardContentList.value);
  });
});
</script>
