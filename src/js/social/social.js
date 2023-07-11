import { Timestamp, addDoc, collection, collectionGroup, doc, endBefore, getDoc, getDocs, getFirestore, limit, orderBy, query, runTransaction, setDoc, startAfter, startAt, where } from 'firebase/firestore';
import { appStorage, auth, firebaseApp, googleProvider } from 'src/boot/firebase'

import { generateRandomString } from "src/js/common/tinymonCommon";
import { ref } from 'vue'
import { signInWithPopup } from 'firebase/auth'
// =============================================================================
// Social 관련 함수 정의
// =============================================================================
const commonDb = appDatabase;
const storeDb = getFirestore(firebaseApp);

// 선택 유저 정보 확인 함수
const getSelectedUserInfo = async (userId) => {
  const selectedUserInfo = ref({});
  const selectedUserDbRef = doc(commonDb, 'users', userId);
  const selectedUserSnapshot = await getDoc(selectedUserDbRef);
  if (selectedUserSnapshot.exists()) {
    selectedUserInfo.value = selectedUserSnapshot.data();
  }
  return selectedUserInfo.value;
}
// 선택 유저의 게시글 목록 가져오기 함수
const loadSelectedUserBoardContentList = async (userId, startIndex, contentLength) => {
  const selectedUserBoardContentList = ref([]);
  const selectedUserDbRef = doc(commonDb, 'users', userId);
  const selectedUserSnapshot = await getDoc(selectedUserDbRef);
  if (selectedUserSnapshot.exists()) {
    const selectedUserBoardContentListDbRef = collection(storeDb, `users/${userId}/boardContents`);
    const selectedUserBoardContentListDbRefQuery = query(
      selectedUserBoardContentListDbRef,
      orderBy('createAt', 'desc'),
      startAt(startIndex),
      endBefore(startIndex + contentLength)
    )
    const selectedUserBoardContentListSnapshot = await getDocs(selectedUserBoardContentListDbRefQuery);
    selectedUserBoardContentListSnapshot.forEach((doc) => {
      selectedUserBoardContentList.value.push(doc.data());
    });
  }
  return selectedUserBoardContentList.value;
}
// 선택 유저의 팔로워 목록 가져오기 함수
const loadSelectedUserFollowerList = async (userId, startIndex, contentLength) => {
  const selectedUserFollowerList = ref([]);
  const selectedUserDbRef = doc(commonDb, 'users', userId);
  const selectedUserSnapshot = await getDoc(selectedUserDbRef);
  if (selectedUserSnapshot.exists()) {
    const selectedUserFollowerListDbRef = collection(storeDb, `users/${userId}/followers`);
    const selectedUserFollowerListDbRefQuery = query(
      selectedUserFollowerListDbRef,
      orderBy('createAt', 'desc'),
      startAt(startIndex),
      endBefore(startIndex + contentLength)
    )
    const selectedUserFollowerListSnapshot = await getDocs(selectedUserFollowerListDbRefQuery);
    selectedUserFollowerListSnapshot.forEach((doc) => {
      selectedUserFollowerList.value.push(doc.data());
    });
  }
  return selectedUserFollowerList.value;
}
// 선택 유저의 팔로잉 목록 가져오기 함수
const loadSelectedUserFollowingList = async (userId, startIndex, contentLength) => {
  const selectedUserFollowingList = ref([]);
  const selectedUserDbRef = doc(commonDb, 'users', userId);
  const selectedUserSnapshot = await getDoc(selectedUserDbRef);
  if (selectedUserSnapshot.exists()) {
    const selectedUserFollowingListDbRef = collection(storeDb, `users/${userId}/followings`);
    const selectedUserFollowingListDbRefQuery = query(
      selectedUserFollowingListDbRef,
      orderBy('createAt', 'desc'),
      startAt(startIndex),
      endBefore(startIndex + contentLength)
    )
    const selectedUserFollowingListSnapshot = await getDocs(selectedUserFollowingListDbRefQuery);
    selectedUserFollowingListSnapshot.forEach((doc) => {
      selectedUserFollowingList.value.push(doc.data());
    });
  }
  return selectedUserFollowingList.value;
}
// 선택 유저의 보유 개체 목록 가져오기 함수
const loadSelectedUserPetList = async (userId, startIndex, contentLength) => {
  const selectedUserPetList = ref([]);
  const selectedUserDbRef = doc(commonDb, 'users', userId);
  const selectedUserSnapshot = await getDoc(selectedUserDbRef);
  if (selectedUserSnapshot.exists()) {
    const selectedUserPetListDbRef = collection(storeDb, `users/${userId}/Pets`);
    const selectedUserPetListDbRefQuery = query(
      selectedUserPetListDbRef,
      orderBy('createAt', 'desc'),
      startAt(startIndex),
      endBefore(startIndex + contentLength)
    )
    const selectedUserPetListSnapshot = await getDocs(selectedUserPetListDbRefQuery);
    selectedUserPetListSnapshot.forEach((doc) => {
      selectedUserPetList.value.push(doc.data());
    });
  }
  return selectedUserPetList.value;
}
// 선택 유저의 분양 등록 개체 목록 가져오기 함수
const loadSelectedUserAdoptList = async (userId, startIndex, contentLength) => {
  const selectedUserAdoptList = ref([]);
  const selectedUserDbRef = doc(commonDb, 'users', userId);
  const selectedUserSnapshot = await getDoc(selectedUserDbRef);
  if (selectedUserSnapshot.exists()) {
    const selectedUserAdoptListDbRef = collection(storeDb, `users/${userId}/adopts`);
    const selectedUserAdoptListDbRefQuery = query(
      selectedUserAdoptListDbRef,
      orderBy('createAt', 'desc'),
      startAt(startIndex),
      endBefore(startIndex + contentLength)
    )
    const selectedUserAdoptListSnapshot = await getDocs(selectedUserAdoptListDbRefQuery);
    selectedUserAdoptListSnapshot.forEach((doc) => {
      selectedUserAdoptList.value.push(doc.data());
    });
  }
  return selectedUserAdoptList.value;
}
// 선택한 유저와의 채팅 신청 함수
const requestChatWithSelectedUser = async (userId, selectedUserId) => {
  const chatRoomId = generateRandomString(20);
  const chatRoomDbRef = doc(commonDb, 'chatRooms', chatRoomId);
  const chatRoomSnapshot = await getDoc(chatRoomDbRef);
  if (chatRoomSnapshot.exists()) {
    return false;
  } else {
    const chatRoomData = {
      chatRoomId: chatRoomId,
      createAt: Timestamp.now(),
      users: [userId, selectedUserId],
      lastMessage: {
        content: '',
        createAt: Timestamp.now(),
        sender: userId,
        readUsers: [userId],
        readCount: 0
      }
    };
    await setDoc(chatRoomDbRef, chatRoomData);
    return true;
  }
}

export {
  getSelectedUserInfo,
  loadSelectedUserBoardContentList,
  loadSelectedUserFollowerList,
  loadSelectedUserFollowingList,
  loadSelectedUserPetList,
  loadSelectedUserAdoptList,
  requestChatWithSelectedUser
}