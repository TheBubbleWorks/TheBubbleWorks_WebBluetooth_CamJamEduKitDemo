'use strict';

(function(document) {

    document.addEventListener('WebComponentsReady', function(e) {
        startApp();
    });


    // ------------------------------------------------------------------------------
    // On Page load

    function startApp() {
        var leftMotorSpeed=0, rightMotorSpeed=0;
        var sendJoypadUpdates = false;

        Polymer({
            is: 'my-app',
        });

        var app = document.querySelector('#my-app');


        if (navigator.bluetooth == undefined) {
            document.getElementById("no-bluetooth").open();
        }


        // ------------------------------------------------------------------------------
        // UI Events

        // Tabs & Pages

        var pages = document.querySelector('iron-pages');
        var tabs = document.querySelector('paper-tabs');

        tabs.addEventListener('iron-select', function() {
            pages.selected = tabs.selected;
            console.log(pages.selected);
            if (pages.selected == "0" ) {
               sendJoypadUpdates = vortex.isConnected();
            } else {
                sendJoypadUpdates = false;
            }
        });


        // Face Change

        document.querySelector('#face-slider').addEventListener('value-change', function(event) {
            vortex.setFace(event.target.value);
        });


        var faceColourGroup = document.querySelector('#face-colour-group');
        faceColourGroup.addEventListener('iron-select', function() {
            var colour = faceColourGroup.selected;
            console.log("Face colour selected:" + colour);
            vortex.setFaceColour(colour);
        });


        // Dance Group

        var danceGroup = document.querySelector('#dance-group');
        danceGroup.addEventListener('iron-select', function() {
            var dance = danceGroup.selected;
            console.log("dance selected:" + dance);
            switch (dance) {
                case "danceOff": vortex.stopDance(); break;
                case "dance1": vortex.startDance(0); break;
                case "dance2": vortex.startDance(1); break;
                case "dance3": vortex.startDance(2); break;
                case "dance4": vortex.startDance(3); break;
                default:    vortex.stopDance();
            }
        });


        // Music Group

        var musicGroup = document.querySelector('#music-group');
        musicGroup.addEventListener('iron-select', function() {
            var music = musicGroup.selected;
            console.log("music selected:" + music);
            switch (music) {
                case "musicOff": vortex.stopMusic(); break;
                case "music1": vortex.startMusic(1); break;
                case "music2": vortex.startMusic(2); break;
                case "music3": vortex.startMusic(3); break;
                case "music4": vortex.startMusic(4); break;
                case "music5": vortex.startMusic(5); break;
                case "music6": vortex.startMusic(6); break;
                case "music7": vortex.startMusic(7); break;
                case "rnd": vortex.startMusic(Math.floor(Math.random() * (256 - 1) + 1)); break; // 1 to 255
                default:    vortex.stopMusic();
            }
        });


        // Colour Selectors

        // the paper-colour-picker components fires 4 individual events for r, g, b and alpha for a single colour change
        // TODO: investigate how to listen to a composite colour change event

        var topColourPicker = document.querySelector('#top-colours');
        topColourPicker.addEventListener('value-changed', function(){
            //var normalizedEvent = Polymer.dom(event);
            //console.info('rootTarget is:', normalizedEvent.rootTarget);
            //console.info('localTarget is:', normalizedEvent.localTarget);
            //console.info('path is:', normalizedEvent.path);
            console.log("Top Colour: " + event.detail.value);
            var r = topColourPicker.value.red;
            var g = topColourPicker.value.green;
            var b = topColourPicker.value.blue;
            console.log(r,g,b);
            vortex.setTopLED(Vortex.LED.LED_ALL, r, g, b);
        });


        var bottomColourPicker = document.querySelector('#bottom-colours');
        bottomColourPicker.addEventListener('value-changed', function(){
            console.log("Bottom Colour: " + event.detail.value);
            var r = bottomColourPicker.value.red;
            var g = bottomColourPicker.value.green;
            var b = bottomColourPicker.value.blue;
            console.log(r,g,b);
            vortex.setBottomLED(Vortex.LED.LED_ALL, r, g, b);
        });


        /*
         var resetButton = document.getElementById("send-reset-button");
         if (resetButton) {
         resetButton.addEventListener('click', function () {
         bluetoothDevice.request().then(function () {
         vortex.reset();
         }).catch(onError);
         });
         }*/

        /*
         var lineFollowButton = document.getElementById("pid-toggle");
         lineFollowButton.addEventListener('click', function() {
         console.log(lineFollowButton.checked);
         vortex.setPidEnabled(lineFollowButton.checked);
         sendJoypadUpdates = !lineFollowButton.checked;
         });*/



        // ------------------------------------------------------------------------------
        // Bluetooth LE (mostly bolierplate)

        var bluetoothDevice = document.querySelector('platinum-bluetooth-device');
        var bluetoothWriteCharacteristic = document.querySelector('platinum-bluetooth-characteristic');
        var bluetoothReadCharacteristic = document.querySelector('platinum-bluetooth-characteristic');

        var vortex = new Vortex(bluetoothDevice, bluetoothWriteCharacteristic, bluetoothReadCharacteristic);

        document.vortex = vortex; // current workaround to give legacy Vortex JS access.


        var connectButton = document.getElementById("connect-toggle");
        connectButton.addEventListener('click', function() {
            console.log("Connecting");

            bluetoothDevice.request().then(function(device) {
                //console.log(device);
                vortex.onConnect(device);
                sendJoypadUpdates = true;       // assumes we start on the Joypad tab

            }).catch(onError);
        });


        function onError(error) {
            console.log("ERROR: " + error);
        }


        // ------------------------------------------------------------------------------
        // Joystick


        var joystick = new RetroJoyStick({
            retroStickElement: document.querySelector('#retrostick')
        });


        joystick.subscribe('change', function(stick)  {

            var y = (Math.cos(stick.angle * (Math.PI / 180))  * stick.distance) / 100;
            var x = (Math.sin(stick.angle * (Math.PI / 180))  * stick.distance) / 100;
            leftMotorSpeed = (y + x) * 127;
            rightMotorSpeed = (y - x) * 127;

            //console.log( new Date().getTime() + ": " +stick.angle, stick.distance + " => " + x, y, ": " +leftMotorSpeed.toFixed(2), rightMotorSpeed.toFixed(2));

        }.bind(this));



        setInterval( function() {
            if (sendJoypadUpdates) {
                    vortex.setMotorSpeeds(leftMotorSpeed, rightMotorSpeed);
                    //console.log(new Date().getTime() + ": " + leftMotorSpeed.toFixed(2), rightMotorSpeed.toFixed(2));
                }
        }, 200);

    }

})(document);

