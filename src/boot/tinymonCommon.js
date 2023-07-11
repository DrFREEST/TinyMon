import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

const $q = useQuasar();
const router = useRouter();

// ======================================================================
// 입력받은 자릿수만큼 랜덤 문자열을 반환
// ======================================================================
const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * length));
  }
  return result;
};


export { generateRandomString }
