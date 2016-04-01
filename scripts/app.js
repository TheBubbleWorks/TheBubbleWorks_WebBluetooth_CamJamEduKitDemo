'use strict';


(function(document) {

    var JOYPAD_UPDATE_INTERVAL_MS = 250;

    // Bluetooth settings
    // These 128-Bit ID's correspond to the Nordic Semi-conductor 'UART' BLE service which is used by Adafruit and others.
    var UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    var UART_CHAR_RX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    var UART_CHAR_TX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

    // Bluetooth State
    var connected = false;
    var gattServer = null;
    var uartService = null;
    var writeCharacteristic = null;
    var readCharacteristic = null;


    // App state
    var leftMotorSpeed=0, rightMotorSpeed=0;
    var sendJoypadUpdates = false;

    // These magic hex numbers below conform to the made up standard just for these demos, in a real app you would use
    // an existing (if the device/protocol exists already) or a custom JavaScript library to hide such details.
    // These correspond to whe the BLE peripheral device running as a service on the Raspberry Pi
    // see:
    var RPIGPIO_PIN23_DIGITAL_LOW_MESSAGE  = [0x00, 0x31, 0x02, 0x17, 0x00];
    var RPIGPIO_PIN23_DIGITAL_HIGH_MESSAGE = [0x00, 0x31, 0x02, 0x17, 0x01];


    // ------------------------------------------------------------------------------
    // On Page load,

    function startApp() {

        // ------------------------------------------------------------------------------
        // DOM event handlers

        // Buttons
        document.querySelector("#connectButton").addEventListener('click',  setupBluetooth);
        document.querySelector("#onButton").addEventListener('click',  ledOnPressed);
        document.querySelector("#offButton").addEventListener('click',  ledOffPressed);

        // Joystick

        var joystick = new RetroJoyStick({
            retroStickElement: document.querySelector('#retrostick')
        });


        joystick.subscribe('change', function(stick)  {

            var y = (Math.cos(stick.angle * (Math.PI / 180))  * stick.distance) / 100;
            var x = (Math.sin(stick.angle * (Math.PI / 180))  * stick.distance) / 100;
            leftMotorSpeed  =  (y + x) * 100;
            rightMotorSpeed =  (y - x) * -100;

            //console.log( new Date().getTime() + ": " +stick.angle, stick.distance + " => " + x, y, ": " +leftMotorSpeed.toFixed(2), rightMotorSpeed.toFixed(2));

        }.bind(this));


        // Timed events
        setInterval( function() {
            if (sendJoypadUpdates) {
                log(new Date().getTime() + ": " + leftMotorSpeed.toFixed(2) + ", " + rightMotorSpeed.toFixed(2));
                sendJoypadUpdate(leftMotorSpeed, rightMotorSpeed);
            }
        }, JOYPAD_UPDATE_INTERVAL_MS);

    }

    function uartRxNotification(data) {
        log("RX: + " + data);
        if (data.length>=4) {
            document.querySelector("#distanceLabel").innerHTML = data[2];
            document.querySelector("#lineDetectedLabel").innerHTML = data[3] ? "Yes":"No";
        }

    }

    function setupBluetooth() {
        if (navigator.bluetooth == undefined) {
            handleError('Web Bluetooth support not found, please see: https://goo.gl/5p4zNM');
            return;
        }

        if (gattServer != null && gattServer.connected) {
            //disconnect();
        } else {
            log('Connecting...');
            if (readCharacteristic == null) {
                navigator.bluetooth.requestDevice({
                        filters: [{
                            services: [UART_SERVICE_UUID]
                        }]
                    })
                    .then(function (device) {
                        log('> DeviceNAme=' + device.name);
                        log('Connecting to GATT Server...');
                        return device.connectGATT(); // This is deprectated, but still necessary in some 'older' browser versions.
                    }).then(function (server) {
                    log('> Found GATT server');
                    gattServer = server;
                    // Get UART service
                    return gattServer.getPrimaryService(UART_SERVICE_UUID);
                }).then(function (service) {
                    log('> Found event service');
                    uartService = service;
                    // Get write characteristic
                    return uartService.getCharacteristic(UART_CHAR_TX_UUID);
                }).then(function (characteristic) {
                    log('> Found write characteristic');
                    writeCharacteristic = characteristic;
                    // Get read characteristic
                    return uartService.getCharacteristic(UART_CHAR_RX_UUID);
                }).then(function (characteristic) {
                    connected = true;
                    log('> Found read characteristic');
                    readCharacteristic = characteristic;

                    deviceConnected();

                    // Listen to device notifications
                    return readCharacteristic.startNotifications().then(function () {

                        readCharacteristic.addEventListener('characteristicvaluechanged', function (event) {
                            log('> characteristicvaluechanged = ' + event.target.value + ' [' + event.target.value.byteLength + ']');
                            if (event.target.value.byteLength > 0) {
                                var data = new Uint8Array(event.target.value);
                                uartRxNotification(data);
                            }
                        });
                    });
                }).catch(handleError);
            }
        }
    }

    // ------------------------------------------------------------------------------
    // Bluetooth utilities

    function send(data) {
        log("Sending: " + data);
        return writeCharacteristic.writeValue(new Uint8Array(data));
    }


    function deviceConnected() {
        log("Device connected");
        connected = true;
        sendJoypadUpdates = true;

    }

    function ledOnPressed() {
        send(RPIGPIO_PIN23_DIGITAL_HIGH_MESSAGE);
    }

    function ledOffPressed() {
        send(RPIGPIO_PIN23_DIGITAL_LOW_MESSAGE);
    }

    function sendJoypadUpdate(x, y) {
        send([0x00, 0x04, leftMotorSpeed+100, rightMotorSpeed+100 ])
    }


    // ------------------------------------------------------------------------------
    // Browser helpers

    function handleError(error) {
        log("ERROR:" + error);
    }

    function log(line) {
        console.log(line);
        var textarea = document.getElementById('consoleTextArea');
        var previous_text = textarea.innerHTML;
        textarea.innerHTML = previous_text + line + "\n";
        textarea.scrollTop = textarea.scrollHeight;

    }
    window.onerror = function (msg, url, lineNumber, columnNumber, error) {
        handleError( msg + ' Script: ' + url + ' Line: ' + lineNumber);
        return false;
    }

    document.addEventListener('WebComponentsReady', function(e) {
        startApp();
    });



})(document);

