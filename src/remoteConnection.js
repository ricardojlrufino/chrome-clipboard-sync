import mqtt from '../modules/mqtt.esm.js';

/** 
 * RemoteConnection tanke care of the connection to the MQTT broker 
 * and update the chrome badge based on state
 * This is executed in the background service worker 
 * 
 * @author Ricardo JL Rufino
 **/ 
class RemoteConnection {

    constructor(config) {
        this.client = null;
        this.config = config;
    }
    connect(onMessage) {

        let config = this.config;

        this.client = mqtt.connect(config.server, {
            keepalive: 10, 
            username: config.username,
            password: config.password,
            protocolVersion: 5,
            properties: {}
        });

        let client = this.client;

        client.on("connect", () => {

            console.info("Connected with deviceID: ", config.deviceID);
            chrome.action.setIcon({ path: 'icons/socket-active.png' });

            client.subscribe(config.topic + "/+", (err) => {
                if (!err) {
                    client.publish(config.topic + "/" + config.deviceID, "Hello mqtt");
                }
            });
        });


        client.on('reconnect', function () {
            console.warn("reconnecting...")
        });

        client.on('message', function (topic, message) {
            console.log("Received message from " + topic, message.toString());

            let remoteDeviceID = topic.substring(topic.indexOf(config.topic) + config.topic.length + 1);

            // Ignore messages sent by this device
            if (remoteDeviceID == config.deviceID) {
                console.log("Ignoring message from self");
                return;
            }

            chrome.action.setBadgeText({ text: "" + message.length });
            onMessage(message.toString());
        });

        client.on('error', function (error) {
            console.error("Error on connect", error);
            chrome.action.setIcon({ path: 'icons/socket-error.png' });

            if (error.message.indexOf('Not authorized')) {
                client.end();
            }
        });

        client.on('offline', function () {
            chrome.action.setBadgeText({ text: 'OFF' });
            chrome.action.setIcon({ path: 'icons/socket-inactive.png' });
        });

        client.on('close', function () {
            chrome.action.setIcon({ path: 'icons/socket-inactive.png' });
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end();
        }
    }

    broadcast(data) {
        if (this.client) {
            this.client.publish(this.config.topic + "/" + this.config.deviceID, data);
        }
    }


}

export default RemoteConnection;
