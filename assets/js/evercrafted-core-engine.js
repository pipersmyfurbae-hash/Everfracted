(function initEvercraftedCoreEngine(globalScope) {
  const DEFAULTS = {
    localApi: "http://127.0.0.1:8787",
    localApiAlt: "http://localhost:8787",
    localProxy: "http://127.0.0.1:8787/engine-proxy",
    remoteEngine: "https://evercrafted-engine-production.up.railway.app/run-engine"
  };

  function isLocalHost(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1";
  }

  function resolveEndpoint() {
    const host = globalScope.location && globalScope.location.hostname ? globalScope.location.hostname : "";
    return isLocalHost(host) ? DEFAULTS.localProxy : DEFAULTS.remoteEngine;
  }

  function resolveApiBase() {
    const host = globalScope.location && globalScope.location.hostname ? globalScope.location.hostname : "";
    return host === "localhost" ? DEFAULTS.localApiAlt : DEFAULTS.localApi;
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Engine request failed with status ${response.status}`);
    }

    return response.json();
  }

  async function postApi(path, payload) {
    return postJson(`${resolveApiBase()}${path}`, payload);
  }

  async function uploadApi(path, formData) {
    const response = await fetch(`${resolveApiBase()}${path}`, {
      method: "POST",
      body: formData
    });

    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error((json && json.error) || `Request failed with status ${response.status}`);
    }

    return json;
  }

  async function runEmotion(feeling, endpoint) {
    return postJson(endpoint || resolveEndpoint(), {
      input_type: "emotion",
      input_data: { feeling }
    });
  }

  async function signup(payload) {
    return postApi("/signup", payload);
  }

  async function signin(payload) {
    return postApi("/signin", payload);
  }

  async function passwordReset(payload) {
    return postApi("/password-reset", payload);
  }

  async function submitWaitlist(payload) {
    return postApi("/waitlist", payload);
  }

  async function submitContact(payload) {
    return postApi("/contact", payload);
  }

  async function saveBlueprint(payload) {
    return postApi("/blueprints", payload);
  }

  async function uploadFile(formData) {
    return uploadApi("/uploads", formData);
  }

  globalScope.EvercraftedCoreEngine = {
    resolveApiBase,
    resolveEndpoint,
    runEmotion,
    signup,
    signin,
    passwordReset,
    submitWaitlist,
    submitContact,
    saveBlueprint,
    uploadFile
  };
})(window);
