<template>
  <div></div>
  <div class="tw-flex tw-flex-col tw-h-max tw-flex-[1_1_auto]">
    <q-toolbar>
      <h2>커뮤니티</h2>
    </q-toolbar>
    <q-tabs v-model="selectedTab" mobile-arrows>
      <q-route-tab
        v-for="board in boards"
        :key="board.id"
        :name="board.id"
        @click="changeTab(board.id)"
        :to="`board/list?boardName=${board.name}`"
      >
        {{ board.name }}
      </q-route-tab>
    </q-tabs>
    <router-view> </router-view>
    <div>
      <h2>{{}}</h2>
      <p>{{}}</p>
    </div>
    <q-btn label="게시판 생성" @click="handleCreateBoard"></q-btn>
    <p class="copyright">© 2023 TinyMon. All rights reserved.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { createBoard, getBoards } from "src/js/board/board";
import { get } from "firebase/database";

const $q = useQuasar();
const router = useRouter();

const selectedTab = ref("news");
const boards = ref(null);

const changeTab = (tab) => {
  selectedTab.value = tab;
  // router.push({ query: { boardId: tab } });
  // loadBoard(tab);
};

onMounted(async () => {
  boards.value = await getBoards();
  console.log("boards.value", boards.value);
  for (const board in boards.value) {
    console.log("board", board);
  }
  console.log("boards", boards.value);

  // 현재 router의 params에 boardId가 있으면 해당 게시판으로 이동
  console.log(
    "router.currentRoute.value.query",
    router.currentRoute.value.query
  );
  if (router.currentRoute.value.query.boardId) {
    selectedTab.value = router.currentRoute.value.query.boardId;
  }
});

const handleCreateBoard = () => {
  $q.dialog({
    title: "게시판 생성",
    message: "생성할 게시판 이름을 입력해주세요.",
    prompt: {
      model: "",
      isValid: (val) => val.length > 0,
    },
    cancel: "취소",
    ok: "생성",
  }).onOk((data) => {
    console.log("data", data);
    createBoard(data);
    $q.notify({
      message: "게시판이 생성되었습니다.",
      color: "positive",
      icon: "check",
    });
  });
};
</script>
