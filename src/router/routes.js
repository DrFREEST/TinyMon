const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // 인덱스 페이지
      { path: '', component: () => import('pages/IndexPage.vue') },

      // 사용자 인증 페이지
      {
        path: 'auth', component: () => import('pages/auth/LoginPage.vue'), children: [
        ]
      },

      // 메인 페이지
      { path: 'main', component: () => import('pages/MainPage.vue') },

      // 사육 페이지
      {
        path: 'breeding',
        component: () => import('pages/breeding/BreedingIndexPage.vue'),
        children: [
          { path: '', component: () => import('pages/breeding/cages/CagesIndexPage.vue'), name: 'cages' },
          // 사육장
          { path: 'cages', component: () => import('pages/breeding/cages/CagesIndexPage.vue'), name: 'cages' },
          // 개체
          { path: 'pets', component: () => import('pages/breeding/pets/PetsIndexPage.vue'), name: 'pets' },
          // 알
          { path: 'eggs', component: () => import('pages/breeding/eggs/EggsIndexPage.vue'), name: 'eggs' },
        ]
      },
      // 게시판 페이지
      {
        path: 'board',
        component: () => import('pages/board/BoardIndexPage.vue'),
        children: [
          { path: '', component: () => import('pages/board/BoardMainPage.vue'), name: 'main' },
          { path: 'list', component: () => import('pages/board/BoardListPage.vue'), name: 'list' },
          { path: 'write', component: () => import('pages/board/BoardWritePage.vue'), name: 'write' },
          { path: 'edit', component: () => import('pages/board/BoardEditPage.vue'), name: 'edit' },
          { path: 'view', component: () => import('pages/board/BoardViewPage.vue'), name: 'view' },
        ]
      },

      // 마이페이지
      // { path: 'mypage', component: () => import('pages/mypage/MypagePage.vue') },

      // 설정 페이지
      // { path: 'setting', component: () => import('pages/setting/SettingPage.vue') },
    ]
  },

  // 404 오류 페이지
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') }
]

export default routes
