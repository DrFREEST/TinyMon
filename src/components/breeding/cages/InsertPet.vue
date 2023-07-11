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
        <q-form>
          <q-select
            v-model="selectedPet"
            :options="userPetList"
            :option-value="(item) => item.id"
            :option-label="(item) => item.name"
            :options-dense="true"
            label="개체 선택"
          ></q-select>
        </q-form>
      </q-card-section>
      <q-card-actions>
        <q-btn label="취소" @click="onDialogCancelClick"></q-btn>
        <q-btn label="등록" @click="onDialogOKClick"></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, watch, ref } from "vue";
import { useRouter } from "vue-router";
import { useDialogPluginComponent } from "quasar";
import { getUserPetsListFromFirestore } from "src/js/breed/pets";

const props = defineProps({
  dialogTitle: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    default: "",
  },
  index: {
    type: Number,
    default: 0,
  },
});
console.log(props);

const userPetList = ref([]);
const selectedPet = ref(null);
onMounted(async () => {
  const petListData = await getUserPetsListFromFirestore()
    .then((res) => {
      console.log("res", res, Object.entries(res));
      // res에서 containedCageId가 없거나 ""인 것만 필터링
      userPetList.value = Object.entries(res)
        .filter((item) => {
          return (
            item[1].containedCageId === "" || item[1].containedCageId === null
          );
        })
        .map((item) => {
          console.log(item);
          return {
            id: item[1].id,
            name: `
              ${item[1].name}
              (
                ${item[1].morph ? item[1].morph + "/" : ""}${
              item[1].gender === "female"
                ? "암"
                : item[1].gender === "male"
                ? "수"
                : "미구분"
            }
              )
            `,
          };
        });
      console.log("userPetList.value", userPetList.value);
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
});
watch(userPetList.value, (newValue) => {
  console.log(newValue);
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
  console.log("사육장에 개체 등록 시도");
  console.log("등록하려는 개체 정보", selectedPet.value, props.id);
  const registDate = new Date();
  onDialogOK({
    pet: selectedPet.value,
    cageId: props.id,
    index: props.index,
  });
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
