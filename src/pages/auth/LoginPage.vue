<template>
  <q-page class="tw-p-[1.5rem] tw-grid tw-grid-cols-[1] tw-gap-[1rem]">
    <h1 class="tw-flex tw-items-center tw-justify-center tw-flex-[1_1_auto]">
      <q-img
        :src="'images/SVG/logo-main.svg'"
        class="tw-w-[10rem] tw-h-[10rem] tw-mx-auto tw-mb-[1rem]] tw-block"
        position="center"
        fit="contain"
      ></q-img>
    </h1>
    <section>
      <q-btn
        class="firebaseui-idp-button mdl-button mdl-js-button mdl-button--raised firebaseui-idp-google firebaseui-id-idp-button tw-w-full tw-max-w-[26.25rem] tw-mx-auto tw-text-black tw-flex"
        data-provider-id="google.com"
        color="white"
        label-color="black"
        style="background-color: #ffffff"
        data-upgraded=",MaterialButton"
        @click="handleSignIn"
      >
        <span class="firebaseui-idp-icon-wrapper"
          ><img
            class="firebaseui-idp-icon"
            alt=""
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" /></span
        ><span
          class="firebaseui-idp-text firebaseui-idp-text-long tw-text-[#000000]"
          >Google 계정으로 시작하기</span
        >
      </q-btn>
      <!-- <q-btn @click="handleSignIn" class="tw-col-span-4" tag="a"
        >Google 계정으로 시작하기</q-btn
      > -->
      <q-btn
        @click="handleSignOut"
        class="tw-col-span-full tw-w-full tw-mt-[1rem] tw-w-full tw-max-w-[26.25rem] tw-mx-auto tw-text-black tw-flex"
        >로그아웃</q-btn
      >
      <!-- <q-btn @click="handleWithdraw" class="tw-col-span-2">회원탈퇴 예약</q-btn> -->
    </section>
    <q-footer class="tw-text-center"
      >© 2023 TinyMon. All rights reserved.</q-footer
    >
  </q-page>
</template>
<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { auth as bootAuth } from "boot/firebase";
import { userSignIn, userSignOut, reserveWithdrawal } from "src/js/auth/auth";
import { getAuth, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { VueFire, VueFireAuth, useCurrentUser } from "vuefire";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

const router = useRouter();
const appAuth = getAuth();
const auth = VueFireAuth();

const signInWithGoogle = async () => {
  const result = await FirebaseAuthentication.signInWithGoogle();
  console.log(result);
  return result;
};

onMounted(() => {});

// 구글 로그인
const handleSignIn = async () => {
  const loginResult = await userSignIn().then(async (res) => {
    console.log("로그인 성공", res);
    bootAuth.onAuthStateChanged((res) => {
      console.log("changed Auth", res);
    });
    router.push("/breeding");
    2;
    return res;
  });
};
// 로그아웃
const handleSignOut = async () => {
  try {
    await userSignOut();
    router.push("/auth");
  } catch (error) {
    console.error(error);
  }
};
// 회원탈퇴
const handleWithdraw = async () => {
  try {
    await reserveWithdrawal();
    router.push("/auth");
  } catch (error) {
    console.error(error);
  }
};
</script>
