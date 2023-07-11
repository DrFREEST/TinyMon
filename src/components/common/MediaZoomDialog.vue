<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" class="tw-backdrop-blur">
    <div
      class="media-view tw-w-full tw-h-full tw-shadow-2xl tw-shadow-white tw-relative"
    >
      <swiper-container
        :navigation="true"
        :pagination="true"
        :scrollbar="true"
        :slides-per-view="1"
        :css-mode="true"
        class="tw-w-full tw-h-full"
      >
        <swiper-slide
          ref="container"
          v-for="(file, index) in $props.files"
          :key="index"
          class="tw-w-full"
          lazy="false"
        >
          <div class="tw-hidden">
            {{ file }}
          </div>
          <template v-if="file.fileType.indexOf('image') !== -1">
            <PinchScrollZoom
              ref="zoomer"
              ratio="1"
              :width="300"
              :height="300"
              :min-scale="0.3"
              :max-scale="15"
              :scale="1"
              @scaling="(e) => onEvent('scaling', e)"
              @startDrag="(e) => onEvent('startDrag', e)"
              @stopDrag="(e) => onEvent('stopDrag', e)"
              @dragging="(e) => onEvent('dragging', e)"
              @click="(e) => onEvent('click', e)"
            >
              <q-img :src="file.downloadUrl" loading="lazy" draggable="true" />
            </PinchScrollZoom>
          </template>
          <template v-else>
            <video :src="file.downloadUrl + '#t=0.5'" controls></video>
          </template>
        </swiper-slide>
      </swiper-container>
      <q-btn
        title="팝업 닫기"
        class="tw-absolute tw-top-[1rem] tw-right-[1rem] tw-z-10"
        icon="close"
        color="transparent"
        @click="onDialogHide"
      ></q-btn>
    </div>
  </q-dialog>
</template>

<style scope>
.media-view swiper-slide {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pinch-scroll-zoom {
  overflow: visible;
  width: calc(100vw - 3rem);
  height: calc(100vh - 3rem);
}
.pinch-scroll-zoom__content {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useDialogPluginComponent } from "quasar";
import { register } from "swiper/element/bundle";
import { Navigation, Pagination, Scrollbar } from "swiper";
import "@coddicat/vue-pinch-scroll-zoom/style.css";
import PinchScrollZoom from "@coddicat/vue-pinch-scroll-zoom";

register();

const props = defineProps({
  index: {
    type: Number,
    default: 0,
  },
  fileIndex: {
    type: Number,
    default: 0,
  },
  files: {
    type: Array,
    default: () => [],
  },
});

const zoomer = ref();

function zoomerReset() {
  console.log(zoomer.value[0].setData({ scale: 1, x: 0, y: 0 }));
  zoomer.value[0].setData({
    scale: 1,
    originX: 150,
    originY: 150,
    translateX: 0,
    translateY: 0,
  });
}
function onEvent(eventName, e) {
  console.log(eventName, e);
  if (eventName === "click") {
    zoomerReset();
  }
}

// Composable usage

// const swiperParams = {
//   modules: [Navigation, Pagination, Scrollbar],
// };
// Object.assign(swiperEl, swiperParams);

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits,
]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef에서 swiper-container 찾기

onMounted(() => {
  setTimeout(() => {
    // const swiperEl = dialogRef.value.$el.querySelector("swiper-container");
    // swiperEl.swiper.slideTo(props.fileIndex, 0, false);
  }, 0);
});

// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

// this is part of our example (so not required)
function onDialogOKClick() {
  onDialogOK({});
}
function onDialogCancelClick() {
  onDialogCancel();
}
</script>
