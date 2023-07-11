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
      </q-card-section>
      <q-card-section>
        <h3>부모 개체</h3>
        <q-select
          v-model="selectedMale"
          label="부개체"
          :options="malePetList"
          :option-value="(item) => item"
          :option-label="(item) => `${item.name} (${item.morph})`"
          :options-dense="true"
        >
          <!--  -->
        </q-select>
        <q-select
          v-model="selectedFemale"
          label="모개체"
          :options="femalePetList"
          :option-value="(item) => item"
          :option-label="(item) => `${item.name} (${item.morph})`"
          :options-dense="true"
        >
          <!--  -->
        </q-select>
        <q-btn
          label="부모 정보 저장"
          class="tw-w-full tw-mt-[1rem]"
          color="primary"
          @click="updateFamilyTree(currentPet)"
        ></q-btn>
      </q-card-section>
      <!-- 가계도 차트 -->
      <template v-if="currentPet.familyTree.id">
        <q-card-section>
          <!-- <pre>{{ chartData }}</pre> -->
          <h3>가계도</h3>
          <div id="familyTreeChart" class="tw-h-[22.5rem]"></div>
        </q-card-section>
      </template>
      <!-- //가계도 차트 -->
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
import { useDialogPluginComponent } from "quasar";
import { auth, firebaseApp, appFirestore } from "boot/firebase";
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
  and,
  or,
} from "firebase/firestore";
import { registPetsEvent, getFamilyTree } from "src/js/breed/pets";
import * as echarts from "echarts";
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
  variety: {
    type: String,
    default: "",
  },
  familyTree: {
    type: Object,
    default: () => {},
  },
});
console.log("props", props);

const currentTargetPetId = ref(props.id);
const currentTargetPetName = ref(props.name);
const currentTargetPetGender = ref(props.gender);
const currentTargetPetMorph = ref(props.morph);
const currentTargetPetVariety = ref(props.variety);
const currentTargetPetFamilyTree = ref(props.familyTree);

const femalePetList = ref([]);
const malePetList = ref([]);

const selectedFemale = ref(null);
const selectedMale = ref(null);
const targetFamilyTree = ref(props.familyTree);
const fatherFamilyTree = ref({});
const motherFamilyTree = ref({});
const clutchMateFamilyTree = ref({});

const currentPet = ref({});
const chartData = ref([]);
const chartLinks = ref([]);
currentPet.value = {
  id: currentTargetPetId.value,
  name: currentTargetPetName.value,
  gender: currentTargetPetGender.value,
  morph: currentTargetPetMorph.value,
  variety: currentTargetPetVariety.value,
  familyTree: currentTargetPetFamilyTree.value,
};
watch(selectedFemale, (newValue, oldValue) => {
  console.log("selectedFemale changed");
  console.log(newValue.familyTree);
});
watch(selectedMale, (newValue, oldValue) => {
  console.log("selectedMale changed");
  console.log(newValue.familyTree);
});
watch(currentPet, (newValue, oldValue) => {
  console.log("selectedPet changed");
  console.log(newValue.familyTree);
});

const updateFamilyTree = async (target) => {
  fatherFamilyTree.value = getFamilyTree(selectedMale.value.id);
  try {
    console.log("fatherFamilyTree", fatherFamilyTree.value);
  } catch (e) {
    console.log(e);
  }
  motherFamilyTree.value = getFamilyTree(selectedFemale.value.id);
  try {
    console.log("motherFamilyTree", motherFamilyTree.value);
  } catch (e) {
    console.log(e);
  }
  if (target.familyTree.clutchMate) {
    clutchMateFamilyTree.value = getFamilyTree(target.familyTree.clutchMate.id);
    try {
      console.log("clutchMateFamilyTree", clutchMateFamilyTree.value);
    } catch (e) {
      console.log(e);
    }
  }
  const dataSet = {
    id: target.id,
    morph: target.morph,
    gender: target.gender,
    name: target.name,
    parents: {
      father: {
        id: selectedMale.value ? selectedMale.value.id : null,
        morph: selectedMale.value.morph ? selectedMale.value.morph : null,
        gender: selectedMale.value.gender ? selectedMale.value.gender : null,
        name: selectedMale.value.name ? selectedMale.value.name : null,
        parents: {
          father: selectedMale.value.familyTree.parents
            ? selectedMale.value.familyTree.parents.father
            : null,
          mother: selectedMale.value.familyTree.parents
            ? selectedMale.value.familyTree.parents.mother
            : null,
        },
        clutchMate: selectedMale.value.familyTree.clutchMate
          ? selectedMale.value.familyTree.clutchMate
          : null,
      },
      mother: {
        id: selectedFemale.value.id ? selectedFemale.value.id : null,
        morph: selectedFemale.value.morph ? selectedFemale.value.morph : null,
        gender: selectedFemale.value.gender
          ? selectedFemale.value.gender
          : null,
        name: selectedFemale.value.name ? selectedFemale.value.name : null,
        parents: {
          father: selectedFemale.value.familyTree.parents
            ? selectedFemale.value.familyTree.parents.father
            : null,
          mother: selectedFemale.value.familyTree.parents
            ? selectedFemale.value.familyTree.parents.mother
            : null,
        },
        clutchMate: selectedFemale.value.familyTree.clutchMate
          ? selectedFemale.value.familyTree.clutchMate
          : null,
      },
    },
    clutchMate: target.familyTree.clutchMate
      ? target.familyTree.clutchMate
      : null,
  };
  registPetsEvent("familyTree", dataSet);
};

watch(currentPet.value.familyTree, (newValue, oldValue) => {
  console.log("convertedFamilyTree changed");
  console.log(newValue);
  console.log(oldValue);
  if (newValue) {
    // currentPet.value.familyTree의 모든 하위 key들을 조회하여 그 값들을 log 출력, 만약 중첩된 객체라면 그 객체의 key들을 다시 조회하여 log 출력
  }
});

onMounted(async () => {
  console.log("onMounted");
  console.log("currentPet.value", currentPet.value);
  console.log("currentPet.value.familyTree", currentPet.value.familyTree);
  // console.log(
  //   "currentPet.value.familyTree.length",
  //   currentPet.value.familyTree.length
  // );
  const db = getFirestore();
  const petColRef = collection(db, "pets");
  const femaleDocQuery = query(
    petColRef,
    and(
      where("gender", "==", "female"),
      where(
        "owner",
        "==",
        JSON.parse(localStorage.getItem("currentUser")).user.uid
      ),
      where("variety", "==", currentTargetPetVariety.value)
    ),
    orderBy("name")
  );
  const femaleColSnapshot = await getDocs(femaleDocQuery).then(
    (querySnapshot) =>
      querySnapshot.docs.map((doc) => {
        // console.log("doc", doc);
        if (currentTargetPetId.value !== doc.id) {
          return {
            id: doc.id,
            ...doc.data(),
          };
        }
      })
  );
  femaleColSnapshot.forEach((item) => {
    if (item) {
      femalePetList.value.push(item);
    }
  });
  console.log("femalePetList.value", femalePetList.value);
  const maleDocQuery = query(
    petColRef,
    and(
      where("gender", "==", "male"),
      where(
        "owner",
        "==",
        JSON.parse(localStorage.getItem("currentUser")).user.uid
      ),
      where("variety", "==", currentTargetPetVariety.value)
    ),
    orderBy("name")
  );
  const maleColSnapshot = await getDocs(maleDocQuery).then((querySnapshot) =>
    querySnapshot.docs.map((doc) => {
      if (currentTargetPetId.value !== doc.id) {
        return {
          id: doc.id,
          ...doc.data(),
        };
      }
    })
  );
  maleColSnapshot.forEach((item) => {
    // console.log("item", item);
    if (item) {
      malePetList.value.push(item);
    }
  });
  console.log("malePetList.value", malePetList.value);

  console.log("currentPet.value.familyTree", currentPet.value.familyTree);

  // console.log("node", node);
  // const convertedNodes = {
  //   nodes: ref([]),
  //   links: ref([]),
  // };
  const convertToNestedStructure = async (treeData) => {
    const nodeDepth = ref(0);
    const baseNodeName = ref(null);
    const convertNode = (node, depth) => {
      if (!node) {
        console.log("node is null");
      }
      console.log("node", node, nodeDepth.value);
      if (chartData.value.length === 0) {
        baseNodeName.value = node.name;
        chartData.value.push({
          name: `${node.name}(${node.morph}/${node.gender})`,
        });
      } else {
        // chartData.value 의 배열 객체 중에 name이 node.name인 객체가 있는지 확인
        const isExist = chartData.value.find(
          (item) => item.name === `${node.name}(${node.morph}/${node.gender})`
        );
        if (!isExist) {
          chartData.value.push({
            name: `${node.name}(${node.morph}/${node.gender})`,
          });
        }
      }
      if (
        (node.parents && node.parents.father) ||
        (node.parents && node.parents.mother)
      ) {
        nodeDepth.value++;
        if (node.parents.father) {
          const fatherNode = convertNode(node.parents.father, nodeDepth.value);
          console.log("fatherNode", fatherNode);
          chartLinks.value.push({
            source: `${node.parents.father.name}(${node.parents.father.morph}/${node.parents.father.gender})`,
            target: `${node.name}(${node.morph}/${node.gender})`,
            value: 1 / nodeDepth.value,
          });
        }

        if (node.parents.mother) {
          const motherNode = convertNode(node.parents.mother, nodeDepth.value);
          console.log("motherNode", motherNode);
          chartLinks.value.push({
            source: `${node.parents.mother.name}(${node.parents.mother.morph}/${node.parents.mother.gender})`,
            target: `${node.name}(${node.morph}/${node.gender})`,
            value: 1 / nodeDepth.value,
          });
        }
      }

      // return convertedNodes;
    };
    return convertNode(treeData);
  };
  if (currentPet.value.familyTree.id) {
    const convert = convertToNestedStructure(currentPet.value.familyTree);
    // Chart 그리기
    const familyTreeChart = echarts.init(
      document.getElementById("familyTreeChart"),
      {
        renderer: "svg",
        lazyUpdate: true,
      }
    );
    const option = {
      title: {
        text: "가계도",
        textStyle: {
          fontSize: 14,
        },
      },
      tooltip: {
        trigger: "axis",
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      series: [
        {
          name: "가계도",
          type: "sankey",
          data: chartData.value,
          links: chartLinks.value,
          orient: "vertical",
          emphasis: {
            focus: "adjacency",
          },
          lineStyle: {
            curveness: 0.5,
          },
          animationDurationUpdate: 750,
        },
      ],
    };
    option && familyTreeChart.setOption(option);
  }
  console.log(
    "convertedFamilyTree",
    currentPet.value.familyTree,
    chartData.value,
    chartLinks.value
  );
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
  onDialogOK();
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
