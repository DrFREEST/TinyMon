<template>
  <q-layout
    view="lHh Lpr lFf"
    class="tw-flex tw-flex-col tw-max-h-[100vh]"
    :class="{ sub: currentLayout !== 'main', main: currentLayout === 'main' }"
  >
    <q-header class="tw-sticky tw-t-0" elevated>
      <q-toolbar
        class="tw-grid tw-grid-cols-12 tw-items-center tw-gap-x-[1rem] tw-px-0"
      >
        <q-btn-group flat class="tw-col-span-3 tw-flex" v-if="currentDepth > 3">
          <q-btn
            title="뒤로가기"
            :icon="'arrow_back_ios_new'"
            class="tw-p-0 tw-w-[3rem] tw-h-[3rem]"
            @click="$router.go(-1)"
          ></q-btn>
        </q-btn-group>
        <q-toolbar-title
          class="tw-inline-flex"
          :class="{
            'tw-col-span-full': currentDepth <= 3,
            'tw-col-span-6': currentDepth > 3,
          }"
        >
          <q-img
            src="images/SVG/logo-header.svg"
            class="tw-h-[2rem] tw-inline-flex"
            :position="
              currentLayout === 'main' && currentLayout === 'auth'
                ? 'center'
                : 'center'
            "
            fit="contain"
          ></q-img>
        </q-toolbar-title>
        <q-btn-group class="tw-col-span-3" v-if="currentDepth > 3">
        </q-btn-group>
      </q-toolbar>
    </q-header>

    <q-page-container
      class="tw-flex tw-flex-col !tw-p-0 tw-flex-[1_1_auto] tw-overflow-y-auto tw-h-full"
    >
      <router-view />
    </q-page-container>

    <q-footer class="tw-sticky tw-b-0 tw-bg-white tw-hidden" elevated>
      <q-tabs
        switch-indicator
        class="tw-grid tw-grid-flow-col tw-gap-0 tw-w-full tw-max-w-[40rem] tw-h-[3rem] tw-mx-auto"
        dense
        mobile-arrows
        stretch
        indicator-color="negative"
        active-color="white"
        active-bg-color="secondary"
        active-class="tw-shadow-[0_0_0.625rem_0_rgba(0,0,0,0.25)]"
      >
        <q-route-tab
          :icon="'fa-solid fa-hand-holding-heart'"
          title="사육"
          to="/breeding"
          name="breeding"
        ></q-route-tab>
        <!-- <q-route-tab
          :icon="'fa-solid fa-arrow-right-arrow-left'"
          title="입양/분양"
          to="/adopt"
          ripple="true"
        ></q-route-tab> -->
        <q-route-tab
          :icon="'fa-regular fa-newspaper'"
          title="커뮤니티"
          to="/board"
          name="board"
        ></q-route-tab>
        <!-- <q-route-tab
          :icon="'fa-regular fa-comment-dots'"
          title="채팅"
          to="/chat"
          ripple="true"
        ></q-route-tab> -->
        <q-route-tab
          :icon="'fa-regular fa-user'"
          title="마이페이지"
          to="/mypage"
          name="mypage"
        ></q-route-tab>
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { auth, firebaseApp } from "boot/firebase";
import { getAnalytics, logEvent, setUserId } from "firebase/analytics";
const router = useRouter();

const analytics = getAnalytics(firebaseApp);
if (auth.currentUser) {
  setUserId(analytics, auth.currentUser.uid);
}

const currentLayout = ref("main");
const currentDepth = ref(0);

const checkPageDepth = (path) => {
  const depth = path.split("/").length;
  console.log("depth", depth);
  currentDepth.value = depth;
  return depth;
};
const checkLayoutType = (path) => {
  const type = path.split("/")[1];
  console.log("type", type);
  currentLayout.value = type;
  return type;
};

// 페이지 로드 이벤트 로깅
const logPageLoadEvent = () => {
  logEvent(analytics, "page_load", {
    page: router.currentRoute.value.path,
  });
};

// 페이지 클릭 이벤트 로깅
const logPageClickEvent = (page) => {
  logEvent(analytics, "page_click", {
    page: page,
  });
};

// 페이지 객체 클릭 이벤트 로깅
const logPageObjectClickEvent = (page, object) => {
  logEvent(analytics, "page_object_click", {
    page: page,
    object: object,
  });
};

// 페이지 화면 클래스 변경 이벤트 로깅
const logPageClassChangeEvent = (page, pageClass) => {
  logEvent(analytics, "page_class_change", {
    page: page,
    class: pageClass,
  });
};

// 페이지 이동 이벤트 로깅
const logPageNavigationEvent = (to, from) => {
  logEvent(analytics, "page_navigation", {
    from: from.path,
    to: to.path,
  });
};

onMounted(() => {
  checkPageDepth(router.currentRoute.value.path);
  checkLayoutType(router.currentRoute.value.path);
  logPageLoadEvent();
  logPageClickEvent(router.currentRoute.value.path);
  logPageClassChangeEvent(router.currentRoute.value.path, currentLayout.value);
  router.beforeEach(logPageNavigationEvent);
});
watch(router.currentRoute, (to, from) => {
  checkPageDepth(to.path);
  checkLayoutType(to.path);
});
checkLayoutType(router.currentRoute.value.path);
</script>
