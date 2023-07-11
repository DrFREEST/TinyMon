<template>
  <div class="wrapper">
    <router-view v-if="isAuthenticated" />
    <div v-else>
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect } from "vue";
import { auth } from "boot/firebase.js";
import { useQuasar } from "quasar";

const isAuthenticated = ref(false);

watchEffect(() => {
  auth.onAuthStateChanged((user) => {
    console.log("==========================================================");
    console.log("user", user);
    console.log("==========================================================");
    isAuthenticated.value = user !== null;
  });
});
</script>
