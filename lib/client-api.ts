"use client";

type LoaderListener = (isLoading: boolean, pendingCount: number) => void;

const LOADER_EVENT_NAME = "renturdress:api-loader";
let pendingRequestCount = 0;

function emitLoaderEvent() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(LOADER_EVENT_NAME, {
      detail: { pendingCount: pendingRequestCount },
    }),
  );
}

function beginRequest() {
  pendingRequestCount += 1;
  emitLoaderEvent();
}

function endRequest() {
  pendingRequestCount = Math.max(0, pendingRequestCount - 1);
  emitLoaderEvent();
}

export async function fetchWithLoader(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  beginRequest();
  try {
    return await fetch(input, init);
  } finally {
    endRequest();
  }
}

export function subscribeApiLoader(listener: LoaderListener) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ pendingCount?: number }>;
    const nextPendingCount = customEvent.detail?.pendingCount ?? 0;
    listener(nextPendingCount > 0, nextPendingCount);
  };

  window.addEventListener(LOADER_EVENT_NAME, handleEvent as EventListener);
  listener(pendingRequestCount > 0, pendingRequestCount);

  return () => {
    window.removeEventListener(LOADER_EVENT_NAME, handleEvent as EventListener);
  };
}
