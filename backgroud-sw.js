import RemoteConnection from './src/remoteConnection.js';

const TEN_SECONDS_MS = 10 * 1000;

let client = null;

chrome.runtime.onMessage.addListener(handleRuntimeMessages);

chrome.runtime.onInstalled.addListener(async () => {
    
    chrome.contextMenus.create({
      id: "send-clipboard",
      title: "Send Clipboard",
      type: 'normal',
      contexts: ['selection'],
    });

});


chrome.contextMenus.onClicked.addListener((info) => {

  switch (info.menuItemId) {
    case 'send-clipboard':
      onClickSendClipboard(info.selectionText);
      break;
    default:
      // Standard context menu item function
      console.log('Standard context menu item clicked.');
  }

});

function onClickSendClipboard(text) {
    broadcast(text)
};

function broadcast(data){
    console.log("Sending ... ");
    if (client) {
      client.broadcast(data);
    }
}


function connect(){

  chrome.storage.sync.get(
    (config) => {

      client = new RemoteConnection(config);

      client.connect((message) => {
        saveToClipboard(message.toString());
      });
    }
  );
 
}

function disconnect() {
  if (client) {
    client.disconnect(); 
  }
}

function keepAlive() {
  const keepAliveIntervalId = setInterval(
    () => {
      if (webSocket) {
        console.log('ping XXXXX');
        webSocket.send('ping');
      } else {
        clearInterval(keepAliveIntervalId);
      }
    },
    // It's important to pick an interval that's shorter than 30s, to
    // avoid that the service worker becomes inactive.
    TEN_SECONDS_MS
  );
}


async function handleRuntimeMessages(message) {

  if (message.target !== 'background') {
    return;
  }

  // Dispatch the message to an appropriate handler.
  switch (message.type) {
      case 'onread-clipboard-data':
        handleClipboardRead(message.data);
        break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }

  // receive clipboard data from popupjs
  function handleClipboardRead(data){
    console.log("Recieved on backcground: " + data);
    broadcast(data);
  }

}

let creating; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(config) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(config.url);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument(config);
    await creating;
    creating = null;
  }
}

// This is called when a new message is received from the server
// Solution 1 - As of Jan 2023, service workers cannot directly interact with
// the system clipboard using either `navigator.clipboard` or
// `document.execCommand()`. To work around this, we'll create an offscreen
// document and pass it the data we want to write to the clipboard.
async function saveToClipboard(value) {
  await setupOffscreenDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: 'Write text to the clipboard.'
  });

  // Now that we have an offscreen document, we can dispatch the message.
  chrome.runtime.sendMessage({
    type: 'copy-data-to-clipboard',
    target: 'offscreen-doc',
    data: value
  });
}


if(!client) connect();