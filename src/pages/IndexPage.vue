<!-- <template>
  <q-page class="flex flex-center">
    <img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    >
  </q-page>
</template> -->

<script setup>
import { ref } from "vue";
import { auth } from "boot/firebase";
import { useRouter } from "vue-router";
console.log(auth);
const isAuthenticated = ref(false);
const router = useRouter();
// auth.currentUser.uid 값이 없으면 로그인 페이지로 이동
if (!auth.currentUser) {
  console.log("로그인 안됨");
  router.push("/auth");
} else {
  isAuthenticated.value = true;
  console.log("로그인 됨", auth.currentUser.uid);
  router.push("/breeding");
}
</script>
