chrome.runtime.onMessage.addListener(async (message) => {
  // Return early if this message isn't meant for the offscreen document.
  console.log(`Message received:`, message.type);
  if (message.target !== 'offscreen-doc') {
    return;
  }

  // Dispatch the message to an appropriate handler.
  switch (message.type) {
    case 'copy-data-to-clipboard':
      handleClipboardWrite(message.data);
      break;
    case 'read-data-from-clipboard':
      handleClipboardRead(message.data);
      break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
});


// NOT WORKING...
async function handleClipboardRead() {

  const clipText = await readText();

  chrome.runtime.sendMessage({
    type: 'onread-clipboard-data',
    target: 'background',
    data: clipText
  });

}

function readText() {
  return new Promise((resolve, reject) => {
    const _asyncCopyFn = (async () => {
      try {
        const value = await navigator.clipboard.readText();
        console.log(`${value} is read!`);
        resolve(value);
      } catch (e) {
        reject(e);
      }
      window.removeEventListener("focus", _asyncCopyFn);
    });

    window.addEventListener("focus", _asyncCopyFn);
    console.log("Hit <Tab> to give focus back to document (or we will face a DOMException);");
  });
}

// To call:


// const success = document.execCommand('paste');
// // The contents of the clipboard
// const text = el.value;
// el.remove();
// if (!success)
//     reject(new Error('Unable to read from clipboard'));
// // Resolve with the contents of the clipboard
// resolve(text);
// };

// We use a <textarea> element for two main reasons:
//  1. preserve the formatting of multiline text,
//  2. select the node's content using this element's `.select()` method.
const textEl = document.querySelector('#text');

// Use the offscreen document's `document` interface to write a new value to the
// system clipboard.
//
// At the time this demo was created (Jan 2023) the `navigator.clipboard` API
// requires that the window is focused, but offscreen documents cannot be
// focused. As such, we have to fall back to `document.execCommand()`.
async function handleClipboardWrite(data) {
  try {
    // Error if we received the wrong kind of data.
    if (typeof data !== 'string') {
      throw new TypeError(
        `Value provided must be a 'string', got '${typeof data}'.`
      );
    }

    // `document.execCommand('copy')` works against the user's selection in a web
    // page. As such, we must insert the string we want to copy to the web page
    // and to select that content in the page before calling `execCommand()`.
    textEl.value = data;
    textEl.select();
    document.execCommand('copy');
  } finally {
    // Job's done! Close the offscreen document.
    window.close();
  }
}