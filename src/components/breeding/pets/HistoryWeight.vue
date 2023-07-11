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
        <p>성별: {{ currentPet.gender }}</p>
        <p>모프: {{ currentPet.morph }}</p>
        <p>체중: {{ lastWeight }}</p>
      </q-card-section>
      <q-card-section>
        <q-input label="체중 측정일" v-model="weightDate" type="date"></q-input>
        <q-input
          v-model="currentWeight"
          label="최종 측정 체중 입력"
          type="number"
        ></q-input>
        <q-btn
          label="기록 추가"
          class="tw-w-full tw-mt-[1rem]"
          color="primary"
          @click="addWeightHistory"
        ></q-btn>
      </q-card-section>
      <q-card-section>
        <!-- 체중 차트 영역 -->
        <div id="weightChart" class="tw-h-[11.25rem]"></div>
        <!-- //체중 차트 영역 -->
      </q-card-section>
      <q-card-actions>
        <q-btn label="취소" @click="onDialogCancelClick"></q-btn>
        <q-btn label="확인" @click="onDialogOKClick"></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useDialogPluginComponent } from "quasar";
import { auth, firebaseApp } from "boot/firebase";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { registPetsEvent } from "src/js/breed/pets";
import * as echarts from "echarts";

const props = defineProps({
  dialogTitle: {
    type: String,
    default: "",
  },
  currentPetId: {
    type: String,
    default: "",
  },
});
console.log("props", props);

const currentTargetPetId = ref(props.currentPetId);
const currentPet = ref({});

const weightDate = ref(new Date().toISOString().substr(0, 10));
const lastWeight = ref(0);
const currentWeight = ref(0);
const weightList = ref([]);

console.log("weightDate", weightDate.value);

const hasMatingPartner = ref("false");

const addWeightHistory = async () => {
  console.log("addWeightHistory");
  const dataSet = {
    id: currentTargetPetId.value,
    eventDate: new Date(weightDate.value).getTime(),
    weight: currentWeight.value,
  };
  await registPetsEvent("weight", dataSet);
};

const loadWeightData = async () => {
  console.log("loadWeightData");
};

onMounted(async () => {
  const db = getFirestore(firebaseApp);
  // pets collection에서 현재 선택된 개체의 정보를 가져온다.
  const petDocRef = doc(db, "pets", currentTargetPetId.value);
  const petDocSnap = await getDoc(petDocRef);
  const petWeightDocRef = doc(
    db,
    "pets",
    currentTargetPetId.value,
    "history",
    "weight"
  );
  const petWeightDocQuery = query(
    collection(db, "pets", currentTargetPetId.value, "history"),
    where("weight", "array-contains", "weightDate"),
    orderBy("weightDate", "asc")
  );
  const petWeightDocSnap = await getDocs(petWeightDocQuery);
  console.log("petWeightDocSnap", petWeightDocSnap.docs);

  if (petDocSnap.exists()) {
    currentPet.value = petDocSnap.data();
    console.log("currentPet", currentPet.value.history.weight);
    if (currentPet.value.history.weight) {
      console.log("이전 체중 측정 기록 있음");
      // currentPet.value.history.weight를 배열로 변환하고 배멸을 weightDate 값을 기준으로 오름 차순으로 정렬후 weightList에 저장
      const sortedWeight = Object.entries(currentPet.value.history.weight).sort(
        (a, b) => {
          return a[1].weightDate > b[1].weightDate ? 1 : -1;
        }
      );
      weightList.value = sortedWeight;
      console.log("sortedWeight", sortedWeight);
      // currentPet.value.history.weight 배열에서 마지막 요소의 체중을 lastWeight에 저장
      lastWeight.value =
        currentPet.value.history.weight[
          Object.keys(currentPet.value.history.weight)[
            Object.keys(currentPet.value.history.weight).length - 1
          ]
        ].weight;
    } else {
      console.log("이전 체중 측정 기록 없음");
    }
  } else {
    console.log("No such document!");
  }

  // Chart 그리기
  const weightChart = echarts.init(document.getElementById("weightChart"), {
    renderer: "svg",
    lazyUpdate: true,
  });
  weightChart.setOption({
    title: {
      text: "체중 변화 그래프",
      textStyle: {
        fontSize: 14,
      },
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: weightList.value
        ? weightList.value.map((item) => item[1].weightDate)
        : [],
    },
    yAxis: {
      type: "value",
      interval: 10,
    },
    // legend: {
    //   data: weightList.value
    //     ? weightList.value.map((item) => item[1].weightDate)
    //     : [],
    // },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    series: [
      {
        name: "체중",
        type: "line",
        smooth: true,
        data: weightList.value
          ? weightList.value.map((item) => item[1].weight)
          : [],
      },
    ],
  });
  const petDocObserver = onSnapshot(petDocRef, (doc) => {
    // echart update
    console.log("echart update", doc.data());
    // currentPet.value.history.weight를 배열로 변환하고 배멸을 weightDate 값을 기준으로 오름 차순으로 정렬후 weightList에 저장
    const sortedWeight = doc.data().history.weight
      ? Object.entries(doc.data().history.weight).sort((a, b) => {
          return a[1].weightDate > b[1].weightDate ? 1 : -1;
        })
      : [];
    weightList.value = sortedWeight;
    console.log("sortedWeight", sortedWeight);
    weightChart.setOption({
      xAxis: {
        data: weightList.value
          ? weightList.value.map((item) =>
              new Date(item[1].weightDate).toLocaleDateString()
            )
          : [],
      },
      // legend: {
      //   data: weightList.value
      //     ? weightList.value.map((item) => item[1].weightDate)
      //     : [],
      // },
      series: [
        {
          name: "체중",
          type: "line",
          smooth: true,
          data: weightList.value
            ? weightList.value.map((item) => item[1].weight)
            : [],
        },
      ],
    });
  });
});

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
  console.log("체중 등록 시도");
  onDialogOK({});
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
