import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { appStorage, auth, firebaseApp, googleProvider } from 'src/boot/firebase'
import { deleteObject, getDownloadURL, getMetadata, getStorage, list, listAll, ref as storageRef, updateMetadata, uploadBytes, uploadBytesResumable, uploadString } from 'firebase/storage';

import { get } from 'firebase/database';
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

// const $q = useQuasar();
// const router = useRouter();

// ======================================================================
// 입력받은 자릿수만큼 랜덤 문자열을 반환
// ======================================================================
const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
// ======================================================================
// 품종 & 산란일 & 인큐베이팅 온도로 부화일 계산
// crested gecko : (-7.5*온도) + 252.5 + 가감일(23도:3, 22도이하:4)
// leopard gecko : (-5*온도) + 200
// estimateHatchDate(품종, 산란일, 인큐베이팅 온도)
// 품종 : crested gecko, leopard gecko
// 산란일 : YYYY-MM-DD
// 인큐베이팅 온도 : crested gecko(18~26), leopard gecko(25~32)
// ======================================================================
const estimateHatchDate = (variety, layDate, incubationTemp) => {
  const layDateObject = new Date(layDate).getTime();
  const incubationDays = variety === "crested gecko" ? ((-7.5 * incubationTemp) + 252.5) : "leopard gecko" ? (-5 * incubationTemp) + 200 : null;
  const hatchDateTimestamp = layDateObject + (86400000 * incubationDays);
  const hatchDateObject = new Date(hatchDateTimestamp).getTime();
  const hatchDate = hatchDateObject;
  return hatchDate;
};
// ======================================================================
// 해칭일 임박일 산출
// estimateSoonHatchDate(estimateHatchDate)
// 당일 기준 해칭 예정일로부터 -7일 ~ 7일 사이이면 임박일로 표시
// ======================================================================
const estimateSoonHatchDate = (hatchDate) => {
  const hatchDateObject = new Date(hatchDate).getTime();
  const todayTimestamp = new Date().getTime();
  const soonHatchDateTimestamp = hatchDateObject - (86400000 * 7);
  const soonHatchDateTimestamp2 = hatchDateObject + (86400000 * 7);
  if (todayTimestamp >= soonHatchDateTimestamp && todayTimestamp <= soonHatchDateTimestamp2) {
    return true;
  } else {
    return false;
  }
};
// ======================================================================
// 산란 예상일 산출(최종 산란일로부터 4주 후)
// estimateSpawnDate(lastSpawnDate)
// ======================================================================
const estimateSpawnDate = (lastSpawnDate) => {
  const lastSpawnDateObject = new Date(lastSpawnDate).getTime();
  const spawnDateTimestamp = lastSpawnDateObject + (86400000 * 28);
  const spawnDateObject = new Date(spawnDateTimestamp);
  const spawnDate = spawnDateObject;
  return spawnDate;
};
// ======================================================================
// 산란일 임박일 산출
// calcSoonLayDate(lastSpawnDate)
// 당일 기준 마지막 산란 일로부터 28일~35일 사이이면 임박일로 표시
// ======================================================================
const estimateSoonSpawnDate = (spawnDate) => {
  const spawnDateObject = new Date(spawnDate).getTime();
  const todayTimestamp = new Date().getTime();
  const soonLayDateTimestamp = spawnDateObject + (86400000 * 28);
  const soonLayDateTimestamp2 = spawnDateObject + (86400000 * 35);
  if (todayTimestamp >= soonLayDateTimestamp && todayTimestamp <= soonLayDateTimestamp2) {
    return true;
  } else {
    return false;
  }
};
// ======================================================================
// 메이팅 예정기간 산출(최종 메이팅일로부터 1주 후 부터 ~ 2주 후 까지)
// calcMateDate(lastSpawnDate)
// ======================================================================
const estimateSoonMatingDate = (lastSpawnDate) => {
  const lastSpawnDateObject = new Date(lastSpawnDate).getTime();
  const todayTimestamp = new Date().getTime();
  const mateDateTimestamp = lastSpawnDateObject + (86400000 * 7);
  const mateDateTimestamp2 = lastSpawnDateObject + (86400000 * 14);
  if (mateDateTimestamp <= todayTimestamp && todayTimestamp <= mateDateTimestamp2) {
    return true;
  } else {
    return false;
  }
};
// ======================================================================
// 미디어 업로드
// uploadMedia(uploadCategory, uploadFiles, description, parentsId)
// uploadCategory : 업로드 카테고리(pets, users)
// description : 업로드 파일 설명
// uploadFiles : 업로드 파일 목록
// parentId : 상위 문서 아이디
// ======================================================================
const uploadMedia = async (uploadCategory, description, uploadFiles, parentId) => {
  console.log("미디어를 업로드합니다.", uploadCategory, description, uploadFiles, parentId);
  const db = getFirestore();
  const storage = getStorage();
  const mediaDocRef = doc(db, uploadCategory, parentId);
  const mediaDocSnap = await getDoc(mediaDocRef);
  const mediaDocData = mediaDocSnap.data();

  if (uploadCategory !== "boardContents" && uploadCategory !== "boardComments") {
    mediaDocData.medias = mediaDocData.medias ? mediaDocData.medias : [];
  }

  const mediaId = Date.now() + '_' + generateRandomString(20);

  const dataSet = {
    createdAt: Date.now(),
    description: description.value,
    files: [],
    mediaId: mediaId,
  }

  const downloadURLs = [];

  console.log(storage)

  uploadFiles.forEach((file) => {
    const mediaStorageRef = storageRef(storage, 'uploadFiles/' + uploadCategory + '/' + parentId + '/' + mediaId + '/' + file.name);
    const mediaThumbsStorageRef = storageRef(storage, 'uploadFiles/' + uploadCategory + '/' + parentId + '/' + mediaId + '/' + file.name);
    uploadBytes(mediaStorageRef, file).then((snapshot) => {
      getDownloadURL(snapshot.ref).then((downloadURL) => {
        downloadURLs.push(downloadURL);
        console.log("File available at", downloadURL);
        // file.name 을 . 으로 split 하여 파일명과 확장자를 분리
        const fileNameArray = file.name.split(".");
        // 제일 마지막 배열이 확장자
        const fileExtension = fileNameArray[file.name.split(".").length - 1];
        const fileNameGroup = fileNameArray.slice(0, fileNameArray.length - 1);
        // 나머지 매열의 갯수가 2개 이상일 경우 파일명에 . 이 포함되어 있으므로
        // 파일명을 다시 . 으로 join 하여 파일명을 구성
        const fileName = fileNameGroup.length > 1 ? fileNameGroup.join(".") : fileNameGroup[0];
        // 썸네일 생성(파일 타입이 svg, 비디오파일의 경우 썸네일 생성 안함)
        const thumbnailUrl = (file.type !== 'image/svg+xml' && file.type.indexOf('video') === -1) ? [
          `https://storage.googleapis.com/${storage._bucket.bucket}/uploadFiles/${uploadCategory}/${parentId}/${mediaId}/thumbs/${fileName}_128x128.${fileExtension}`,
          `https://storage.googleapis.com/${storage._bucket.bucket}/uploadFiles/${uploadCategory}/${parentId}/${mediaId}/thumbs/${fileName}_256x256.${fileExtension}`,
          `https://storage.googleapis.com/${storage._bucket.bucket}/uploadFiles/${uploadCategory}/${parentId}/${mediaId}/thumbs/${fileName}_512x512.${fileExtension}`,
          `https://storage.googleapis.com/${storage._bucket.bucket}/uploadFiles/${uploadCategory}/${parentId}/${mediaId}/thumbs/${fileName}_1024x1024.${fileExtension}`,
        ] : null;
        dataSet.files.push({
          downloadUrl: downloadURL,
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          thumbnailUrl: thumbnailUrl,
        })
        if (dataSet.files.length === uploadFiles.length) {
          if (uploadCategory !== "boardContents" && uploadCategory !== "boardComments") {
            mediaDocData.medias = mediaDocData.medias.concat(dataSet);
            console.log("mediaDocData", mediaDocData);
            setDoc(mediaDocRef, mediaDocData, { merge: true });
          }
          console.log(downloadURLs)
          return downloadURLs;
        }
      })
    });
  });
}
// ======================================================================
// 미디어 업로드(base64) 
// uploadMediaBase64(uploadCategory, uploadFiles, parentsId)
// uploadCategory : 업로드 카테고리(boardContents, boardComments)
// uploadFiles : 업로드 파일 목록
// parentId : 상위 문서 아이디
// ======================================================================
const uploadMediaBase64 = async (uploadCategory, uploadFile, parentId) => {
  // console.log("미디어를 업로드합니다.", uploadCategory, uploadFile, parentId);
  const db = getFirestore();
  const storage = getStorage();
  const mediaDocRef = doc(db, uploadCategory, parentId);
  const mediaDocSnap = await getDoc(mediaDocRef);
  const mediaDocData = mediaDocSnap.data();

  const mediaId = Date.now() + '_' + generateRandomString(20);

  const dataSet = {
    createdAt: Date.now(),
    files: [],
    mediaId: mediaId,
  }

  const downloadURLs = [];

  const mediaStorageRef = storageRef(storage, 'uploadFiles/' + uploadCategory + '/' + parentId + '/' + mediaId);
  const mediaThumbsStorageRef = storageRef(storage, 'uploadFiles/' + uploadCategory + '/' + parentId + '/' + mediaId);
  await uploadString(mediaStorageRef, uploadFile, 'data_url').then(async (snapshot) => {
    await getDownloadURL(snapshot.ref).then((downloadURL) => {
      downloadURLs.push(downloadURL);
      console.log("File available at", downloadURL);
      // 썸네일 생성(파일 타입이 svg, 비디오파일의 경우 썸네일 생성 안함)
      dataSet.files.push({
        downloadUrl: downloadURL,
        fileName: uploadFile.fileName,
        fileType: uploadFile.fileType,
        size: uploadFile.size,
      })
      console.log(downloadURLs)
    })
  });
  // downloadURLs배열의 문자열만 반환
  return downloadURLs.toString();
}
// ======================================================================
// 미디어 삭제
// deleteMedia(uploadCategory, mediaId, parentId)
// uploadCategory : 업로드 카테고리(pets, users, boardContents, boardComments)
// parentId : 상위 문서 아이디
// mediaId : 미디어 아이디
// ======================================================================
const deleteMedia = async (uploadCategory, mediaId, parentId) => {
  console.log("미디어를 삭제합니다.");
  const db = getFirestore();
  const storage = getStorage();
  const mediaDocRef = doc(db, uploadCategory, parentId);
  const mediaDocSnap = await getDoc(mediaDocRef);
  const mediaDocData = mediaDocSnap.data();
  mediaDocData.medias = mediaDocData.medias ? mediaDocData.medias : [];
  const mediaIndex = mediaDocData.medias.findIndex((media) => media.mediaId === mediaId);
  if (mediaIndex > -1) {
    const media = mediaDocData.medias[mediaIndex];
    media.files.forEach((file, index) => {
      console.log("file", file)
      const mediaStorageRef = storageRef(storage, 'uploadFiles/' + uploadCategory + '/' + parentId + '/' + mediaId + '/' + file.fileName);
      deleteObject(mediaStorageRef).then(() => {
        console.log("File deleted successfully");
        if (index === media.files.length - 1) {
          mediaDocData.medias.splice(mediaIndex, 1);
          console.log("mediaDocData", mediaDocData);
          setDoc(mediaDocRef, mediaDocData, { merge: true });
        }
      }).catch((error) => {
        console.log("Uh-oh, an error occurred!");
      });
    })
    const mediaThumbsRef = storageRef(storage, 'uploadFiles/' + uploadCategory + '/' + parentId + '/' + mediaId + '/thumbs');
    const mediaThumbsListAllRef = listAll(mediaThumbsRef).then((res) => {
      res.items.forEach((itemRef) => {
        deleteObject(itemRef).then(() => {
          console.log("File deleted successfully");
        }).catch((error) => {
          console.log("Uh-oh, an error occurred!");
        });
      })
    });
    // mediaDocData.medias.splice(mediaIndex, 1);
    // console.log("mediaDocData", mediaDocData);
    // setDoc(mediaDocRef, mediaDocData, { merge: true });
  }
}

// ======================================================================
// 이미지 썸네일 반환
// getImgThumbnail(item)
// item : 미디어 아이템
// ======================================================================
const getImgThumbnail = (item) => {
  let imgThumbnail = "";
  let fileType = "";
  if (
    item.medias &&
    item.medias.length > 0 &&
    item.medias[item.medias.length - 1].files[
      item.medias[item.medias.length - 1].files.length - 1
    ].thumbnailUrl
  ) {
    imgThumbnail =
      item.medias[item.medias.length - 1].files[
        item.medias[item.medias.length - 1].files.length - 1
      ].thumbnailUrl[1];
    fileType =
      item.medias[item.medias.length - 1].files[
        item.medias[item.medias.length - 1].files.length - 1
      ].fileType;
  } else if (
    item.medias &&
    item.medias.length > 0 &&
    !item.medias[item.medias.length - 1].files[
      item.medias[item.medias.length - 1].files.length - 1
    ].thumbnailUrl
  ) {
    if (
      item.medias[item.medias.length - 1].files[
        item.medias[item.medias.length - 1].files.length - 1
      ].fileType.indexOf("image") !== -1
    ) {
      imgThumbnail =
        item.medias[item.medias.length - 1].files[
          item.medias[item.medias.length - 1].files.length - 1
        ].downloadUrl;
      fileType =
        item.medias[item.medias.length - 1].files[
          item.medias[item.medias.length - 1].files.length - 1
        ].fileType;
    } else if (
      item.medias[item.medias.length - 1].files[
        item.medias[item.medias.length - 1].files.length - 1
      ].fileType.indexOf("video") !== -1
    ) {
      imgThumbnail =
        item.medias[item.medias.length - 1].files[
          item.medias[item.medias.length - 1].files.length - 1
        ].downloadUrl;
      fileType =
        item.medias[item.medias.length - 1].files[
          item.medias[item.medias.length - 1].files.length - 1
        ].fileType;
    }
  } else if (!item.medias || item.medias.length === 0) {
    imgThumbnail =
      "https://dummyimage.com/300x300/666666/ffffff.png?text=No%20Image";
    fileType = "image/png";
  }
  return [imgThumbnail, fileType];
};






export { generateRandomString, estimateHatchDate, estimateSoonHatchDate, estimateSpawnDate, estimateSoonSpawnDate, estimateSoonMatingDate, uploadMedia, uploadMediaBase64, deleteMedia, getImgThumbnail }
