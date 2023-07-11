import { Timestamp, addDoc, collection, collectionGroup, doc, endBefore, getDoc, getDocs, getFirestore, limit, orderBy, query, runTransaction, setDoc, startAfter, startAt, where } from 'firebase/firestore';
import { appStorage, auth, firebaseApp, googleProvider } from 'src/boot/firebase'

import { generateRandomString } from "src/js/common/tinymonCommon";
import { ref } from 'vue'
import { signInWithPopup } from 'firebase/auth'

// =============================================================================
// Boards 관련 함수 정의
// =============================================================================
const db = getFirestore(firebaseApp);

// 게시판 생성 함수
const createBoard = async (boardName) => {
  console.log("createBoard", boardName)
  const boardId = Date.now() + "_" + generateRandomString(20);
  const boardDbRef = doc(db, 'boards', boardId)
  console.log("boardDbRef", boardDbRef)
  const boardData = {
    id: boardId,
    name: boardName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    creator: auth.currentUser.uid ? auth.currentUser.uid : null,
    updater: auth.currentUser.uid ? auth.currentUser.uid : null,
    order: 0,
  }
  await setDoc(boardDbRef, boardData, { merge: true });
}
// 생성된 게시판 목록 가져오기 함수
const getBoards = async () => {
  const boardListArray = ref([]);
  const boardDbRef = collection(db, 'boards');
  const boardListSnapshot = await getDocs(boardDbRef);
  boardListSnapshot.forEach((doc) => {
    boardListArray.value.push(doc.data());
  });

  console.log("getBoards", boardListArray.value)


  return boardListArray.value;
}
// 게시판 게시글 목록 가져오기 함수
const loadBoardContentList = async (boardName, startPageIndex, contentLength, orderByKey, orderByValue) => {
  const targetBoardRef = collection(db, 'boards');
  const q = query(targetBoardRef, where('name', "==", boardName));
  const targetBoardSnapshot = await getDocs(q);
  const targetBoardId = targetBoardSnapshot.docs[0].id;
  targetBoardSnapshot.forEach((doc) => {
    console.log("loadBoardContentList", doc.id, " => ", doc.data());
  });
  // console.log("getBoardList", targetBoardId)

  const boardContentListDbRef = collection(db, `boardContents`);
  // boardContentListDbRef의 하위 항목이 있을 경우
  // startIndex, contentLength 있을 경우 startIndex부터 contentLength개 만큼 데이터를 가져온다.
  // 없을 경우 전체 데이터를 가져온다.
  const boardContentListDbRefQuery = query(
    boardContentListDbRef,
    where('boardId', '==', targetBoardId),
    orderBy(orderByKey, orderByValue),
    endBefore(startPageIndex * contentLength),
    // startAfter((startPageIndex - 1) * contentLength),
    limit(contentLength),
    // limit(contentLength),
    // endBefore(100)
  )
  // console.log("targetBoardId", targetBoardId)
  // const boardContentListDbRefQuery = query(
  //   boardContentListDbRef,
  //   where('boardId', '==', targetBoardId),
  //   orderBy(orderByKey, orderByValue),
  //   startAt(0),
  //   // limit(contentLength),
  //   // endBefore(100)
  // )
  const boardContentListSnapshot = await getDocs(boardContentListDbRefQuery);
  const boardContentList = [];
  boardContentListSnapshot.forEach((doc) => {
    boardContentList.push(doc.data());
  });

  return boardContentList;
};
// 게시판 게싣글 총 목록 수를 가져오는 함수
const getBoardContentListTotalCount = async (boardName) => {
  const targetBoardRef = collection(db, 'boards');
  const q = query(targetBoardRef, where('name', "==", boardName));
  const targetBoardSnapshot = await getDocs(q);
  const targetBoardId = targetBoardSnapshot.docs[0].id;
  const boardContentListDbRef = collection(db, `boardContents`);
  const boardContentListDbRefQuery = query(
    boardContentListDbRef,
    where('boardId', '==', targetBoardId),
  )
  const boardContentListSnapshot = await getDocs(boardContentListDbRefQuery);
  const boardContentListTotalCount = boardContentListSnapshot.size;
  return boardContentListTotalCount;
}

// 게시판 이름으로 게시판 ID 가져오기 함수
const getBoardId = async (boardName) => {
  const targetBoardRef = collection(db, 'boards');
  const q = query(targetBoardRef, where('name', "==", boardName));

  const targetBoardSnapshot = await getDocs(q);
  const targetBoard = targetBoardSnapshot.docs[0].id;
  console.log("getBoardId", targetBoard)
  return targetBoard;
}

// 게시판 글 등록하기 함수
const createBoardContentToDatabase = async (boardName, boardContent) => {
  const boardId = await getBoardId(boardName);
  const boardContentId = Date.now() + "_" + generateRandomString(20);
  const boardContentDbRef = doc(db, `boardContents`, boardContentId);
  const boardContentData = {
    id: boardContentId,
    boardId: boardId,
    boardName: boardContent.name,
    title: boardContent.title,
    content: boardContent.content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    creator: auth.currentUser.uid ? auth.currentUser.uid : null,
    updater: auth.currentUser.uid ? auth.currentUser.uid : null,
    viewCount: 0,
    likeCount: 0,
  }
  await setDoc(boardContentDbRef, boardContentData, { merge: true });
}

// 게시글 상세보기 함수
const loadBoardContentDetail = async (boardName, boardContentId) => {
  // 게시글 목록에서 게시글 ID로 게시글 상세정보 가져오기
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('id', '==', boardContentId)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const boardContent = boardContentSnapshot.docs[0].data();
  console.log("loadBoardContentDetail", boardContent)
  return boardContent;
};
// 게시글 viewCount 증가 함수
const increaseBoardContentViewCount = async (boardName, boardContentId) => {
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('id', '==', boardContentId)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const boardContent = boardContentSnapshot.docs[0].data();
  boardContent.viewCount = boardContent.viewCount + 1;
  await setDoc(boardContentDbRef, boardContent, { merge: true });
};
// 게시글 likeCount 증가 함수
const increaseBoardContentLikeCount = async (boardName, boardContentId) => {
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('id', '==', boardContentId)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const boardContent = boardContentSnapshot.docs[0].data();
  boardContent.likeCount = boardContent.likeCount + 1;
  await setDoc(boardContentDbRef, boardContent, { merge: true });
};
// 게시글 likeCount 감소 함수
const decreaseBoardContentLikeCount = async (boardName, boardContentId) => {
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('id', '==', boardContentId)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const boardContent = boardContentSnapshot.docs[0].data();
  boardContent.likeCount = boardContent.likeCount - 1;
  await setDoc(boardContentDbRef, boardContent, { merge: true });
};
// 게시글 삭제 함수
const deleteBoardContent = async (boardName, boardContentId) => {
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('id', '==', boardContentId)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const boardContent = boardContentSnapshot.docs[0].data();
  await deleteDoc(boardContentDbRef, boardContent, { merge: true });
};
// 게시글 수정 함수
const updateBoardContent = async (boardName, boardContentId, boardContent) => {
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('id', '==', boardContentId)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const boardContentData = boardContentSnapshot.docs[0].data();
  boardContentData.title = boardContent.title;
  boardContentData.content = boardContent.content;
  boardContentData.updateDate = Date.now();
  boardContentData.updater = auth.currentUser.uid ? auth.currentUser.uid : null;
  await setDoc(boardContentDbRef, boardContentData, { merge: true });
};
// 게시글 검색 함수(제목과 일치하거나 내용과 일치하는 게시글 검색)
const searchBoardContent = async (boardName, searchKeyword) => {
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('boardName', '==', boardName),
    where('title', '==', searchKeyword),
    where('content', '==', searchKeyword)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const resultBoardContentList = [];
  boardContentSnapshot.forEach((doc) => {
    resultBoardContentList.push(doc.data());
  });
  return resultBoardContentList;
};
// 게시글 신고하기 함수
const reportBoardContent = async (boardName, boardContentId, reportContent) => {
  const boardContentDbRef = collection(db, `boardContents`);
  const boardContentDbRefQuery = query(
    boardContentDbRef,
    where('id', '==', boardContentId)
  )
  const boardContentSnapshot = await getDocs(boardContentDbRefQuery);
  const boardContentData = boardContentSnapshot.docs[0].data();
  boardContentData.reportContent = reportContent;
  await setDoc(boardContentDbRef, boardContentData, { merge: true });
};

export { createBoard, getBoards, loadBoardContentList, getBoardId, createBoardContentToDatabase, getBoardContentListTotalCount }