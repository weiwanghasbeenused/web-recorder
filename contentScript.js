
const prefix = 'documentator-';
const config_items = [ 'width', 'height', 'duration', 'delay'];
let config = {};

chrome.storage.sync.get(config_items, (items) => {
    config = items;
});
const recorder = new PageRecorder(prefix, config);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.toggleState !== undefined) {
        if (request.toggleState) {
            recorder.container.style.display = 'block';
        } else {
            recorder.container.style.display = 'none';
        }
    }
});

