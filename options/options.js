// Saves options to chrome.storage
const saveOptions = () => {

    const config = JSON.parse(document.getElementById('json').value);

    console.log("Saving options: ", config);
    
    chrome.storage.sync.set(
      config,
      () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
          status.textContent = '';
          chrome.runtime.reload();
        }, 750);
      }
    );
  };
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  const restoreOptions = () => {
    chrome.storage.sync.get(
      (config) => {
        document.getElementById('json').value = JSON.stringify(config, null, 2);
      }
    );
  };
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);