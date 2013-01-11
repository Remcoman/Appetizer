/**
 * User: remcokrams
 * Date: 17-08-12
 * Time: 17:30
 */
 
/*
Bootstrap file
*/

/**
 * Creates a object which acts as a wrapper around el
 *
 * Returns a object with a forEach and isEmpty function
 * The forEach function calls a callback for each matched element
 * The isEmpty returns true if there are no matched elements. Otherwise it returns false
 *
 * el can be a selector, DOMElement or jQuery|Zepto object
 *
 * @param {String|Node|JQuery} el
 * @param {Boolean} multiple
 * @return {Object}
 */
var getElementWrapper = function (el, multiple) {
   var $ = window.jQuery || window.Zepto;

   var items;

   if($) { //use jQuery to get the element and return a wrapper
       items = $(el);

       if(!multiple) {
           items = items.first(); //give back the first item
       }

       return {
           forEach : function (callback) {
               items.each(function (index, value) { //index, value is reversed from standard forEach
                   callback(value);
               });
           },
           isEmpty : function () {
               return items.length == 0;
           }
       }
   }

   items = [];

   if(typeof el === "object" && el.nodeType == 1) { //el is of type DOMElement
       items.push(el);
   }
   else if(typeof el === "string") { //el is selector
       if(el.charAt(0) == "#") { //simple id
           el = document.getElementById( el.substr(1) );
           if(el)
              items.push( el );
       }
       else if(typeof document.querySelector === "function") { //complex selector
           if(multiple) {
               items = Array.prototype.slice.call(document.querySelectorAll(el), 0);
           }
           else {
               el = document.querySelector(el);
               if(el)
                   items.push( el );
           }
       }
       else {
           throw new Error("Selector was passed as el but no functionality was available in the browser to get the actual element");
       }
   }

   return {
       isEmpty : function () {
           return items.length == 0;
       },

       forEach : typeof items.forEach === "function" ? items.forEach.bind(items) : function (callback) {
           for(var i= 0, len = items.length;i < len;i++) {
               callback(items[i]);
           }
       }
   };
}

var extractOptionsFromQueryString = function (query) {
    var regex = /[&]?([^=&]+)(?:=([^&]+))?/g,
        m;

    var options = {};

    if(query.charAt(0) == "?")
        query = query.substr(1);

    while((m = regex.exec(query)) != null)
        options[ m[1] ] = decodeURIComponent(m[2]);

    return options;
}

var extractDataAttributes = function (element) {
    var dataset, live = false;

    if(typeof element.data === "function") {
        dataset = element.data();
        live = true;
    }
    else if(typeof element.dataset !== "undefined") {
        dataset = element.dataset;
        live = true;
    }
    else {
        dataset = {};
        for(var i=0, attr;attr = element.attributes[i++];) {
            if(attr.name.indexOf("data-") == 0)
                dataset[attr.substr(5)] = attr.value;
        }
    }

    if(live) {
        //create a static copy. Because the dataset is live in some cases
        var attrs = {};
        for(var prop in dataset) if(dataset.hasOwnProperty(prop)) {
            attrs[prop] = dataset[prop];
        }
    }
    else {
        attrs = dataset;
    }

    return attrs;
}

/**
 * Creates the global App.instance object
 * @param {Function} fn a reference to a function that returns the app instance
 * @param {String} appId the name of your app (a global object with this name will be created)
 * @param {Bool} multipleInstances if false only one instance will be allowed (App.instance will point to that instance) otherwise App.instance will be a dictionary
 */
module.exports = function (fn, appId, multipleInstances) {
    var idCounter = 0;
    var getId = function (element) {
        if(element.id) {
            return element.id;
        }
        else {
            return appId + "-" + (++idCounter);
        }
    }

    window[appId || "App"] = {
        instance : !multipleInstances ? null : {},

        /**
         * Get a app instance by its id
         * @param id
         * @return {*}
         */
        getInstanceById : function (id) {
            if(!multipleInstances) {
                return this.instance;
            }
            else {
                return this.instance.hasOwnProperty(id) ? this.instance[id] : null;
            }
        },

        /**
         * Creates a new instance
         * @param {String|HTMLElement} element
         * @param {Object} options
         * @return {Object}
         */
        create : function (element, options) {
            var wrapper = getElementWrapper(element, multipleInstances);

            if(wrapper.isEmpty()) {
                throw new Error("Element is not specified");
            }

            var instancesCreated = [];

            var me = this;
            wrapper.forEach(function (elementItem) {
                if(typeof options == "string") {
                    options = extractOptionsFromQueryString(options);
                }

                if(!options) {
                    options = extractDataAttributes(elementItem);
                }

                var instance = new fn(elementItem, options || {});
                if(!multipleInstances) {
                    me.instance = instance;
                }
                else {
                    instancesCreated.push(instance);
                    elementItem.id = getId(elementItem);
                    me.instance[ elementItem.id ] = instance;
                }
            });

            return multipleInstances ? instancesCreated : this.instance;
        }
    }
}