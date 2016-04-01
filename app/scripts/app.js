'use strict';

(function(document) {

    document.addEventListener('WebComponentsReady', function(e) {
        wrapErrors(startApp)();
    });


    // ------------------------------------------------------------------------------
    // On Page load

    function startApp() {
        var leftMotorSpeed=0, rightMotorSpeed=0;
        var sendJoypadUpdates = false;


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
                    log(new Date().getTime() + ": " + leftMotorSpeed.toFixed(2) + ", " + rightMotorSpeed.toFixed(2));
                }
        }, 1000);

    }

})(document);

