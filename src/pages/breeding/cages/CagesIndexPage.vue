<template>
  <div>
    <div
      class="cage-list tw-min-w-full tw-w-full tw-flex tw-flex-col tw-pb-[4rem] tw-prose tw-prose-sm"
    >
      <!-- list top Start -->
      <div class="list-top tw-flex-[0_0_auto] tw-px-[1.5rem] tw-py-[1rem]">
        <div class="list-count">
          총 {{ cageList.length }}개의 사육장이 등록되어있습니다 .
        </div>
      </div>
      <!-- //list top End -->
      <!-- list body -->
      <template v-if="!cageList.length > 0">
        <div
          class="no-result tw-max-w-[100%] tw-flex-[1_1_auto] tw-items-center tw-justify-center tw-text-center tw-flex"
        >
          등록된 사육장이 없습니다.<br />
          사육장을 등록해보세요.
        </div>
      </template>
      <template v-else>
        <swiper-container
          init="false"
          class="swiper tw-w-[100%] tw-flex-[1_1_auto]"
          :navigation="true"
          :pagination="true"
          :scrollbar="true"
          :slides-per-view="1"
          :css-mode="$q.platform.is.mobile"
          :allow-touch-move="true"
          :follow-finger="true"
          :grap-cursor="true"
          :update-on-window-resize="true"
        >
          <swiper-slide
            class="swiper-slide cage-item tw-flex tw-flex-col tw-p-[1rem] tw-overflow-y-auto tw-relative"
            v-for="(slideItem, index) in cageList"
            :key="index"
            :virtualIndex="index"
          >
            <h2 class="cage-title tw-flex-[0_0_auto]">{{ slideItem.name }}</h2>
            <p class="cage-sub-title tw-flex-[0_0_auto] tw-mb-[0.5rem]">
              {{ slideItem.description }}
            </p>
            <draggable
              class="cage-layout tw-relative tw-grid tw-justify-stretch tw-flex-[1_1_auto] tw-gap-2 tw-border-[1px] tw-border-[#f4f4f4] tw-p-[0.5rem] tw-rounded-[0.5rem] tw-bg-[#f8f8f8] tw-min-w-full tw-overflow-auto"
              :style="{
                'grid-template-columns':
                  'repeat(' + slideItem.size.width + ', minmax(6rem, 1fr))',
                'grid-template-rows':
                  'repeat(' + slideItem.size.height + ', minmax(6rem, 1fr))',
              }"
              :class="[
                'tw-grid-cols-' + slideItem.size.width,
                !dragStatus ? 'draggable' : '',
              ]"
              v-model="slideItem.pets"
              :group="{ name: slideItem.id, pull: 'clone', put: false }"
              item-key="id"
              :sort="true"
              :disabled="dragStatus"
              ghost-class="ghost"
              @change="checkMove($event, slideItem.id)"
            >
              {{ element }}
              <!-- slideItem.sizeW, slideItem.sizeH만큼 .cage-grid반복 -->
              <template #item="{ element, index }">
                <div
                  class="cage-grid-cell tw-flex tw-flex-col tw-stretch tw-justify-center tw-p-[0.5rem] tw-border-[#f4f4f4] tw-border-[1px] tw-rounded-[0.5rem] tw-bg-[#ffffff] tw-overflow-hidden tw-min-w-[5rem] tw-text-[0.75rem]"
                  :data-index="index"
                  :class="[!dragStatus ? 'tw-shadow-md' : '']"
                >
                  <template v-if="!element.containedPetId">
                    <q-btn
                      size="sm"
                      color="primary"
                      title="개체 등록"
                      rounded
                      @click="openInsertPetDialog(slideItem, index)"
                    >
                      <q-icon name="fa-solid fa-plus"></q-icon>
                    </q-btn>
                  </template>
                  <template v-else>
                    <div
                      class="flags"
                      v-if="
                        estimateSoonSpawnDate(
                          element.containedPetInfo.lastSpawnDate
                        ) ||
                        estimateSoonMatingDate(
                          element.containedPetInfo.lastSpawnDate
                        )
                      "
                    >
                      <q-icon
                        v-if="
                          estimateSoonSpawnDate(
                            element.containedPetInfo.lastSpawnDate
                          )
                        "
                        title="산란 임박"
                        color="primary"
                        name="fa-solid fa-egg"
                        class="!tw-text-[0.75rem]"
                      ></q-icon>
                      <q-icon
                        v-if="
                          estimateSoonMatingDate(
                            element.containedPetInfo.lastSpawnDate
                          )
                        "
                        title="메이팅 임박"
                        color="accent"
                        name="fa-solid fa-heart"
                        class="!tw-text-[0.75rem]"
                      ></q-icon>
                    </div>
                    <div class="name">
                      {{ element.containedPetInfo.name }}
                      <q-icon
                        :color="
                          element.containedPetInfo.gender === 'female'
                            ? 'red'
                            : element.containedPetInfo.gender === 'male'
                            ? 'blue'
                            : 'green'
                        "
                        :name="
                          element.containedPetInfo.gender === 'female'
                            ? 'fa-solid fa-venus'
                            : element.containedPetInfo.gender === 'male'
                            ? 'fa-solid fa-mars'
                            : 'fa-solid fa-neuter'
                        "
                      ></q-icon>
                    </div>
                    <div class="info tw-mb-auto">
                      <span>
                        {{ element.containedPetInfo.variety }}
                        ({{ element.containedPetInfo.morph }})
                      </span>
                    </div>
                    <q-btn
                      size="xs"
                      color="grey"
                      :icon="'fa-solid fa-close'"
                      title="개체 삭제"
                      @click="openEjectionPetDialog(slideItem, index)"
                    ></q-btn>
                  </template>
                </div>
              </template>
            </draggable>
            <!-- cage actions -->

            <q-btn-group
              class="case-actions tw-text-center tw-justify-center tw-gap-[0.5rem] tw-my-[1rem]"
              flat
            >
              <q-btn
                class="tw-flex-1"
                color="warning"
                @click="handelDeleteCage(slideItem.id)"
                :disable="!dragStatus"
                label="사육장 삭제"
                size="sm"
                icon="fa-solid fa-trash-can !tw-text-[0.75rem] tw-mr-[0.25rem]"
              ></q-btn>
              <q-btn
                class="tw-flex-1"
                color="primary"
                @click="openDialog('update', slideItem)"
                :disable="!dragStatus"
                label="정보 수정"
                size="sm"
              ></q-btn>
              <q-btn
                class="tw-flex-1"
                color="primary"
                @click="changeDraggableStatus(!dragStatus)"
                :label="!dragStatus ? '변경 완료' : '배치 변경'"
                size="sm"
              ></q-btn>
            </q-btn-group>
            <!-- //cage actions -->
          </swiper-slide>
          <!-- <div class="swiper-wrapper tw-flex-[1_1_auto]">
          </div>
          <div class="swiper-pagination"></div>
          <div class="swiper-scrollbar"></div> -->
        </swiper-container>
      </template>
      <!-- //list body -->
      <q-page-sticky
        position="bottom-right"
        class="tw-right-[1.5rem] tw-bottom-[1.5rem] tw-z-10"
      >
        <q-btn
          color="negative"
          label="사육장 등록"
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

import { appFirestore } from "src/boot/firebase";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { getUserPetsListFromFirestore } from "src/js/breed/pets";
import {
  registCageInfoToFirestore,
  getCageInfoFromFirestore,
  getCageListFromFirestore,
  updateCageInfoFromFirestore,
  deleteCageInfoFromFirestore,
  getContainedPetListFromFirestore,
  addPetToEmptyCageInFirestore,
  changePetOrderInFirestore,
  updateContainedPetInfoInFirestore,
  deleteContainedPetInfoFromFirestore,
} from "src/js/breed/cages.js";

import CageRegistDialog from "src/components/breeding/cages/RegistCage.vue";
import InsertPetDialog from "src/components/breeding/cages/InsertPet.vue";
import {
  generateRandomString,
  estimateSpawnDate,
  estimateSoonSpawnDate,
  estimateSoonMatingDate,
} from "src/js/common/tinymonCommon";

/* Swiper 세팅 */
// import function to register Swiper custom elements
import { register } from "swiper/element/bundle";
import { Navigation, Pagination, Scrollbar } from "swiper";

register();

/* //Swiper 세팅 */
import draggable from "vuedraggable";
console.log(draggable);
const dragStatus = ref(true);
const changeDraggableStatus = (status) => {
  dragStatus.value = status;
};

const deviceIsMobile = ref(false);
const $q = useQuasar();

const auth = getAuth();

console.log("auth", auth);

// window.addEventListener("resize", (event) => {
//   // console.log(event);
//   // console.log("desktop", $q.platform.is.desktop);
//   // console.log("mobile", $q.platform.is.mobile);
//   // console.log("touch", $q.platform.has.touch);
//   // deviceIsMobile.value = $q.platform.is.desktop;
//   updateSwiper();
// });

const router = useRouter();

const db = appFirestore;
const cageList = useCollection(
  query(collection(db, "cages"), where("owner", "==", auth.currentUser.uid))
);
const {
  // rename the Ref to something more meaningful
  data: contact,
  // is the subscription still pending?
  pending,
  // did the subscription fail?
  error,
  // A promise that resolves or rejects when the initial state is loaded
  promise,
} = useCollection(
  query(collection(db, "cages"), where("owner", "==", auth.currentUser.uid))
);
console.log("cageList", contact);

const checkUpdate = onSnapshot(
  query(collection(db, "cages"), where("owner", "==", auth.currentUser.uid)),
  (snapshot) => {
    console.log("cageList", snapshot);
    updateSwiper();
  }
);

const draggableList = ref([]);
const listDragging = ref(false);

const checkMove = (evt, cageId) => {
  console.log("checkMove", evt, cageId);
  // pet 순서 변경
  changePetOrderInFirestore(
    cageId,
    evt.moved.oldIndex,
    evt.moved.newIndex
  ).then(() => {
    // loadUserCageList();
    console.log("pet 순서 변경 완료");
  });
  return !listDragging.value;
};
const add = () => {
  draggableList.value.push({
    name: "New Element",
  });
};
const replace = () => {
  draggableList.value.splice(1, 1, {
    name: "Replaced Element",
  });
};

const updateSwiper = async () => {
  const swiperEl = document.querySelector("swiper-container");
  // console.log($q.platform.is.mobile);
  const swiperParams = {
    modules: [Navigation, Pagination, Scrollbar],
  };
  if (document.querySelectorAll(".swiper-slide").length > 0) {
    Object.assign(swiperEl, swiperParams);
    swiperEl.initialize();
    // swiperEl.swiper.destroy(false, false);
    try {
      setTimeout(() => {
        swiperEl.swiper.update();
      }, 0);
    } catch (error) {
      console.log("error", error);
    }
  }
};

onMounted(async () => {
  // loadUserCageList();
  // draggable.props.disabled = true;
  console.log(draggable);
});
// cageList 변경 감지 변경되면 swiper 업데이트
// computed(contact, () => {
//   console.log("cageList 변경 감지", cageList);
//   updateSwiper();
// });
// watch(contact, async (newVal, oldVal) => {
//   console.log("cageList 변경 감지", newVal, oldVal);
//   updateSwiper();
// });

// 사육장 목록 불러오기
const loadUserCageList = async () => {
  const cageListData = await getCageListFromFirestore();
  try {
    cageList.value = cageListData;
    console.log("cageList", cageList.value);
  } catch (error) {
    console.log("error", error);
  }
  // updateSwiper();
};
// 사육장 삭제
const handelDeleteCage = (id) => {
  $q.dialog({
    title: "사육장 삭제",
    message:
      "사육장을 삭제하시겠습니까? 사육장을 삭제해도 개체정보는 삭제되지 않습니다.",
    cancel: "취소",
    ok: "삭제",
  })
    .onOk(() => {
      deleteCageInfoFromFirestore(id).then(() => {
        // getCageListFromFirestore();
        // loadUserCageList();
        // updateSwiper();
      });
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 팝업 오픈(사육장 등록, 사육장 수정)
// action : insert, update
// target : default null
const openDialog = (action, target) => {
  $q.dialog({
    component: CageRegistDialog,
    componentProps: {
      action: action,
      dialogTitle: action == "insert" ? "사육장 등록" : "사육장 수정",
      id: target ? target.id : null,
      name: target ? target.name : null,
      description: target ? target.description : null,
      size: {
        width: target ? target.size.width : 1,
        height: target ? target.size.height : 1,
      },
      pets: target ? target.pets : null,
    },
    parent: this,
  })
    .onOk((value) => {
      if (action == "insert") {
        console.log("registCageInfoToDatabase");
        registCageInfoToFirestore(value).then(() => {
          // loadUserCageList();
          console.log("OK", value);
          // updateSwiper();
        });
      } else if (action == "update") {
        console.log("updateCageInfoFromFirestore");
        updateCageInfoFromFirestore(value).then(() => {
          // loadUserCageList();
          console.log("OK", value);
          // updateSwiper();
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
// 사육장에 개체 넣기 팝업 오픈
const openInsertPetDialog = (target, index) => {
  console.log("openInsertDialog", target, index);
  $q.dialog({
    component: InsertPetDialog,
    componentProps: {
      dialogTitle: "사육장에 개체 넣기",
      id: target.id,
      name: target.name,
      info: target.info,
      sizeW: target.sizeW,
      sizeH: target.sizeH,
      pets: target.pets,
      index: index,
    },
    parent: this,
  })
    .onOk((value) => {
      console.log("insertPetToCage", value);
      addPetToEmptyCageInFirestore(value.cageId, value.pet, value.index).then(
        () => {
          // getCageListFromFirestore();
          // loadUserCageList();
          console.log("OK", value);
        }
      );
      console.log("OK", value);
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
// 사육장에서 개체 빼기 팝업 오픈
const openEjectionPetDialog = (target, index) => {
  console.log("openEjectionPetDialog", target, index);
  $q.dialog({
    title: "사육장에서 개체 빼기",
    message: "사육장에서 개체를 빼시겠습니까?",
    cancel: "취소",
    ok: "빼기",
  })
    .onOk(() => {
      console.log("ejectionPetFromCage");
      deleteContainedPetInfoFromFirestore(target.id, index).then(() => {
        // getCageListFromFirestore();
        // loadUserCageList();
      });
    })
    .onCancel(() => {
      console.log("Cancel");
    })
    .onDismiss(() => {
      console.log("Dismiss");
    });
};
</script>
<style>
.ghost {
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.5);
}
.sortable-drag {
  opacity: 0 !important;
  z-index: -1 !important;
  /* top: 0 !important; */
  /* left: 0 !important; */
  /* z-index: -1 !important; */
}
</style>
