<template>
  <q-page class="tw-p-[1.5rem] tw-grid tw-grid-cols-[1] tw-gap-[1rem]">
    <h1 class="tw-flex tw-items-center tw-justify-center tw-flex-[1_1_auto]">
      <q-img
        :src="'src/assets/images/SVG/logo-main.svg'"
        class="tw-w-[10rem] tw-h-[10rem] tw-mx-auto tw-mb-[1rem]] tw-block"
        position="center"
        fit="contain"
      ></q-img>
    </h1>
    <q-form class="tw-grid tw-gap-[1rem] tw-grid-cols-4 tw-auto-rows-min">
      <q-input
        outlined
        rounded
        type="email"
        label="이메일 주소 입력"
        placeholder="example@example.com"
        class="tw-col-span-4"
        autocomplete="off"
        v-model="email"
        required
      />
      <q-input
        outlined
        rounded
        type="password"
        label="패스워드 입력"
        placeholder="패스워드를 입력해주세요"
        class="tw-col-span-4"
        autocomplete="off"
        v-model="password"
        required
      />
      <q-input
        outlined
        rounded
        type="password"
        label="패스워드 확인"
        placeholder="패스워드를 다시 입력해주세요"
        class="tw-col-span-4"
        autocomplete="off"
        v-model="confirmPassword"
        required
      />
      <q-btn type="submit" class="tw-col-span-2" @click="handleSignup"
        >회원가입</q-btn
      >
      <q-btn @click="$router.push('/login')" class="tw-col-span-2"
        >로그인</q-btn
      >
    </q-form>
    <q-footer class="tw-text-center"
      >© 2023 TinyMon. All rights reserved.</q-footer
    >
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { signup } from "boot/firebase.js";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const router = useRouter();

const handleSignup = async () => {
  if (password.value !== confirmPassword.value) {
    // 비밀번호 확인이 일치하지 않을 경우 처리
    return;
  }

  const result = await signup(email.value, password.value);
  if (result) {
    // 회원가입 성공 시 리다이렉트 또는 처리할 작업 추가
    console.log(result);
    router.push("/auth/");
  } else {
    // 회원가입 실패 시 처리
  }
};
</script>
