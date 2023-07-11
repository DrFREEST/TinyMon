<template>
  <div>
    <h1>Withdraw Page</h1>
    <p>정말로 계정을 삭제하시겠습니까?</p>
    <button @click="withdraw">계정 삭제</button>
  </div>
</template>

<script setup>
import { auth } from "boot/firebase.js";
import { getDatabase, ref as dbRef, remove } from "firebase/database";
import { useRouter } from "vue-router";

const router = useRouter();

const withdraw = async () => {
  try {
    const user = auth.currentUser;

    // Firebase 실시간 데이터베이스에서 사용자 데이터 삭제
    const db = getDatabase();
    const usersRef = dbRef(db, "users/" + user.uid);
    console.log("db 조회 성공", usersRef, user.uid);
    // usersRef 삭제
    await remove(usersRef);

    // 사용자 계정 삭제
    await user.delete();

    // 계정 삭제 후 로그아웃
    await auth.signOut();
    router.push("/login");
  } catch (error) {
    console.error(error);
  }
};
</script>
