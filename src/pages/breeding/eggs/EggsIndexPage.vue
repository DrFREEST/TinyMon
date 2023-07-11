<template>
  <div>
    <div
      class="pet-list tw-w-full tw-flex tw-flex-col tw-overflow-y-auto tw-pb-[4rem]"
    >
      <!-- list top Start -->
      <div class="list-top tw-flex-[0_0_auto] tw-px-[1.5rem] tw-py-[1rem]">
        <div class="list-count">
          총 {{ eggList.length }}개의 알이 등록되어있습니다.
        </div>
      </div>
      <!-- //list top End -->
      <!-- list body -->
      <template v-if="!eggList.length > 0">
        <div
          class="no-result tw-flex tw-max-w-[100%] tw-flex-[1_1_auto] tw-items-center tw-justify-center tw-text-center tw-fle tw-w-full tw-h-full"
        >
          등록된 알이 없습니다.<br />
          알을 등록해보세요.
        </div>
      </template>
      <template v-else>
        <q-pull-to-refresh
          @refresh="listRefresh"
          no-mouse
          scroll-target=".pet-list"
        >
          <q-list
            class="tw-flex-[1_1_auto] tw-overflow-y-auto tw-grid tw-grid-cols-2 tw-gap-4 tw-px-[1.5rem] tw-auto-rows-max sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-6 xl:tw-grid-cols-7 2xl:tw-grid-cols-8 3xl:tw-grid-cols-10 4xl:tw-grid-cols-12 5xl:tw-grid-cols-[repeat(14,_minmax(0,_1fr))] 6xl:tw-grid-cols-[repeat(16,_minmax(0,_1fr))] 7xl:tw-grid-cols-[repeat(18,_minmax(0,_1fr))]"
          >
            <q-item
              v-for="(item, index) in eggList"
              :key="index"
              transition="jump-up"
              class="tw-my-[1rem] tw-p-0 tw-text-[0.75rem]"
              transition-show="slide-right"
            >
              <q-card
                class="tw-relative shadow-6 tw-p-0 tw-w-full tw-rounded-[0.5rem]"
              >
                <q-card-section class="">
                  <div
                    class="egg-img tw-rounded-t-[80%] tw-rounded-b-[75%] tw-overflow-hidden tw-ring-2 tw-ring-[green] tw-ring-offset-2 tw-aspect-[1/1.3] tw-w-[66.667%] tw-mx-auto"
                  >
                    <template
                      v-if="getImgThumbnail(item)[1].indexOf('image') !== -1"
                    >
                      <q-img
                        :src="getImgThumbnail(item)[0]"
                        class="tw-object-center tw-object-cover tw-aspect-[1/1.3]"
                        @click="openEggAlbumDialog('eggs', item)"
                      ></q-img>
                    </template>
                    <template v-else>
                      <video
                        :src="getImgThumbnail(item)[0]"
                        no-controls
                        class="tw-object-cover tw-aspect-[1] tw-flex-[0_0_auto] tw-w-[4.375rem] tw-h-[4.375rem]"
                        @click="openEggAlbumDialog('eggs', item)"
                      ></video>
                    </template>
                  </div>
                </q-card-section>
                <q-card-section class="tw-flex tw-items-start tw-gap-3 tw-py-0">
                  <!-- {{ item.estimatedHatchDate }} -->
                  <div class="egg-info">
                    <!-- 부화일 임박 플래그 -->
                    <div class="flags">
                      <q-icon
                        title="부화 임박"
                        color="primary"
                        name="fa-solid fa-cake-candles"
                        class="!tw-text-[1rem]"
                        v-if="estimateSoonHatchDate(item.estimatedHatchDate)"
                      ></q-icon>
                    </div>
                    <!-- //부화일 임박 플래그 -->
                    <!-- {{ item }} -->
                    <div class="egg-name">{{ item.name }}</div>
                    <template v-if="item.temperature">
                      <div class="egg-birth">
                        인큐베이팅 온도 : {{ item.temperature }}
                      </div>
                    </template>
                    <template v-if="item.birthDate">
                      <div class="egg-birth">
                        부화 예정일 : {{ item.birthDate }}
                      </div>
                    </template>
                  </div>
                </q-card-section>
                <q-card-actions
                  class="tw-grid tw-grid-cols-2 tw-gap-2 tw-grid-flow-auto tw-text-[0.75rem]"
                >
                  <q-btn
                    size="sm"
                    class="!tw-mx-0 !tw-px-0 tw-col-span-full"
                    color="primary"
                    title="정보 수정"
                    label="정보 수정"
                    dense
                    @click="openDialog('update', item)"
                  ></q-btn>
                  <!-- <q-btn
                    size="sm"
                    class="!tw-mx-0 !tw-px-0"
                    color="primary"
                    title="앨범 관리"
                    label="앨범 관리"
                    dense
                    @click="openEggAlbumDialog('eggs', item)"
                  ></q-btn> -->
                  <q-btn
                    size="sm"
                    class="!tw-mx-0 !tw-px-0 tw-col-span-full"
                    color="primary"
                    title="부화 등록"
                    label="부화 등록"
                    dense
                    @click="handleHatchEgg(item)"
                  ></q-btn>
                  <q-btn
                    class="!tw-mx-0 !tw-px-0 tw-col-span-full"
                    color="warning"
                    title="알 삭제"
                    label="알 삭제"
                    icon="fa-solid fa-trash-can !tw-text-[0.75rem] tw-mr-[0.25rem]"
                    size="sm"
                    @click="handelDeleteEgg(item.id)"
                  ></q-btn>
                </q-card-actions>
              </q-card>
            </q-item>
          </q-list>
        </q-pull-to-refresh>
      </template>
      <!-- //list body -->
      <q-page-sticky
        position="bottom-right"
        class="tw-right-[1.5rem] tw-bottom-[1.5rem] tw-z-10"
      >
        <q-btn
          color="negative"
          label="알 등록"
          :icon="'fa-solid fa-plus'"
          @click="openDialog('insert')"
        ></q-btn>
      </q-page-sticky>
    </div>
    <!-- 팝업 영역 -->
    <div class="dialog-area"></div>
    <!-- //팝업 영역 -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeMount, computed } from "vue";
import { useDatabaseList, useDocument, useCollection } from "vuefire";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

import { auth, appFirestore } from "src/boot/firebase";
import { collection, query, where } from "firebase/firestore";

import { registPetsEvent } from "src/js/breed/pets.js";
import {
  registEggInfoToDatabase,
  registEggInfoToDatabaseManual,
  updateEggInfoToDatabase,
  getUserEggList,
  deleteEggInfoFromDatabase,
} from "src/js/breed/eggs";
import {
  estimateSoonHatchDate,
  estimateHatchDate,
  getImgThumbnail,
} from "src/js/common/tinymonCommon";

import EggRegistDialog from "src/components/breeding/eggs/RegistEgg.vue";
import EggHatchDialog from "src/components/breeding/eggs/HatchEgg.vue";
import EggAlbumDialog from "src/components/breeding/pets/PetAlbum.vue";

const $q = useQuasar();
const router = useRouter();

const db = appFirestore;
const eggList = useCollection(
  query(collection(db, "eggs"), where("owner", "==", auth.currentUser.uid))
);

onMounted(() => {
  // loadUserEggList();
});
watch(eggList, (newVal, oldVal) => {
  console.log("eggList newVal", newVal);
  console.log("eggList oldVal", oldVal);
});
const loadUserEggList = async () => {
  const eggListData = await getUserEggList();
  console.log("eggListData", eggListData.value);
  try {
    eggList.value = eggListData.value;
    console.log("eggList.value", eggList.value);
    // console.log("petList", petListData);
  } catch (error) {
    console.log("error", error);
  }
};

const listRefresh = async (done) => {
  setTimeout(() => {
    loadUserEggList();
    done();
  }, 1000);
};

const handleHatchEgg = (item) => {
  $q.dialog({
    component: EggHatchDialog,
    componentProps: {
      dialogTitle: "부화 등록",
      item: item,
    },
    parent: this,
  }).onOk(async (data) => {
    console.log(data);
    item.name = data.name;
    item.hatchDate = data.hatchDate;
    item.morph = data.morph ? data.morph : "";
    console.log("updated item", item);
    await registPetsEvent("born", item).then((res) => {
      console.log("res", res);
      if (res) {
        loadUserEggList();
        $q.notify({
          color: "positive",
          message: "알이 부화 등록되었습니다.",
          position: "top",
          timeout: 1000,
        });
      }
    });
  });
  // registPetsEvent("");
};

const handelDeleteEgg = (id) => {
  console.log("handelDeletePet id", id);
  $q.dialog({
    title: "알 삭제",
    message: "알을 삭제하시겠습니까?",
    cancel: "취소",
    ok: "삭제",
  })
    .onOk(async () => {
      await deleteEggInfoFromDatabase(id).then((res) => {
        console.log("res", res);
        if (res) {
          loadUserEggList();
          $q.notify({
            color: "positive",
            message: "알이 삭제되었습니다.",
            position: "top",
            timeout: 1000,
          });
        }
      });
      // getPetListFromDatabase();
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 팝업 오픈(알 등록, 알 수정)
// action : insert, update
// target : default null
const openDialog = (action, target) => {
  console.log("target", target);
  $q.dialog({
    component: EggRegistDialog,
    componentProps: {
      dialogTitle: action === "insert" ? "알 등록" : "알 수정",
      id: target ? target.id : null,
      owner: target ? target.owner : null,
      name: target ? target.name : null,
      mother: target ? target.familyTree.mother : null,
      father: target ? target.familyTree.father : null,
      spawnDate: target ? target.spawnDate : null,
      incubatorTemp: target ? target.incubatorTemp : null,
      variety: target ? target.variety : null,
    },
    parent: this,
  })
    .onOk((value) => {
      if (action === "insert") {
        console.log("registPetInfoToDatabase", value);
        registEggInfoToDatabaseManual(value).then(() => {
          console.log("OK", value);
          registPetsEvent("spawn", value).then(() => {
            $q.notify({
              color: "positive",
              message: "산란 정보가 등록되었습니다.",
              position: "top",
              timeout: 1000,
            });
          });
          // loadUserEggList();
        });
      } else if (action === "update") {
        console.log("updateEggInfoToDatabase", value);
        updateEggInfoToDatabase(value).then(() => {
          // getPetListFromDatabase();
          console.log("OK", value);
          // loadUserEggList();
        });
      }
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};

// 팝업 오픈(앨범 관리)
const openEggAlbumDialog = (type, target) => {
  console.log("openPetAlbumDialog target", target);
  $q.dialog({
    component: EggAlbumDialog,
    componentProps: {
      dialogTitle: "앨범 관리",
      gender: target ? target.gender : null,
      id: target ? target.id : null,
      morph: target ? target.morph : null,
      name: target ? target.name : null,
      type: type,
      variety: target ? target.variety : null,
    },
  });
};
</script>
