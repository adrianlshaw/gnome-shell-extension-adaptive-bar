const { GLib } = imports.gi;
const Main = imports.ui.main;

let cpuLoadCheck;
let lastIdle = 0;
let lastTotal = 0;

function getCPULoad() {
    return new Promise((resolve, reject) => {
        try {
            let content = GLib.file_get_contents('/proc/stat')[1].toString();
            let cpuLine = content.split('\n')[0];
            let cpuTimes = cpuLine.split(/\s+/).slice(1).map(x => parseInt(x));

            let idle = cpuTimes[3] + cpuTimes[4]; // idle + iowait
            let total = cpuTimes.reduce((a, b) => a + b, 0);

            let idleDiff = idle - lastIdle;
            let totalDiff = total - lastTotal;

            lastIdle = idle;
            lastTotal = total;

            let loadPercentage = (1 - idleDiff / totalDiff) * 100;
            resolve(loadPercentage);
        } catch (e) {
            reject(e);
        }
    });
}

function setTopBarColor(loadPercentage) {
    // Calculate color based on load percentage
    const red = Math.min(255, Math.floor(255 * (loadPercentage / 100)));
    const green = 0;
    const blue = 0;
    const color = `rgb(${red}, ${green}, ${blue})`;
    Main.panel.actor.style = `background-color: ${color};`;
}

function updateCPULoad() {
    getCPULoad()
        .then(loadPercentage => {
            setTopBarColor(loadPercentage);
        })
        .catch(error => {
            log(`Error getting CPU load: ${error}`);
        });
}

function init() {
}

function enable() {
    updateCPULoad();
    cpuLoadCheck = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 15, () => {
        updateCPULoad();
        return true; // Return true to continue the timeout
    });
}

function disable() {
    Main.panel.actor.style = null;
    if (cpuLoadCheck) {
        GLib.source_remove(cpuLoadCheck);
        cpuLoadCheck = null;
    }
}

