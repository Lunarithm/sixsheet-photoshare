// Hardened media fetch: cache-bust every attempt, detect string/HTML responses,
// fall back to native fetch if axios fails, capture diagnostic info.
import axios from "axios";

const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [400, 1200, 3000]; // before attempts 2, 3, 4

/**
 * @param {string} apiBase - VITE_APIHUB_URL
 * @param {string} shortUUID
 * @returns {Promise<{ source: Array, diagnostics: Array }>}
 */
export async function fetchMediaWithRetry(apiBase, shortUUID) {
  const diagnostics = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const cacheBuster = `_cb=${Date.now()}.${attempt}`;
    const url = `${apiBase}/media/${shortUUID}?${cacheBuster}`;
    const via = attempt <= 2 ? "axios" : "fetch"; // escalate transport after 2 axios tries

    try {
      const { data, status, contentType } = await (via === "axios"
        ? requestViaAxios(url)
        : requestViaFetch(url));

      // Guard: if server returned HTML / text (WAF block page, captive portal, redirect)
      if (typeof data === "string") {
        diagnostics.push({ attempt, via, status, contentType, kind: "string-response", preview: data.slice(0, 120) });
        throw new Error(`Non-JSON response (${contentType})`);
      }

      const source = pickSource(data);
      if (source && source.length > 0) {
        return { source, diagnostics };
      }

      diagnostics.push({ attempt, via, status, contentType, kind: "empty-source", bodyKeys: data && typeof data === "object" ? Object.keys(data) : [] });
    } catch (err) {
      diagnostics.push({ attempt, via, kind: "error", message: err?.message || String(err), status: err?.response?.status });
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2000);
    }
  }

  const err = new Error("All retry attempts exhausted");
  err.diagnostics = diagnostics;
  throw err;
}

function pickSource(data) {
  if (Array.isArray(data?.data?.source)) return data.data.source;
  if (Array.isArray(data?.source)) return data.source;
  if (Array.isArray(data?.data)) return data.data;
  return null;
}

async function requestViaAxios(url) {
  const res = await axios.get(url, {
    timeout: 12000,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    // Force axios to reject non-2xx rather than returning the error body as data
    validateStatus: (s) => s >= 200 && s < 300,
    transformResponse: [(body) => {
      // Try to parse; if not JSON, leave as string so caller can detect
      if (typeof body !== "string") return body;
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }],
  });
  return {
    data: res.data,
    status: res.status,
    contentType: res.headers?.["content-type"] || "",
  };
}

async function requestViaFetch(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.response = { status: res.status };
      throw err;
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { data, status: res.status, contentType };
  } finally {
    clearTimeout(timeoutId);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Unregister any stale service workers and purge caches. Called once on mount.
 * Safari sometimes keeps old SWs alive that intercept API calls.
 */
export async function unregisterStaleServiceWorkers() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if (typeof caches !== "undefined" && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // best-effort; ignore
  }
}
