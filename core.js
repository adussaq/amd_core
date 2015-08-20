/*global Promise, $, window, jQuery, XMLHttpRequest*/
/*jslint todo: true evil:true */


var amd_core = (function () {
    'use strict'; //Be sure to remove for anything other than development...
        //Causes firefox to break due to 'functions must be declared at top level'


    //Variable declarations
    var restURL, jQueryURL, polyfillPromiseURL,
        getRest, getJquery, getPolyfill,
        polyfillPromises, ajaxPromise,
        requireBuffer, checklist, checkcallback,
        coreObj, redefineCoreFunctions,
        require, loaded;


    //Variable definitions
    requireBuffer = [];
    loaded = {};
    coreObj = {
        require: function (reqObj) {
            requireBuffer.push(reqObj);
        }
    };

    //jQuery URL below is for 2.1.4
    jQueryURL = 'https://alexdussaq.info/amd_core/jquery.min.js';
    //polyfill links to the github most recent version
    polyfillPromiseURL = "https://raw.githubusercontent.com/jakearchibald/es6-promise/master/dist/es6-promise.min.js";

    restURL = [];

    //Global Function Definitions
    coreObj.isArray = (function () {
        // Use compiler's own isArray when available
        if (Array.isArray) {
            return Array.isArray;
        }

        // Retain references to variables for performance
        // optimization
        var objectToStringFn = Object.prototype.toString,
            arrayToStringResult = objectToStringFn.call([]);

        return function (subject) {
            return objectToStringFn.call(subject) === arrayToStringResult;
        };
    }());

    //Funciton definitions
    ajaxPromise = function (url) {
        var successFunc, errorFunc, promise, makePromise;

        successFunc = function (resolve) {
            return function () {
                resolve(url);
            };
        };

        errorFunc = function (reject) {
            return function (err) {
                loaded[url] = false;
                reject(new Error('failed to get: ' + url +
                        " statusText: " + err.statusText +
                        " status: " + err.status
                    ));
            };
        };

        makePromise = function () {
            return new Promise(function (resolve, reject) {
                //Check if it is alredy loaded
                $.ajax({
                    url: url,
                    dataType: "script",
                    success: successFunc(resolve),
                    error: errorFunc(reject)
                });
            });
        };

        //If this has already been called just return the promise
            // If the promise fails, reset the loaded[url] thing to 
            // false so the user can try again...
        if (loaded[url]) {
            promise = loaded[url];
            promise.catch(function () {
                //Reset loaded so this can be tried again...
                loaded[url] = false;
            });
        } else {
            promise = makePromise();
        }

        loaded[url] = promise;

        return promise;
    };

    checkcallback = function (cb) {
        if (typeof cb === 'function') {
            return true;
        }
        console.error(new Error("Callback in coreObj.require not defined, this is a required parameter."));
        return false;
    };

    checklist = function (list) {
        //Should be an object composed of an array of objects
        var ret = true, i;
        if (typeof list !== 'object') {
            console.error(new Error('List for require must be an object.'));
            ret = false;
        }
        if (list.hasOwnProperty('ordered')) {
            if (!coreObj.isArray(list.ordered)) {
                console.error(new Error('Ordered list for require must be an array.'));
                ret = false;
            } else {
                for (i = 0; i < list.ordered.length; i += 1) {
                    if (!coreObj.isArray(list.ordered[i])) {
                        console.error(new Error('Each element in the array for Ordered ' +
                                'List for require must also be an array.'));
                        ret = false;
                    }
                }
            }
        } else {
            list.ordered = [[]];
        }

        if (list.hasOwnProperty('async')) {
            if (!coreObj.isArray(list.async)) {
                console.error(new Error('Async List for require must be an array.'));
                ret = false;
            }
        } else {
            list.async = [];
        }
        return ret;
    };

    redefineCoreFunctions = function () {
        var i;

        //Redefine require
        coreObj.require = require;

        // Flush the waiting list out
        for (i = 0; i < requireBuffer.length; i += 1) {
            require(requireBuffer[i]);
        }
    };

    require = function (reqObj) {
        var prom, promises, i, j, sequenceFunc,
            url, sequence, displayError,
            list, callback, ret;

        promises = [];
        ret = [];
        list = reqObj;
        callback = reqObj.callback;

        displayError = function (err) {
            console.error('Was unable to load module: ', err);
            //Do not return err so 'all' will still resolve
        };
        sequenceFunc = function (url) {
            return function () {
                var promS = ajaxPromise(url);
                ret.push({url: url, promise: promS});
                return promS;
            };
        };

        if (checklist(list) && checkcallback(callback)) {
            // If the input is fine...

            //Start async
            for (i = 0; i < list.async.length; i += 1) {
                url = list.async[i];

                prom = ajaxPromise(url);
                //no catch on return, catch on one for 'all' eval
                ret.push({url: url, promise: prom});
                promises.push(prom.catch(displayError));
            }

            //Now on to the ordered lists
            for (i = 0; i < list.ordered.length; i += 1) {
                sequence = Promise.resolve();
                for (j = 0; j < list.ordered[i].length; j += 1) {
                    url = list.ordered[i][j];
                    sequence = sequence.then(sequenceFunc(url));
                }
                //Catch the error so we know where it stopped
                sequence.catch(displayError);
                promises.push(sequence);
            }
        }

        //Now that we have spun off all of our ajax calls, when it is 
        // all done call the callback
        Promise.all(promises).then(function () {
            var ind, promArr, passFunc, failFunc;
            promArr = [];
            passFunc = function (i) {
                return function () {
                    ret[i].loaded = true;
                };
            };
            failFunc = function (i) {
                return function () {
                    ret[i].loaded = false;
                };
            };
            for (ind = 0; ind < ret.length; ind += 1) {
                promArr.push(ret[ind].promise.then(passFunc(ind), failFunc(ind)));
            }
            Promise.all(promArr).then(function () { callback(ret); });
        });
    };

    getJquery = function (callback, error) {
        var req, onloadF, onerrorF;

        onloadF = function () {
            // This is called even on 404 etc
            // so check the status
            if (req.status === 200) {
                // Resolve the promise with the response text
                eval(req.response);
                console.log('Got jQuery, other loading will now begin.');
                callback(req.response);
            } else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                error(new Error("Could not load jQuery: " + req.statusText));
            }
        };

        onerrorF = function () {
            error(new Error("Could not load jQuery: " + "Network Error"));
        };

        req = new XMLHttpRequest();
        req.open('GET', jQueryURL);

        req.onload = onloadF;

        // Handle network errors
        req.onerror = onerrorF;

        // Make the request
        req.send();
    };

    getPolyfill = function (callback, error) {
        console.warn('This browser does not support promises, ' +
            'getting polyfill for promises, but this only offers' +
            'partial support, see: ' +
            'https://github.com/jakearchibald/es6-promise#readme');
        $.ajax({
            url: polyfillPromiseURL,
            dataType: "script",
            success: callback,
            error: error
        });
    };

    getRest = function () {
        var i, promises = [], errorFunc;

        errorFunc = function (err) {
            //If it fails then display an error
            console.error('Failed to get core module: ' +
                err);
            //Do not return anything so then can still work
        };

        //This grabs all other packages that are of interest.
        for (i = 0; i < restURL.length; i += 1) {
            //Add promise to promises array
            promises.push(ajaxPromise(restURL[i]).catch(errorFunc));
        }

        //All promises submitted, wait for them to finish
        Promise.all(promises).then(redefineCoreFunctions);
    };

    polyfillPromises = function () {
        if (!window.Promise) {
            //If promises are not native, load them in.
            getPolyfill(getRest, function (x1) {
                getPolyfill(getRest, function (x2) {
                    console.error("After two attempts, could not load Promises.",
                        x1, x2);
                });
            });
        } else {
            getRest();
        }
    };


    //Start the actual work
    if (!window.jQuery) {
        //get jQuery, try twice then throw an error
        getJquery(polyfillPromises, function (x1) {
            getJquery(polyfillPromises, function (x2) {
                console.error("After two attempts, could not load jQuery.",
                    x1, x2);
            });
        });
    }

    return coreObj;

}());
