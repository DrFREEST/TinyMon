<template>
  <div>
    <h1>Signup Page</h1>
    <form @submit.prevent="signup">
      <div>
        <label for="signupEmail">Email:</label>
        <input type="email" id="signupEmail" v-model="signupEmail" required />
      </div>
      <div>
        <label for="signupPassword">Password:</label>
        <input
          type="password"
          id="signupPassword"
          v-model="signupPassword"
          required
        />
      </div>
      <button type="submit">회원가입</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth, googleProvider, database } from "boot/firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbref, set } from "firebase/database";

const router = useRouter();

const signupEmail = ref("");
const signupPassword = ref("");

const signup = async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      signupEmail.value,
      signupPassword.value
    ).then((userCredential) => {
      // Signed in
      const userData = userCredential.user;
      console.log("회원가입 성공", userData);
      const db = getDatabase();
      const usersRef = dbref(db, "users/");
      console.log("db 조회 성공", usersRef, userData.uid);
      set(usersRef, {
        [userData.uid]: {
          // 구글 로그인 시 받아오는 정보
          email: userData.email,
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          phoneNumber: userData.phoneNumber,
          emailVerified: userData.emailVerified,
          metadata: userData.metadata,
          passwordHash: userData.reloadUserInfo.passwordHash,
          passwordUpdateAt: userData.reloadUserInfo.passwordUpdatedAt,
          accessToken: userData.stsTokenManager.accessToken,
          // 앱에서 사용하게 될 추가 정보
          userCustomData: {
            // 소셜 정보
            socialAccounts: [
              {
                socialName: "google",
                socialId: userData.uid,
                socialEmail: userData.email,
                socialPhotoURL: userData.photoURL,
              },
              {
                socialName: "kakao",
                socialId: "",
                socialEmail: "",
                socialPhotoURL: "",
              },
              {
                socialName: "naver",
                socialId: "",
                socialEmail: "",
                socialPhotoURL: "",
              },
              {
                socialName: "facebook",
                socialId: "",
                socialEmail: "",
                socialPhotoURL: "",
              },
              {
                socialName: "twitter",
                socialId: "",
                socialEmail: "",
                socialPhotoURL: "",
              },
              {
                socialName: "github",
                socialId: "",
                socialEmail: "",
                socialPhotoURL: "",
              },
              {
                socialName: "apple",
                socialId: "",
                socialEmail: "",
                socialPhotoURL: "",
              },
            ],
            // 개인 정보
            profileInfo: {
              level: 1,
              point: 0,
              realName: "",
              nickName: "",
              gender: "",
              birth: "",
              phone: "",
              // 주소 정보
              address: {
                address: "",
                addressDetail: "",
                zipCode: "",
              },
              profilePhoto: [],
              profilePhotoURL: [],
            },
            // 사업자 정보
            businessLicense: {
              license: false,
              businessName: "",
              ownerName: "",
              licenseNumber: "",
              licensePhoto: [],
              licensePhotoURL: [],
              address: {
                address: "",
                addressDetail: "",
                zipCode: "",
              },
              tel: "",
              fax: "",
              businessType: "",
            },
            // 커뮤니케이션 정보(팔로우, 팔로워, 쪽지, 알림, 채팅방, 게시글, 댓글, 좋아요, 북마크, 차단, 신고)
            communication: {
              follow: [],
              follower: [],
              message: [],
              notice: [],
              chatRoom: [],
              post: [],
              comment: [],
              like: [],
              bookmark: [],
              blockUsers: [],
              report: [],
            },
            // 활동 정보(관심 개체 내역, 관심 물품 내역, 분양 내역, 입양 내역, 메이팅 내역, 물품 거래 내역)
            activity: {
              interestPets: [],
              interestProduct: [],
              adoption: [],
              meeting: [],
              product: [],
            },
            // 사육 정보(사육장 목록, 개체 목록, 알 목록)
            breeding: {
              breedingList: [],
              petList: [],
              eggList: [],
            },
            // 설정 정보(알림 설정, 언어 설정, 앱 설정)
            setting: {
              notification: [],
              language: [],
              app: [],
            },
          },
        },
      });
      router.push("/login");
      // ...
    });
    // 회원가입 성공 시 리다이렉트 또는 처리할 작업 추가
  } catch (error) {
    console.error(error);
  }
};
</script>
