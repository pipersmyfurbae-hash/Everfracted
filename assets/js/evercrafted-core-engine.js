(function initEvercraftedCoreEngine(globalScope) {
  const DEFAULTS = {
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

  async function runEmotion(feeling, endpoint) {
    return postJson(endpoint || resolveEndpoint(), {
      input_type: "emotion",
      input_data: { feeling }
    });
  }

  globalScope.EvercraftedCoreEngine = {
    resolveEndpoint,
    runEmotion
  };
})(window);
