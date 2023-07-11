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
        <p>체중: {{ currentPet.weight }} g</p>
      </q-card-section>
      <q-card-section>
        <h3>메이팅 파트너</h3>
        <div class="radio-group">
          <q-radio
            v-model="hasMatingPartner"
            label="메이팅 파트너 없음"
            val="false"
          ></q-radio>
          <q-radio
            v-model="hasMatingPartner"
            label="메이팅 파트너 있음 (최근 5마리 까지)"
            val="true"
          ></q-radio>
        </div>
        <q-select
          v-if="hasMatingPartner === 'true'"
          v-model="selectedPartner"
          label="메이팅 파트너"
          :options="partnerOptions"
          :option-value="(item) => item"
          :option-label="
            (item) =>
              `${item.name} (${new Date(item.matingDate).toLocaleDateString()})`
          "
          :options-dense="true"
        >
          <!--  -->
        </q-select>
      </q-card-section>
      <q-card-section>
        <h3>산란정보</h3>
        <q-select
          label="산란갯수"
          v-model="eggCount"
          :options="eggCountOptions"
        ></q-select>
        <template v-if="eggCount >= 1">
          <div
            class="radio-group tw-flex tw-items-center"
            v-for="(item, index) in eggCount"
            :key="index"
          >
            <h3>{{ index + 1 }}번 알 상태</h3>
            <q-option-group
              :options="eggStatusOptions"
              type="radio"
              v-model="eggStatus[index]"
              class="tw-flex tw-items-center"
            >
            </q-option-group>
          </div>
        </template>
        <q-input v-model="spawnDate" label="산란일" type="date"></q-input>
        <q-btn
          label="기록 추가"
          class="tw-w-full tw-mt-[1rem]"
          color="primary"
          @click="addSpawnHistory"
        ></q-btn>
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
import { useQuasar, useDialogPluginComponent } from "quasar";
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
} from "firebase/firestore";
import { registPetsEvent } from "src/js/breed/pets";
import { registEggInfoToDatabase } from "src/js/breed/eggs";
const $q = useQuasar();
const props = defineProps({
  dialogTitle: {
    type: String,
    default: "",
  },
  currentPetId: {
    type: String,
    default: "",
  },
  currentPetName: {
    type: String,
    default: "",
  },
  currentPetGender: {
    type: String,
    default: "",
  },
  currentPetMorph: {
    type: String,
    default: "",
  },
  currentPetVariety: {
    type: String,
    default: "",
  },
  currentPetBirthDate: {
    type: String,
    default: "",
  },
  currentPetWeight: {
    type: Number,
    default: 0,
  },
});
console.log("props", props);

const currentTargetPetId = ref(props.currentPetId);
const currentTargetPetName = ref(props.currentPetName);
const currentTargetPetGender = ref(props.currentPetGender);
const currentTargetPetMorph = ref(props.currentPetMorph);
const currentTargetPetVariety = ref(props.currentPetVariety);
const currentTargetPetBirthDate = ref(props.currentPetBirthDate);
const currentTargetPetWeight = ref(props.currentPetWeight);

const hasMatingPartner = ref("false");

const currentPet = ref({});
currentPet.value = {
  id: currentTargetPetId.value,
  name: currentTargetPetName.value,
  gender: currentTargetPetGender.value,
  morph: currentTargetPetMorph.value,
  variety: currentTargetPetVariety.value,
  birthDate: currentTargetPetBirthDate.value,
  weight: currentTargetPetWeight.value,
};
watch(currentPet, (newValue, oldValue) => {
  console.log("selectedPet changed");
  console.log(newValue);
  console.log(oldValue);
});
const selectedPartner = ref(null);
const partnerOptions = ref([]);
const spawnDate = ref(new Date().toISOString().substr(0, 10));

const eggCount = ref(2);
const eggCountOptions = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const eggStatusOptions = ref([
  { label: "유정", value: true },
  { label: "무정", value: false },
]);
const eggStatus = ref([
  // "true",
  // "true",
  // "true",
  // "true",
  // "true",
  // "true",
  // "true",
  // "true",
  // "true",
  // "true",
]);

const dataSet = ref({
  eggCount: 0,
  eggStatus: [],
  estimatedHatchDate: "",
  father: {},
  matingDate: "",
  mother: {},
  scheduleType: "",
  eventDate: "",
});

const addSpawnHistory = async () => {
  dataSet.value.mother =
    currentPet.value.gender === "female"
      ? currentPet.value
      : selectedPartner.value;
  dataSet.value.father =
    currentPet.value.gender === "male"
      ? currentPet.value
      : selectedPartner.value;
  dataSet.value.scheduleType = "spawn";
  dataSet.value.eventDate = new Date(spawnDate.value).getTime();
  dataSet.value.eggCount = eggCount.value;
  dataSet.value.eggStatus = eggStatus.value;

  // eggStatus.value에 true가 하나 이상 있으면
  // 알 개체 등록 여부 묻기 모두 false면 산란 기록만 업데이트 하기
  if (eggStatus.value.includes(true)) {
    $q.dialog({
      title: "알 개체 등록",
      message:
        "해당 정보를 이용하여 알 개체를 자동으로 등록하시겠습니까? 인큐베이터 온도를 입력하세요",
      prompt: {
        model: "",
        type: "number",
      },
      cancel: "취소",
      ok: "등록",
    })
      .onOk((promptValue) => {
        console.log("OK", dataSet.value, promptValue);
        dataSet.value.incubatorTemp = promptValue;
        console.log("value", dataSet.value);
        registEggInfoToDatabase(dataSet.value).then(() => {
          // 등록 완료 notofy 띄우기
          $q.notify({
            color: "positive",
            message: "알 개체가 등록되었습니다.",
            position: "top",
            timeout: 1000,
          });
        });
      })
      .onCancel(() => {
        registPetsEvent("spawn", dataSet.value).then(() => {
          $q.notify({
            color: "positive",
            message: "산란 정보가 추가되었습니다.",
            position: "top",
            timeout: 1000,
          });
        });
        console.log("Cancel");
      })
      .onDismiss(() => {
        console.log("Dismiss");
      });
  } else {
    await registPetsEvent("spawn", dataSet.value).then(() => {
      $q.notify({
        color: "positive",
        message: "산란 정보가 추가되었습니다.",
        position: "top",
        timeout: 1000,
      });
    });
  }
};

// 사용자 DB 'users/${JSON.parse(localStorage.getItem("currentUser")).user.uid}/pets/${currentTargetPetId.value}/history/mating'에서 mating 정보 가져오기
onMounted(async () => {
  const db = getFirestore(firebaseApp);
  console.log("currentTargetPetId", currentTargetPetId.value);
  // userPetsMatingPartnersRef : doc(db, 'pets', currentTargetPetId.value, 'history', 'mating') 를 각 항목의 eventDate 값 내림차순으로 정렬 query
  const userPetsMatingPartnersRef = doc(db, "pets", currentTargetPetId.value);
  const userPetsMatingPartnersSnapshot = await getDoc(
    userPetsMatingPartnersRef
  );
  const userPetsMatingPartners = userPetsMatingPartnersSnapshot.data().history
    .mating
    ? userPetsMatingPartnersSnapshot.data().history.mating
    : {};
  // userPetsMatingPartners object를 내림차순으로 재정렬해서 userPetsMatingPartnersKeys에 저장(object의 key,value 함께 저장)
  const userPetsMatingPartnersKeys = Object.keys(userPetsMatingPartners).sort(
    (a, b) => {
      return (
        new Date(userPetsMatingPartners[b].matingDate) -
        new Date(userPetsMatingPartners[a].matingDate)
      );
    }
  );

  console.log("userPetsMatingPartnersKeys", userPetsMatingPartners);
  try {
    for (const pet in userPetsMatingPartnersKeys) {
      console.log("pet", pet);
      console.log(
        "userPetsMatingPartners[pet]",
        userPetsMatingPartners[userPetsMatingPartnersKeys[pet]]
      );
      if (pet < 5) {
        const partnerDbRef = doc(
          db,
          "pets",
          userPetsMatingPartners[userPetsMatingPartnersKeys[pet]].matingPartner
        );
        const partnerDbRefSnapshot = await getDoc(partnerDbRef);
        const partnerDb = partnerDbRefSnapshot.data();
        partnerOptions.value.push({
          id: partnerDb.id,
          name: partnerDb.name,
          matingDate:
            userPetsMatingPartners[userPetsMatingPartnersKeys[pet]].matingDate,
        });
        console.log(userPetsMatingPartners[userPetsMatingPartnersKeys[pet]]);
      }
    }
    console.log("partnerOptions", partnerOptions);
    console.log("userPetsRef", userPetsMatingPartners);
  } catch (error) {
    console.log("userPetsSnapshot error", error);
  }
});

computed(eggStatus, (newValue, oldValue) => {
  console.log("eggStatus changed");
  console.log(newValue);
  console.log(oldValue);
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
  onDialogOK({
    mother:
      currentPet.value.gender === "female"
        ? currentPet.value
        : selectedPartner.value,
    father:
      currentPet.value.gender === "male"
        ? currentPet.value
        : selectedPartner.value,
    scheduleType: "spawn",
    spawntDate: spawnDate.value,
    eggCount: eggCount.value,
    eggStatus: eggStatus.value,
  });
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
