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
// 유저의 채팅방 목록 가져오기 함수
const loadUserChatRoomList = async (userId) => {
  const userChatRoomList = ref([]);
  const userChatRoomListDbRef = collection(storeDb, `users/${userId}/chatRooms`);
  const userChatRoomListSnapshot = await getDocs(userChatRoomListDbRef);
  userChatRoomListSnapshot.forEach((doc) => {
    userChatRoomList.value.push(doc.data());
  });
  return userChatRoomList.value;
}
// 채팅방 나가기 함수
const leaveChatRoom = async (userId, chatRoomId) => {
  const chatRoomDbRef = doc(storeDb, `chatRooms/${chatRoomId}`);
  const chatRoomSnapshot = await getDoc(chatRoomDbRef);
  if (chatRoomSnapshot.exists()) {
    const chatRoomData = chatRoomSnapshot.data();
    if (chatRoomData.userIds.length > 1) {
      const newChatRoomData = {
        ...chatRoomData,
        userIds: chatRoomData.userIds.filter((id) => id !== userId)
      }
      await setDoc(chatRoomDbRef, newChatRoomData);
    } else {
      await chatRoomDbRef.delete();
    }
  }
  const userChatRoomDbRef = doc(storeDb, `users/${userId}/chatRooms/${chatRoomId}`);
  await userChatRoomDbRef.delete();
}
// 채팅방 생성 함수
const createChatRoom = async (userId, selectedUserId) => {
  const chatRoomId = generateRandomString(20);
  const chatRoomData = {
    userIds: [userId, selectedUserId],
    createAt: Timestamp.now()
  }
  const chatRoomDbRef = doc(storeDb, `chatRooms/${chatRoomId}`);
  await setDoc(chatRoomDbRef, chatRoomData);
  const userChatRoomDbRef = doc(storeDb, `users/${userId}/chatRooms/${chatRoomId}`);
  await setDoc(userChatRoomDbRef, chatRoomData);
  const selectedUserChatRoomDbRef = doc(storeDb, `users/${selectedUserId}/chatRooms/${chatRoomId}`);
  await setDoc(selectedUserChatRoomDbRef, chatRoomData);
}
// 채팅방 메시지 목록 가져오기 함수
const loadChatRoomMessageList = async (chatRoomId, lastMessageId) => {
  const chatRoomMessageList = ref([]);
  const chatRoomMessageListDbRef = collection(storeDb, `chatRooms/${chatRoomId}/messages`);
  let chatRoomMessageListQuery = query(chatRoomMessageListDbRef, orderBy('createAt', 'desc'), limit(20));
  if (lastMessageId) {
    const lastMessageDbRef = doc(storeDb, `chatRooms/${chatRoomId}/messages/${lastMessageId}`);
    const lastMessageSnapshot = await getDoc(lastMessageDbRef);
    if (lastMessageSnapshot.exists()) {
      const lastMessageData = lastMessageSnapshot.data();
      chatRoomMessageListQuery = query(chatRoomMessageListDbRef, orderBy('createAt', 'desc'), limit(20), startAfter(lastMessageData.createAt));
    }
  }
  const chatRoomMessageListSnapshot = await getDocs(chatRoomMessageListQuery);
  chatRoomMessageListSnapshot.forEach((doc) => {
    chatRoomMessageList.value.push(doc.data());
  });
  return chatRoomMessageList.value;
}
// 채팅방 메시지 저장 함수
const saveChatRoomMessage = async (chatRoomId, userId, message) => {
  const messageId = generateRandomString(20);
  const messageData = {
    userId: userId,
    message: message,
    createAt: Timestamp.now()
  }
  const chatRoomMessageDbRef = doc(storeDb, `chatRooms/${chatRoomId}/messages/${messageId}`);
  await setDoc(chatRoomMessageDbRef, messageData);
}
// 채팅방 메시지 삭제 함수
const deleteChatRoomMessage = async (chatRoomId, messageId) => {
  const chatRoomMessageDbRef = doc(storeDb, `chatRooms/${chatRoomId}/messages/${messageId}`);
  await chatRoomMessageDbRef.delete();
}
// 채팅방 메시지 수정 함수
const updateChatRoomMessage = async (chatRoomId, messageId, message) => {
  const chatRoomMessageDbRef = doc(storeDb, `chatRooms/${chatRoomId}/messages/${messageId}`);
  await setDoc(chatRoomMessageDbRef, { message: message }, { merge: true });
}
// 채팅방 메시지 읽음 처리 함수
const readChatRoomMessage = async (chatRoomId, userId) => {
  const chatRoomDbRef = doc(storeDb, `chatRooms/${chatRoomId}`);
  const chatRoomSnapshot = await getDoc(chatRoomDbRef);
  if (chatRoomSnapshot.exists()) {
    const chatRoomData = chatRoomSnapshot.data();
    if (chatRoomData.userIds.length > 1) {
      const newChatRoomData = {
        ...chatRoomData,
        readUserIds: chatRoomData.readUserIds ? [...chatRoomData.readUserIds, userId] : [userId]
      }
      await setDoc(chatRoomDbRef, newChatRoomData);
    }
  }
}

export {
  loadUserChatRoomList,
  leaveChatRoom,
  createChatRoom,
  loadChatRoomMessageList,
  saveChatRoomMessage,
  deleteChatRoomMessage,
  updateChatRoomMessage,
  readChatRoomMessage
}