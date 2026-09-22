/**
 * AI Resume & Portfolio Builder - PWA Service Worker (sw.js)
 * 오프라인 캐싱 및 PWA 설치 지원
 */

const CACHE_NAME = "resume-builder-cache-v1";

// 캐싱할 정적 리소스 목록
const ASSETS_TO_CACHE = [
    "/",
    "/static/css/style.css",
    "/static/js/app.js",
    "/static/manifest.json",
    "/static/icons/icon-192.png",
    "/static/icons/icon-512.png",
    "/static/icons/icon.svg"
];

// 1. Service Worker 설치(Install) 이벤트: 기본 에셋 사전 캐싱
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. Service Worker 활성화(Activate) 이벤트: 이전 버전 캐시 정리
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch 이벤트: 네트워크 요청 가로채기
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // AI 생성 API(/generate) 및 POST 요청은 캐싱하지 않고 항상 네트워크로 직접 전송
    if (event.request.method !== "GET" || url.pathname.startsWith("/generate")) {
        return;
    }

    // 정적 파일 및 화면 요청: 캐시 우선, 없으면 네트워크 요청 후 캐시 업데이트
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // 네트워크 단절 시 캐시된 메인 페이지 반환 시도
                if (event.request.headers.get("accept")?.includes("text/html")) {
                    return caches.match("/");
                }
            });
        })
    );
});
