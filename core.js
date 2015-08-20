/*global window, jQuery, XMLHttpRequest*/

(function () {
    'use strict';

    //Variable declarations
    var getJquery, getRest;


    //Funciton definitions
    getJquery = function (callback, error) {
        var req = new XMLHttpRequest();
        req.open('GET', 'https://raw.githubusercontent.com/adussaq/amd_core/master/jquery.min.js');

        req.onload = function () {
            // This is called even on 404 etc
            // so check the status
            if (req.status === 200) {
                // Resolve the promise with the response text
                callback(req.response);
            } else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                error(new Error("Could not load jQuery: " + req.statusText));
            }
        };

        // Handle network errors
        req.onerror = function () {
            error(new Error("Could not load jQuery: " + "Network Error"));
        };

        // Make the request
        req.send();
    };

    getRest = function (x) {
        console.log(x);
    };

    //Start the actual work
    if (!window.jQuery) {
        //get jQuery, try twice then throw an error
        getJquery(getRest, function (x1) {
            getJquery(getRest, function (x2) {
                console.error("After two attempts, could not load jQuery: (1) " +
                    x1 + ". (2) " +  x2);
            });
        });
    }

}());
