
var clipboardEl;

function el(id) {
    return document.getElementById(id);
}

function onClick(id, callback) {
    el(id).addEventListener('click', callback);
}


document.addEventListener('DOMContentLoaded', function() {

    clipboardEl = el('clipboard');
    
    onClick("send", function() {
        readClipboardAndBroadcast();
    });

});

async function readClipboardAndBroadcast(){

    navigator.clipboard.readText()
    .then(
        (clipText) => {
            clipboardEl.innerHTML = clipText;

            chrome.runtime.sendMessage({
                type: 'onread-clipboard-data',
                target: 'background',
                data: clipText
            });

        },
    );

}