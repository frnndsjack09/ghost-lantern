// Runs OUTSIDE the app, in @capacitor/background-runner's own JS engine (Android WorkManager, roughly every 30 minutes,
// whenever the OS allows; Xiaomi/HyperOS may delay it unless the app may run in the background).
// It reads the owner's public update file and shows ONE notification per new version. Tapping the notification opens
// the app, which installs the update itself (src/mentalist-phone.ts forceUpdate) and then shows what's new.
// Sends nothing but the request. Same address as SITE in src/update.ts.
const LATEST = "https://frnndsjack09.github.io/ghost-lantern/ota/latest.json";

addEventListener("checkUpdate", async (resolve, reject) => {
  try {
    const own = Number((CapacitorKV.get("ownBuild") || {}).value || 0);
    const told = Number((CapacitorKV.get("toldBuild") || {}).value || 0);
    const r = await fetch(LATEST + "?t=" + Date.now());
    const l = await r.json();
    // own = 0: the app hasn't opened since install, so it can't know what it runs; stay quiet rather than nag wrongly
    if (typeof l.build === "number" && own > 0 && l.build > own && l.build > told) {
      CapacitorNotifications.schedule([{
        id: 4747,
        title: "A new version is ready",
        body: typeof l.notes === "string" && l.notes ? "What's new: " + l.notes.slice(0, 160) : "Tap to update the Discerner.",
        autoCancel: true,
        smallIcon: "ic_stat_lantern", // white lantern in the status bar (scripts/make-icons.ts)
      }]);
      CapacitorKV.set("toldBuild", String(l.build));
    }
    resolve();
  } catch (e) {
    reject(e);
  }
});

// The app tells the runner which build it is running each time it opens.
addEventListener("ownBuild", (resolve, reject, args) => {
  try {
    if (args && typeof args.build === "number") CapacitorKV.set("ownBuild", String(args.build));
    resolve();
  } catch (e) {
    reject(e);
  }
});
