<template>
  <div>
    <h1>Breeding Page</h1>
    <router-view class="container" />
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

const breedingPens = reactive([
  { grid: [], id: 1 },
  { grid: [], id: 2 },
  { grid: [], id: 3 },
]);

const breedingRegist = () => {
  router.push("/breeding/regist");
};

const deleteBreedingPen = (index) => {
  breedingPens.splice(index, 1);
};

const addObject = (pen, cell) => {
  const newObject = {
    id: generateObjectId(),
    name: "New Object",
    description: "Object Description",
  };
  cell.object = newObject;
};

const handleDrop = (pen, cell) => {
  if (!cell.object) {
    const object = pen.grid.find((c) => c.object && c.object.id === cell.id);
    if (object) {
      object.object = null;
      cell.object = object.object;
    }
    cell.object = cell.object || object;
  }
};

const generateObjectId = () => {
  const timestamp = new Date().getTime().toString(16); // 현재 시간을 기반으로 16진수로 변환
  const randomString = Math.random().toString(36).substr(2, 5); // 랜덤한 문자열 생성
  const objectId = timestamp + randomString; // 현재 시간과 랜덤 문자열을 조합하여 고유한 ID 생성
  return objectId;
};
</script>
