import { GoogleAuthProvider, connectAuthEmulator, getAuth, signInWithCredential, signInWithCustomToken, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth, firebaseApp, googleProvider } from 'src/boot/firebase'
import { doc, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore'
import { getAnalytics, setUserId } from 'firebase/analytics'

import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Preferences } from "@capacitor/preferences";
import { ref } from 'vue'

// =============================================================================
// Auth 관련 함수 정의
// =============================================================================
const db = getFirestore(firebaseApp)
const user = ref(localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")).user : null)
const userDocRef = doc(db, `users/${user.value ? user.value.uid : null}`)


// 로그인 여부 확인
const isSignedIn = () => {
  console.log("isSignedIn", user)
  return user.value ? true : false;
}
// 로그인한 사용자 정보 조회
const getCurrentUserInfo = () => {
  return user.value;
}
// 로그인한 사용자의 상태 변화 감지
const onAuthStateChanged = (callback) => {
  return onAuthStateChanged(auth, callback);
}
// 로그인한 사용자의 uid로 DB에서 사용자 정보 조회
const getUserInfoFromDatabase = async (uid) => {
  console.log("getUserInfoFromDatabase", uid)
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    console.log("DB에서 사용자 정보를 조회합니다.", userDoc.data());
    if (userDoc.exists()) {
      console.log("DB에서 사용자 정보를 조회하였습니다.");
      return userDoc.data();
    } else {
      console.log("DB에서 사용자 정보를 조회하지 못하였습니다.");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}
// 로그인
const userSignIn = async (response) => {
  try {
    // const signInResult = await signInWithRedirect(auth, googleProvider).then((result) => {
    //   console.log("로그인되었습니다.로그인되었습니다.", result);
    // });
    const signInResult = await FirebaseAuthentication.signInWithGoogle().then(async (signResult) => {
      console.log("로그인되었습니다.로그인되었습니다.", signResult, auth, FirebaseAuthentication);
      // await Preferences.set({ key: "currentUser", value: JSON.stringify(signResult) });
      console.log("로그인되었습니다.", signResult, auth, (await FirebaseAuthentication.getCurrentUser()).user.uid)
      const userDocRef = doc(db, 'users', signResult.user.uid);
      console.log("로그인되었습니다.", signResult.user.uid);
      const currentUser = await FirebaseAuthentication.getCurrentUser().then(async (currentUserResult) => {
        console.log("currentUser", currentUserResult);
        const currentUserToken = await FirebaseAuthentication.getIdToken().then(async (currentUserTokenResult) => {
          console.log("currentUserToken", currentUserTokenResult);
          console.log("FirebaseAuthentication.AuthCredential()", signResult.credential);
          const googleCredential = GoogleAuthProvider.credential(signResult.credential.idToken);
          console.log("googleCredential", googleCredential)
          await signInWithCredential(auth, googleCredential).then(async (signInWithCredentialResult) => {
            console.log("signInWithCredentialResult", signInWithCredentialResult);
            // 로컬 스토리지에 사용자 정보 저장
            localStorage.setItem("currentUser", JSON.stringify(signResult));
            console.log("JSON.stringify(result).profile.aud", JSON.stringify(signResult.additionalUserInfo.profile.aud));
            console.log("JSON.stringify(result).profile.azp", JSON.stringify(signResult.additionalUserInfo.profile.azp));

            const appAuth = getAuth();
            // user.value = result.user;
            // db에 사용자 정보가 없으면 db에 저장
            const userInfo = await getUserInfoFromDatabase(signResult.user.uid);
            console.log("appAuth", appAuth);
            if (!userInfo) {
              await registUserInfoToDatabase(signResult.user);
            } else {
              console.log("DB에 사용자 정보가 이미 존재합니다.");
            }
          });
        });
      });
      // return userInfo;
    });
  } catch (error) {
    console.error(error);
    return false;
  }
}
// 로그아웃
const userSignOut = async () => {
  try {
    // await auth.signOut();
    await FirebaseAuthentication.signOut();
    // 로컬 스토리지에 사용자 정보 삭제
    localStorage.removeItem("currentUser");
    console.log("로그아웃되었습니다.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
// 신규 사용자 정보를 Firestore에 저장
const registUserInfoToDatabase = async (user) => {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    console.log("신규 사용자 정보를 Firestore에 저장합니다.", user)
    const userData = {
      accessToken: user.credential.accessToken,
      // 활동 정보
      activity: {},
      // 사업자 정보
      business: {},
      // 커뮤니케이션 정보(팔로우, 팔로워, 쪽지, 알림, 채팅방, 게시글, 댓글, 좋아요, 북마크, 차단, 신고)
      communication: {},
      createdAt: Date.now(),
      // 구글 로그인 시 받아오는 정보
      displayName: user.user.displayName,
      email: user.user.email,
      emailVerified: user.user.emailVerified,
      // phoneNumber: user.phoneNumber,
      photoURL: user.user.photoURL,
      // 개인 정보
      profile: {},
      // 설정 정보(알림 설정, 언어 설정, 앱 설정)
      setting: {},
      // 추가적인 유저 정보를 필요에 따라 저장
      uid: user.user.uid,
      updatedAt: Date.now(),
    };
    await setDoc(userDocRef, userData, { merge: true });
    console.log("신규 사용자 정보가 Firestore에 저장되었습니다.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
// 회원 탈퇴 예약
const reserveWithdrawal = async () => {
  try {
    const currentUserDataRef = doc(db, 'users', user.value.uid);
    const currentUserDataSnapshot = await getDoc(currentUserDataRef);
    const currentUserData = currentUserDataSnapshot.data();
    currentUserData["deletedAt"] = new Date().toISOString();
    await setDoc(currentUserDataRef, currentUserData);
    console.log("회원 탈퇴 예약이 완료되었습니다.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
// 탈퇴 예약 회원인지 확인
const isReservedWithdrawal = async (user) => {
  try {
    const currentUserDataRef = doc(db, 'users', user.value.uid);
    const currentUserDataSnapshot = await getDoc(currentUserDataRef);
    const currentUserData = currentUserDataSnapshot.data();
    if (currentUserData["deletedAt"]) {
      console.log("회원 탈퇴 예약 회원입니다.");
      return true;
    } else {
      console.log("회원 탈퇴 예약 회원이 아닙니다.");
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}
// 탈퇴 예약 취소
const cancelWithdrawal = async (user) => {
  try {
    const currentUserDataRef = doc(db, 'users', user.value.uid);
    const currentUserDataSnapshot = await getDoc(currentUserDataRef);
    const currentUserData = currentUserDataSnapshot.data();
    delete currentUserData["deletedAt"];
    await setDoc(currentUserDataRef, currentUserData);
    console.log("회원 탈퇴 예약이 취소되었습니다.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// =============================================================================
export {
  userDocRef,
  userSignIn,
  userSignOut,
  isSignedIn,
  registUserInfoToDatabase,
  reserveWithdrawal,
  cancelWithdrawal,
}
