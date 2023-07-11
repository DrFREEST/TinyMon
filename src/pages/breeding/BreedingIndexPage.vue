<template>
  <div class="tw-flex-[1_1_auto] tw-flex tw-flex-col tw-overflow-y-auto">
    <q-tabs
      active-color="white"
      active-bg-color="primary"
      indicator-color="accent"
      active-class="tab-active"
      mobile-arrows
      outside-arrows
      align="justify"
      stretch
      left-icon="fas fa-arrow-left"
      right-icon="fas fa-arrow-right"
      content-class="tabs"
      :v-model="activeTab"
      dense
      class="tw-flex-[0_0_auto] tw-shadow-lg"
    >
      <q-route-tab
        class="tab"
        to="/breeding/cages"
        label="사육장 관리"
        name="cages"
        exact
      ></q-route-tab>
      <q-route-tab
        class="tab"
        to="/breeding/pets"
        label="개체 관리"
        name="pets"
      ></q-route-tab>
      <q-route-tab
        class="tab"
        to="/breeding/eggs"
        label="알 관리"
        name="eggs"
      ></q-route-tab>
    </q-tabs>
    <router-view
      class="tab-content tw-w-full tw-flex-[1_1_auto] tw-flex tw-overflow-y-auto"
    ></router-view>
  </div>
</template>

<script setup="">
import { ref, reactive, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

const activeTab = ref("cages");
onMounted(() => {
  if (router.currentRoute.value.path === "/breeding") {
    console.log("breeding");
    activeTab.value = "cages";
    router.push({ name: "cages" });
  }
  console.log("activeTab", activeTab.value, router.currentRoute.value);
});
watch(
  activeTab,
  () => router.currentRoute.value.name,
  (name) => {
    activeTab.value = name;
    console.log("activeTab", activeTab.value, router.currentRoute.value);
  }
);
</script>
