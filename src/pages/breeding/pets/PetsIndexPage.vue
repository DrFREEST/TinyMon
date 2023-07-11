<template>
  <div>
    <div
      class="scroll pet-list tw-w-full tw-flex tw-flex-col tw-overflow-y-auto tw-pb-[4rem]"
    >
      <!-- list top Start -->
      <div class="list-top tw-flex-[0_0_auto] tw-px-[1.5rem] tw-py-[1rem]">
        <div class="list-count">
          총 {{ petList.length }}마리의 개체가 등록되어있습니다 .
        </div>
      </div>
      <!-- //list top End -->
      <!-- list body -->
      <template v-if="!petList.length > 0">
        <div
          class="no-result tw-flex tw-max-w-[100%] tw-flex-[1_1_auto] tw-items-center tw-justify-center tw-text-center tw-fle tw-w-full tw-h-full"
        >
          등록된 개체가 없습니다.<br />
          개체를 등록해보세요.
        </div>
      </template>
      <template v-else>
        <q-pull-to-refresh
          @refresh="listRefresh"
          no-mouse
          scroll-target=".pet-list"
        >
          <q-list
            class="tw-flex-[1_1_auto] tw-overflow-y-auto tw-grid tw-grid-cols-1 tw-py-[1rem] tw-px-[1.5rem] tw-auto-rows-max tw-grid sm:tw-grid-cols-2 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5 3xl:tw-grid-cols-6 4xl:tw-grid-cols-7 5xl:tw-grid-cols-8 6xl:tw-grid-cols-9 7xl:tw-grid-cols-10 tw-gap-4"
          >
            <q-item
              transition-show="slide-right"
              class="tw-p-0"
              v-for="(item, index) in petList"
              :key="index"
              transition="jump-up"
            >
              <q-card
                class="tw-relative shadow-6 tw-p-0 tw-w-full tw-rounded-[0.5rem] tw-text-[0.75rem]"
              >
                <q-card-section class="tw-flex tw-items-start tw-gap-3 tw-pb-0">
                  <div
                    class="pet-img tw-flex-[0_0_4.375rem] tw-rounded-md tw-overflow-hidden tw-ring-2 tw-ring-primary tw-ring-offset-2"
                  >
                    <template
                      v-if="getImgThumbnail(item)[1].indexOf('image') !== -1"
                    >
                      <q-img
                        :src="getImgThumbnail(item)[0]"
                        :ratio="1"
                        class="tw-object-cover"
                        @click="openPetAlbumDialog('pets', item)"
                      ></q-img>
                    </template>
                    <template v-else>
                      <video
                        :src="getImgThumbnail(item)[0]"
                        no-controls
                        class="tw-object-cover tw-aspect-[1] tw-flex-[0_0_auto] tw-w-[4.375rem] tw-h-[4.375rem]"
                        @click="openPetAlbumDialog('pets', item)"
                      ></video>
                    </template>
                  </div>
                  <div class="pet-info">
                    <!-- 산란일 임박, 메이팅 임박 플래그 -->
                    <div
                      class="flags"
                      v-if="
                        estimateSoonMatingDate(item.lastSpawnDate) ||
                        estimateSoonSpawnDate(item.lastSpawnDate)
                      "
                    >
                      <q-icon
                        v-if="estimateSoonSpawnDate(item.lastSpawnDate)"
                        title="산란 임박"
                        color="primary"
                        name="fa-solid fa-egg"
                        class="!tw-text-[1rem]"
                      ></q-icon>
                      <q-icon
                        v-if="estimateSoonMatingDate(item.lastSpawnDate)"
                        title="메이팅 임박"
                        color="accent"
                        name="fa-solid fa-heart"
                        class="!tw-text-[1rem]"
                      ></q-icon>
                      <q-icon
                        :title="
                          item.gender === 'female'
                            ? '암'
                            : item.gender === 'male'
                            ? '수'
                            : '미구분'
                        "
                        :name="
                          item.gender === 'female'
                            ? 'fa-solid fa-venus'
                            : item.gender === 'male'
                            ? 'fa-solid fa-mars'
                            : 'fa-solid fa-neuter'
                        "
                        :color="
                          item.gender === 'female'
                            ? 'red'
                            : item.gender === 'male'
                            ? 'blue'
                            : 'green'
                        "
                      ></q-icon>
                    </div>
                    <!-- //산란일 임박, 메이팅 임박 플래그 -->
                    <div class="pet-name">이름 : {{ item.name }}</div>
                    <div class="pet-status">
                      <template v-if="item.variety">
                        <div class="variety">품종 : {{ item.variety }}</div>
                      </template>
                      <template v-if="item.morph">
                        <div class="morph">모프 : {{ item.morph }}</div>
                      </template>
                      <template v-if="item.gender">
                        <span class="gender"
                          >성별 :
                          <q-icon
                            :color="
                              item.gender === 'female'
                                ? 'red'
                                : item.gender === 'male'
                                ? 'blue'
                                : 'green'
                            "
                            :name="
                              item.gender === 'female'
                                ? 'fa-solid fa-venus'
                                : item.gender === 'male'
                                ? 'fa-solid fa-mars'
                                : 'fa-solid fa-neuter'
                            "
                          ></q-icon>
                        </span>
                      </template>
                      <template v-else>
                        <span class="gender">
                          성별 :
                          <q-icon
                            color="green"
                            :name="'fa-solid fa-neuter'"
                          ></q-icon>
                        </span>
                      </template>
                      <template v-if="item.weight">
                        <span class="weight">체중 : {{ item.weight }}g</span>
                      </template>
                    </div>
                    <template v-if="item.hatchedAt">
                      <div class="pet-birth">부화일 : {{ item.hatchedAt }}</div>
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
                    title="기본 정보 수정"
                    label="기본 정보 수정"
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
                    @click="openPetAlbumDialog('pets', item)"
                  ></q-btn> -->
                  <q-btn
                    size="sm"
                    class="!tw-mx-0 !tw-px-0"
                    color="primary"
                    title="체중 관리"
                    label="체중 관리"
                    dense
                    @click="openWeightDialog(item)"
                  ></q-btn>
                  <q-btn
                    size="sm"
                    class="!tw-mx-0 !tw-px-0"
                    color="primary"
                    title="메이팅 관리"
                    label="메이팅 관리"
                    dense
                    @click="openMatingDialog(item)"
                  ></q-btn>
                  <q-btn
                    v-if="item.gender === 'female'"
                    size="sm"
                    class="!tw-mx-0 !tw-px-0"
                    color="primary"
                    title="산란 관리"
                    label="산란 관리"
                    dense
                    @click="openSpawnDialog(item)"
                  ></q-btn>
                  <q-btn
                    size="sm"
                    class="!tw-mx-0 !tw-px-0"
                    color="primary"
                    title="라인 관리"
                    label="라인 관리"
                    :class="
                      item.gender === 'female'
                        ? 'tw-col-span-1'
                        : 'tw-col-span-full'
                    "
                    dense
                    @click="openFamilyTreeDialog(item)"
                  ></q-btn>
                  <q-btn
                    class="tw-col-span-full !tw-mx-0"
                    color="warning"
                    title="개체 삭제"
                    label="개체 삭제"
                    icon="fa-solid fa-trash-can !tw-text-[0.75rem] tw-mr-[0.25rem]"
                    size="sm"
                    @click="handelDeletePet(item.id)"
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
          label="개체 등록"
          :icon="'fa-solid fa-plus'"
          @click="openDialog('regist')"
        ></q-btn>
      </q-page-sticky>
    </div>
    <!-- 팝업 영역 -->
    <div class="dialog-area"></div>
    <!-- //팝업 영역 -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar, scroll } from "quasar";

import { useCollection } from "vuefire";
import { auth, appFirestore } from "src/boot/firebase";
import { collection, query, where } from "firebase/firestore";

import {
  getUserPetsListFromFirestore,
  registPetInfoToFirestore,
  updatePetInfoProfileToFirestore,
  deletePetInfo,
  registPetsEvent,
  getPetLastHistory,
} from "src/js/breed/pets.js";
import { registEggInfoToDatabase } from "src/js/breed/eggs";

import {
  generateRandomString,
  estimateSpawnDate,
  estimateSoonSpawnDate,
  estimateSoonMatingDate,
  getImgThumbnail,
} from "src/js/common/tinymonCommon";

import PetRegistDialog from "src/components/breeding/pets/RegistPet.vue";
import PetsFamilyTreeDialog from "src/components/breeding/pets/HistoryFamilyTree.vue";
import PetsWeightDialog from "src/components/breeding/pets/HistoryWeight.vue";
import PetsSpawnDialog from "src/components/breeding/pets/HistorySpawn.vue";
import PetsMatingDialog from "src/components/breeding/pets/HistoryMating.vue";
import PetsAlbumDialog from "src/components/breeding/pets/PetAlbum.vue";
import PetsProfileImageDialog from "src/components/breeding/pets/PetProfileImage.vue";

const $q = useQuasar();
const router = useRouter();
const {
  getScrollTarget,
  getScrollHeight,
  getVerticalScrollPosition,
  getHorizontalScrollPosition,
} = scroll;

const petListScrollPos = ref([0, 0]);
// .pet-list scroll 이벤트
const onPetListScroll = (e) => {
  const scrollTarget = getScrollTarget(
    window.document.querySelector(".pet-list")
  );
  petListScrollPos.value = [
    getVerticalScrollPosition(scrollTarget),
    getHorizontalScrollPosition(scrollTarget),
  ];
};
onMounted(() => {
  document
    .querySelector(".pet-list")
    .addEventListener("scroll", onPetListScroll);
});

const db = appFirestore;
const petList = useCollection(
  query(collection(db, "pets"), where("owner", "==", auth.currentUser.uid))
);
// const petList = ref([]);

watch(petList, (newVal, oldVal) => {
  console.log("petList newVal", newVal);
  console.log("petList oldVal", oldVal);
});
const listRefresh = async (done) => {
  setTimeout(() => {
    // loadUserPetList();
    done();
  }, 1000);
};

const handelDeletePet = (id) => {
  console.log("handelDeletePet id", id);
  $q.dialog({
    title: "개체 삭제",
    message: "개체를 삭제하시겠습니까?",
    cancel: "취소",
    ok: "삭제",
  })
    .onOk(async () => {
      await deletePetInfo(id).then((res) => {
        console.log("res", res);
        if (res) {
          $q.notify({
            color: "positive",
            message: "개체가 삭제되었습니다.",
            position: "top",
            timeout: 1000,
          });
        }
      });
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 팝업 오픈(개체 등록, 개체 수정)
// action : insert, update
// target : default null
const openDialog = (action, target) => {
  console.log("target", target);
  $q.dialog({
    component: PetRegistDialog,
    componentProps: {
      dialogTitle: action === "regist" ? "개체 등록" : "개체 수정",
      gender: target ? target.gender : null,
      hatchedAt: target ? target.hatchedAt : null,
      id: target ? target.id : null,
      morph: target ? target.morph : null,
      name: target ? target.name : null,
      owner: target ? target.owner : null,
      variety: target ? target.variety : null,
    },
    parent: this,
  })
    .onOk((value) => {
      console.log("registPetInfoToDatabase");
      if (action === "regist") {
        registPetInfoToFirestore(value).then(() => {
          console.log("OK", value);
        });
      } else if (action === "update") {
        console.log("updatePetInfoProfileToFirestore", value);
        updatePetInfoProfileToFirestore(value).then(() => {
          console.log("OK", value);
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
// 팜업 오픈(메이팅 관리)
const openMatingDialog = (target) => {
  console.log("openMatingDialog target", target);
  $q.dialog({
    component: PetsMatingDialog,
    componentProps: {
      dialogTitle: "메이팅 관리",
      currentPetId: target ? target.id : null,
      currentPetName: target ? target.name : null,
      currentPetGender: target ? target.gender : null,
      currentPetMorph: target ? target.morph : null,
      currentPetVariety: target ? target.variety : null,
      currentPetHatchedAt: target ? target.hatchedAt : null,
      currentPetWeight: target ? target.weight : null,
    },
    parent: this,
  })
    .onOk((value) => {
      console.log("OK", value);
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 팜업 오픈(산란 관리)
const openSpawnDialog = (target) => {
  console.log("openSpawnDialog target", target);
  $q.dialog({
    component: PetsSpawnDialog,
    componentProps: {
      dialogTitle: "산란 관리",
      currentPetId: target ? target.id : null,
      currentPetName: target ? target.name : null,
      currentPetGender: target ? target.gender : null,
      currentPetMorph: target ? target.morph : null,
      currentPetVariety: target ? target.variety : null,
      currentPetHatchedAt: target ? target.hatchedAt : null,
      currentPetWeight: target ? target.weight : null,
    },
  })
    .onOk((value) => {
      console.log("OK", value);
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 팝업 오픈(체중 관리)
const openWeightDialog = (target) => {
  console.log("openWeightDialog target", target);
  $q.dialog({
    component: PetsWeightDialog,
    componentProps: {
      dialogTitle: "체중 관리",
      currentPetId: target ? target.id : null,
    },
  })
    .onOk((value) => {
      console.log("OK", value);
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 팝업 오픈(라인 트리 관리)
const openFamilyTreeDialog = (target) => {
  console.log("openFamilyTreeDialog target", target);
  $q.dialog({
    component: PetsFamilyTreeDialog,
    componentProps: {
      dialogTitle: "라인 트리 관리",
      familyTree: target.familyTree ? target.familyTree : null,
      gender: target ? target.gender : null,
      id: target ? target.id : null,
      morph: target ? target.morph : null,
      name: target ? target.name : null,
      variety: target ? target.variety : null,
    },
  })
    .onOk((value) => {
      console.log("OK", value);
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 팝업 오픈(앨범 관리)
const openPetAlbumDialog = (type, target) => {
  console.log("openPetAlbumDialog target", target);
  $q.dialog({
    component: PetsAlbumDialog,
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
