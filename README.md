# amd_core

For a working example please go to: https://alexdussaq.info/amd_core/<br />
The same example is shown below and is included as index.html in this directory.

This package insures that the following scripts are loaded before any calculation has taken place:
* jquery-2.1.4.min.js
* es6-promise-3.0.2.min.js [*Only loads in enviornments where __window.Promise__ is undefined*]

Following this a series of core functions are added onto the amd_core object. They are detailed below.

###**amd_core**###
|Property|Description|
|---------------|----------------|
|require|[*function*] Following the loading of the above required list, this loads a list of scripts described by it's input: **require_object** [*required, object*]. If any script has already been loaded, it will not be loaded again. Once all scripts have loaded it executes the callback function described in the same object. |
|isArray|[*function*] Takes in any JavaScript object, and returns true if the object is an array, false otherwise. |


###**require_object**###
|Property|Description|
|---------------|----------------|
|async|[*optional, array*] If included, this must be an array of urls [*string*]. These will all be loaded asynchronously, the more modules you can include here the faster your page will load. |
|ordered|[*optional, 2D arrary*] If included, this must be an array of arrays, each internal array is an array of urls [*string*] for scripts that depend on being loaded one at a time sequentially. |
|callback|[*required, function*] Executed upon completion of loading of all scripts described above. The callback is passed an array of url_objs [*object*]. |

###**url_objs**###
|Property|Description|
|---------------|----------------|
|url|[*string*] Address of script loaded|
|loaded|[*boolean*] True/False for if the script successfully loaded.|


##Minimal example of how to utilize amd_core.require.##
To try yourself: https://alexdussaq.info/amd_core/

    amd_core.require({
        async: [name/sue.js, name/billy.js, name/kelly.js], //We do not care the order we are loaded
        ordered: [  //Each one of these will start loading at their base node at the same time
                    // In otherwords John and Sally will start loading immediately, once john is done
                    // Lou, and bob will start loading, etc.
            [
                name/john.js
                name/lou.js // I cant load without john
                name/tom.js // I cant load without john and lou
            ],
            [
                name/john.js // This will still only be loaded once
                name/bob.js // I cant load without john
            ],
            [
                name/john.js // This will still only be loaded once
                name/lou.js // This will still only be loaded once, but I cant load without john
                name/cindy.js // I cant load without john and lou
            ],
            [
                name/sally.js,
                name/harry.js //I can't load without sally
            ]
        ],
        callback: function (x) {
            for (var i = 0; i < x.length; i += 1) {
                var name = x.url.replace(/name\/|\.js/g, "");
                if (x.loaded) {
                    console.log(name + ' is here!');
                } else {
                    console.log(name + ' never showed up...');
                }
            }
        }

    });
    

##simpleCubic.jseo##
    {
        func: function (xVector, P) {
            return P[0] * Math.pow(xVector[0],3) + P[1];
        },
        setInitial: function (x_mat, y_vec) {
            var A = ( y_vec[1] - y_vec[0] ) / (Math.pow(x_mat[1][0], 3) - Math.pow(x_mat[0][0], 3));
            var B = y_vec[0] - A * Math.pow(x_mat[0][0], 3);
            return [A, B];
        }
    }

These modules were combined with the following visualization libraries: google chart tools (https://developers.google.com/chart/), jqmath (http://mathscribe.com/author/jqmath.html), and bootstrap (http://getbootstrap.com/) to create a tool to visualize individual curve fits for a unique biological data set. This is avaliable at http://kinome.github.io/demo-cf/#model.
