/*!
 * Simple JavaScript Inheritance
 * http://ejohn.org/blog/simple-javascript-inheritance/
 *
 * By John Resig
 * Released into the public domain?
 *
 * Inspired by base2 and Prototype
 */
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();
/*!
 * Interchange File Format library
 *
 * Copyright (c) 2003-2009 The Gnusto Contributors
 * Licenced under the GPL v2
 * http://github.com/curiousdannii/gnusto
 */
(function(){

// Get a 32 bit number from a byte array, and vice versa
function num_from(s, offset)
{
	return s[offset] << 24 | s[offset + 1] << 16 | s[offset + 2] << 8 | s[offset + 3];
}

function num_to_word(n)
{
	return [(n >> 24) & 0xFF, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

// Get a 4 byte string ID from a byte array, and vice versa
function text_from(s, offset)
{
	var fromCharCode = String.fromCharCode;
	return fromCharCode(s[offset]) + fromCharCode(s[offset + 1]) + fromCharCode(s[offset + 2]) + fromCharCode(s[offset + 3]);
}

function text_to_word(t)
{
	return [t.charCodeAt(0), t.charCodeAt(1), t.charCodeAt(2), t.charCodeAt(3)];
}

var FORM = 'FORM',

// IFF file class
// Parses an IFF file stored in a byte array
IFF = Class.extend({
	// Parse a byte array or construct an empty IFF file
	init: function parse_iff(data)
	{
		this.type = '';
		this.chunks = [];
		if (data)
		{
			// Check this is an IFF file
			if (text_from(data, 0) != FORM)
				throw new Error("Not an IFF file");

			// Parse the file
			this.type = text_from(data, 8);

			var i = 12, l = data.length;
			while (i < l)
			{
				var chunk_length = num_from(data, i + 4);
				if (chunk_length < 0 || (chunk_length + i) > l)
					// FIXME: do something sensible here
					throw new Error("IFF: Chunk out of range");

				this.chunks.push({
					type: text_from(data, i),
					offset: i,
					data: data.slice(i + 8, i + 8 + chunk_length)
				});

				i += 8 + chunk_length;
				if (chunk_length % 2) i++;
			}
		}
	},

	// Write out the IFF into a byte array
	write: function write_iff()
	{
		// Start with the IFF type
		var out = text_to_word(this.type);

		// Go through the chunks and write them out
		for (var i = 0, l = this.chunks.length; i < l; i++)
		{
			var chunk = this.chunks[i], data = chunk.data, len = data.length;
			out = out.concat(text_to_word(chunk.type), num_to_word(len), data);
			if (len % 2)
				out.push(0);
		}

		// Add the header and return
		return text_to_word(FORM).concat(num_to_word(out.length), out);
	}
});

// Expose the class and helper functions
IFF.num_from = num_from;
IFF.num_to_word = num_to_word;
IFF.text_from = text_from;
IFF.text_to_word = text_to_word;
window.IFF = IFF;

})();
/*!
 * Copyright (c) 2006 Brandon Aaron (brandon.aaron@gmail.com || http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 *
 * $LastChangedDate: 2007-12-20 09:02:08 -0600 (Thu, 20 Dec 2007) $
 * $Rev: 4265 $
 *
 * Version: 3.0
 * 
 * Requires: $ 1.2.2+
 */

(function($) {

$.event.special.mousewheel = {
	setup: function() {
		var handler = $.event.special.mousewheel.handler;
		
		// Fix pageX, pageY, clientX and clientY for mozilla
		if ( $.browser.mozilla )
			$(this).bind('mousemove.mousewheel', function(event) {
				$.data(this, 'mwcursorposdata', {
					pageX: event.pageX,
					pageY: event.pageY,
					clientX: event.clientX,
					clientY: event.clientY
				});
			});
	
		if ( this.addEventListener )
			this.addEventListener( ($.browser.mozilla ? 'DOMMouseScroll' : 'mousewheel'), handler, false);
		else
			this.onmousewheel = handler;
	},
	
	teardown: function() {
		var handler = $.event.special.mousewheel.handler;
		
		$(this).unbind('mousemove.mousewheel');
		
		if ( this.removeEventListener )
			this.removeEventListener( ($.browser.mozilla ? 'DOMMouseScroll' : 'mousewheel'), handler, false);
		else
			this.onmousewheel = function(){};
		
		$.removeData(this, 'mwcursorposdata');
	},
	
	handler: function(event) {
		var args = Array.prototype.slice.call( arguments, 1 );
		
		event = $.event.fix(event || window.event);
		// Get correct pageX, pageY, clientX and clientY for mozilla
		$.extend( event, $.data(this, 'mwcursorposdata') || {} );
		var delta = 0, returnValue = true;
		
		if ( event.wheelDelta ) delta = event.wheelDelta/120;
		if ( event.detail     ) delta = -event.detail/3;
		if ( $.browser.opera  ) delta = -event.wheelDelta;
		
		event.data  = event.data || {};
		event.type  = "mousewheel";
		
		// Add delta to the front of the arguments
		args.unshift(delta);
		// Add event to the front of the arguments
		args.unshift(event);

		return $.event.handle.apply(this, args);
	}
};

$.fn.extend({
	mousewheel: function(fn) {
		return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
	},
	
	unmousewheel: function(fn) {
		return this.unbind("mousewheel", fn);
	}
});

})(jQuery);
/*!
(c) Copyrights 2007 - 2008

Original idea by by Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
 
jQuery Plugin by Tzury Bar Yochay 
tzury.by@gmail.com
http://evalinux.wordpress.com
http://facebook.com/profile.php?id=513676303

Project's sites: 
http://code.google.com/p/js-hotkeys/
http://github.com/tzuryby/hotkeys/tree/master

License: same as jQuery license. 
*/
/*
USAGE:
    // simple usage
    $(document).bind('keydown', 'Ctrl+c', function(){ alert('copy anyone?');});
    
    // special options such as disableInIput
    $(document).bind('keydown', {combi:'Ctrl+x', disableInInput: true} , function() {});
    
Note:
    This plugin wraps the following jQuery methods: $.fn.find, $.fn.bind and $.fn.unbind
    
*/


(function (jQuery){
    // keep reference to the original $.fn.bind and $.fn.unbind
    jQuery.fn.__bind__ = jQuery.fn.bind;
    jQuery.fn.__unbind__ = jQuery.fn.unbind;
    jQuery.fn.__find__ = jQuery.fn.find;
    
    var hotkeys = {
        version: '0.7.8',
        override: /keydown|keypress|keyup/g,
        triggersMap: {},
        
        specialKeys: { 27: 'esc', 9: 'tab', 32:'space', 13: 'return', 8:'backspace', 145: 'scroll', 
            20: 'capslock', 144: 'numlock', 19:'pause', 45:'insert', 36:'home', 46:'del',
            35:'end', 33: 'pageup', 34:'pagedown', 37:'left', 38:'up', 39:'right',40:'down', 
            112:'f1',113:'f2', 114:'f3', 115:'f4', 116:'f5', 117:'f6', 118:'f7', 119:'f8', 
            120:'f9', 121:'f10', 122:'f11', 123:'f12' },
        
        shiftNums: { "`":"~", "1":"!", "2":"@", "3":"#", "4":"$", "5":"%", "6":"^", "7":"&", 
            "8":"*", "9":"(", "0":")", "-":"_", "=":"+", ";":":", "'":"\"", ",":"<", 
            ".":">",  "/":"?",  "\\":"|" },
        
        newTrigger: function (type, combi, callback) { 
            // i.e. {'keyup': {'ctrl': {cb: callback, disableInInput: false}}}
            var result = {};
            result[type] = {};
            result[type][combi] = {cb: callback, disableInInput: false};
            return result;
        }
    };
    // add firefox num pad char codes
    if (jQuery.browser.mozilla){
        hotkeys.specialKeys = jQuery.extend(hotkeys.specialKeys, { 96: '0', 97:'1', 98: '2', 99: 
            '3', 100: '4', 101: '5', 102: '6', 103: '7', 104: '8', 105: '9' });
    }
    
    // a wrapper around of $.fn.find 
    // see more at: http://groups.google.com/group/jquery-en/browse_thread/thread/18f9825e8d22f18d
    jQuery.fn.find = function( selector ) {
        this.query=selector;
        return jQuery.fn.__find__.apply(this, arguments);
	};
    
    jQuery.fn.unbind = function (type, combi, fn){
        if (jQuery.isFunction(combi)){
            fn = combi;
            combi = null;
        }
        if (combi && typeof combi === 'string'){
            var selectorId = ((this.prevObject && this.prevObject.query) || (this[0].id && this[0].id) || this[0]).toString();
            var hkTypes = type.split(' ');
            for (var x=0; x<hkTypes.length; x++){
                delete hotkeys.triggersMap[selectorId][hkTypes[x]][combi];
            }
        }
        // call jQuery original unbind
        return  this.__unbind__(type, fn);
    };
    
    jQuery.fn.bind = function(type, data, fn){
        // grab keyup,keydown,keypress
        var handle = type.match(hotkeys.override);
        
        if (jQuery.isFunction(data) || !handle){
            // call jQuery.bind only
            return this.__bind__(type, data, fn);
        }
        else{
            // split the job
            var result = null,            
            // pass the rest to the original $.fn.bind
            pass2jq = jQuery.trim(type.replace(hotkeys.override, ''));
            
            // see if there are other types, pass them to the original $.fn.bind
            if (pass2jq){
                // call original jQuery.bind()
                result = this.__bind__(pass2jq, data, fn);
            }            
            
            if (typeof data === "string"){
                data = {'combi': data};
            }
            if(data.combi){
                for (var x=0; x < handle.length; x++){
                    var eventType = handle[x];
                    var combi = data.combi.toLowerCase(),
                        trigger = hotkeys.newTrigger(eventType, combi, fn),
                        selectorId = ((this.prevObject && this.prevObject.query) || (this[0].id && this[0].id) || this[0]).toString();
                        
                    //trigger[eventType][combi].propagate = data.propagate;
                    trigger[eventType][combi].disableInInput = data.disableInInput;
                    
                    // first time selector is bounded
                    if (!hotkeys.triggersMap[selectorId]) {
                        hotkeys.triggersMap[selectorId] = trigger;
                    }
                    // first time selector is bounded with this type
                    else if (!hotkeys.triggersMap[selectorId][eventType]) {
                        hotkeys.triggersMap[selectorId][eventType] = trigger[eventType];
                    }
                    // make trigger point as array so more than one handler can be bound
                    var mapPoint = hotkeys.triggersMap[selectorId][eventType][combi];
                    if (!mapPoint){
                        hotkeys.triggersMap[selectorId][eventType][combi] = [trigger[eventType][combi]];
                    }
                    else if (mapPoint.constructor !== Array){
                        hotkeys.triggersMap[selectorId][eventType][combi] = [mapPoint];
                    }
                    else {
                        hotkeys.triggersMap[selectorId][eventType][combi][mapPoint.length] = trigger[eventType][combi];
                    }
                    
                    // add attribute and call $.event.add per matched element
                    this.each(function(){
                        // jQuery wrapper for the current element
                        var jqElem = jQuery(this);
                        
                        // element already associated with another collection
                        if (jqElem.attr('hkId') && jqElem.attr('hkId') !== selectorId){
                            selectorId = jqElem.attr('hkId') + ";" + selectorId;
                        }
                        jqElem.attr('hkId', selectorId);
                    });
                    result = this.__bind__(handle.join(' '), data, hotkeys.handler)
                }
            }
            return result;
        }
    };
    // work-around for opera and safari where (sometimes) the target is the element which was last 
    // clicked with the mouse and not the document event it would make sense to get the document
    hotkeys.findElement = function (elem){
        if (!jQuery(elem).attr('hkId')){
            if (jQuery.browser.opera || jQuery.browser.safari){
                while (!jQuery(elem).attr('hkId') && elem.parentNode){
                    elem = elem.parentNode;
                }
            }
        }
        return elem;
    };
    // the event handler
    hotkeys.handler = function(event) {
        var target = hotkeys.findElement(event.currentTarget), 
            jTarget = jQuery(target),
            ids = jTarget.attr('hkId');
        
        if(ids){
            ids = ids.split(';');
            var code = event.which,
                type = event.type,
                special = hotkeys.specialKeys[code],
                // prevent f5 overlapping with 't' (or f4 with 's', etc.)
                character = !special && String.fromCharCode(code).toLowerCase(),
                shift = event.shiftKey,
                ctrl = event.ctrlKey,            
                // patch for jquery 1.2.5 && 1.2.6 see more at:  
                // http://groups.google.com/group/jquery-en/browse_thread/thread/83e10b3bb1f1c32b
                alt = event.altKey || event.originalEvent.altKey,
                mapPoint = null;

            for (var x=0; x < ids.length; x++){
                if (hotkeys.triggersMap[ids[x]][type]){
                    mapPoint = hotkeys.triggersMap[ids[x]][type];
                    break;
                }
            }
            
            //find by: id.type.combi.options            
            if (mapPoint){ 
                var trigger;
                // event type is associated with the hkId
                if(!shift && !ctrl && !alt) { // No Modifiers
                    trigger = mapPoint[special] ||  (character && mapPoint[character]);
                }
                else{
                    // check combinations (alt|ctrl|shift+anything)
                    var modif = '';
                    if(alt) modif +='alt+';
                    if(ctrl) modif+= 'ctrl+';
                    if(shift) modif += 'shift+';
                    
                    // modifiers + special keys or modifiers + character or modifiers + shift character or just shift character
                    trigger = mapPoint[modif+special];
                    if (!trigger){
                        if (character){
                            trigger = mapPoint[modif+character] 
                                || mapPoint[modif+hotkeys.shiftNums[character]]
                                // '$' can be triggered as 'Shift+4' or 'Shift+$' or just '$'
                                || (modif === 'shift+' && mapPoint[hotkeys.shiftNums[character]]);
                        }
                    }
                }
                if (trigger){
                    var result = false;
                    for (var x=0; x < trigger.length; x++){
                        if(trigger[x].disableInInput){
                            // double check event.currentTarget and event.target
                            var elem = jQuery(event.target);
                            if (jTarget.is("input") || jTarget.is("textarea") 
                                || elem.is("input") || elem.is("textarea")) {
                                return true;
                            }
                        }
                        // call the registered callback function
                        result = result || trigger[x].cb.apply(this, [event]);
                    }
                    return result;
                }
            }
        }
    };
    // place it under window so it can be extended and overridden by others
    window.hotkeys = hotkeys;
    return jQuery;
})(jQuery);
/* Client-side access to querystring name=value pairs
	Version 1.2.4
	30 March 2008
	Adam Vandenberg
*/
function Querystring(qs) { // optionally pass a querystring to parse
	this.params = {};
	this.get=Querystring_get;

	if (qs == null);
		qs=location.search.substring(1,location.search.length);

	if (qs.length == 0)
		return;

// Turn <plus> back to <space>
// See: http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.4.1
	qs = qs.replace(/\+/g, ' ');
	var args = qs.split('&'); // parse out name/value pairs separated via &

// split out each name=value pair
	for (var i=0;i<args.length;i++) {
		var pair = args[i].split('=');
		var name = unescape(pair[0]);

		var value = (pair.length==2)
			? unescape(pair[1])
			: name;

		this.params[name] = value;
	}
}

function Querystring_get(key, default_) {
	var value=this.params[key];
	return (value!=null) ? value : default_;
}
/*!
 * Taken from "Remedial Javascript" by Douglas Crockford:
 * http://javascript.crockford.com/remedial.html
 */

function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}


function isEmpty(o) {
    var i, v;
    if (typeOf(o) === 'object') {
        for (i in o) {
            v = o[i];
            if (v !== undefined && typeOf(v) !== 'function') {
                return false;
            }
        }
    }
    return true;
}

String.prototype.entityify = function () {
    return this.replace(/&/g, "&amp;").replace(/</g,
        "&lt;").replace(/>/g, "&gt;");
};

String.prototype.quote = function () {
    var c, i, l = this.length, o = '"';
    for (i = 0; i < l; i += 1) {
        c = this.charAt(i);
        if (c >= ' ') {
            if (c === '\\' || c === '"') {
                o += '\\';
            }
            o += c;
        } else {
            switch (c) {
            case '\b':
                o += '\\b';
                break;
            case '\f':
                o += '\\f';
                break;
            case '\n':
                o += '\\n';
                break;
            case '\r':
                o += '\\r';
                break;
            case '\t':
                o += '\\t';
                break;
            default:
                c = c.charCodeAt();
                o += '\\u00' + Math.floor(c / 16).toString(16) +
                    (c % 16).toString(16);
            }
        }
    }
    return o + '"';
};

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
};
function FatalError(message) {
  this.message = message;
  this.traceback = this._makeTraceback(arguments.callee);
  this.onError(this);
}

FatalError.prototype = {
  onError: function(e) { },

  _makeTraceback: function(procs) {
    // This function was taken from gnusto-engine.js and modified.
    var procstring = '';

    var loop_count = 0;
    var loop_max = 100;

    while (procs != null && loop_count < loop_max) {
      var name = procs.toString();

      if (!name) {
	procstring = '\n  (anonymous function)'+procstring;
      } else {
	var r = name.match(/function (\w*)/);

	if (!r || !r[1]) {
	  procstring = '\n  (anonymous function)' + procstring;
	} else {
          procstring = '\n  ' + r[1] + procstring;
	}
      }

      try {
        procs = procs.caller;
      } catch (e) {
        // A permission denied error may have just been raised,
        // perhaps because the caller is a chrome function that we
        // can't have access to.
        procs = null;
      }
      loop_count++;
    }

    if (loop_count==loop_max) {
      procstring = '...' + procstring;
    }

    return "Traceback (most recent call last):\n" + procstring;
  }
};
/*!
 * Parchment
 *
 * Copyright (c) 2003-2009 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */

// Don't append a timestamp to XHR requests
$.ajaxSetup({cache: true});

// The home for Parchment to live in
var parchment = {};
/*
 * File functions and classes
 *
 * Copyright (c) 2003-2009 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(window){

// Saved regexps
var base64_wrapper = /\(['"](.+)['"]\)/,

// Text to byte array and vice versa
text_to_array = function(text, array)
{
	var array = array || [], i = 0, l;
	for (l = text.length % 8; i < l; ++i)
		array.push(text.charCodeAt(i) & 0xff);
	for (l = text.length; i < l;)
		// Unfortunately unless text is cast to a String object there is no shortcut for charCodeAt,
		// and if text is cast to a String object, it's considerably slower.
		array.push(text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff,
			text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff, text.charCodeAt(i++) & 0xff);
	return array;
},

array_to_text = function(array, text)
{
	var text = text || '', i = 0, l, fromCharCode = String.fromCharCode;;
	for (l = array.length % 8; i < l; ++i)
		text += fromCharCode(array[i]);
	for (l = array.length; i < l;)
		text += (fromCharCode(array[i++]) + fromCharCode(array[i++]) +
		fromCharCode(array[i++]) + fromCharCode(array[i++]) +
		fromCharCode(array[i++]) + fromCharCode(array[i++]) +
		fromCharCode(array[i++]) + fromCharCode(array[i++]));
	return text;
};

// Base64 encoding and decoding
// Use the native base64 functions if available
if (window.atob)
{
	var base64_decode = function(data, out)
	{
		var out = out || [];
		return text_to_array(atob(data), out);
	},

	base64_encode = function(data, out)
	{
		var out = out || '';
		return btoa(array_to_text(data, out));
	};
}

// Unfortunately we will have to use pure Javascript functions
// Originally taken from: http://ecmanaut.blogspot.com/2007/11/javascript-base64-singleton.html
// But so much has changed the reference the reference is hardly warranted now...
// TODO: Consider combining the eNs together first, then shifting to get the cNs (for the decoder)
else
{
	var encoder = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	// Run this little function to build the decoder array
	decoder = (function(text)
	{
		var out = [], i = 0;
		for (; i < text.length; i++)
			out[text.charAt(i)] = i;
		return out;
	})(encoder),

	base64_decode = function(data, out)
	{
	    var out = out || [],
	    c1, c2, c3, e1, e2, e3, e4,
	    i = 0, l = data.length;
	    while (i < l)
	    {
	        e1 = decoder[data.charAt(i++)];
	        e2 = decoder[data.charAt(i++)];
	        e3 = decoder[data.charAt(i++)];
	        e4 = decoder[data.charAt(i++)];
	        c1 = (e1 << 2) + (e2 >> 4);
	        c2 = ((e2 & 15) << 4) + (e3 >> 2);
	        c3 = ((e3 & 3) << 6) + e4;
	        out.push(c1, c2, c3);
	    }
	    if (e4 == 64)
	        out.pop();
	    if (e3 == 64)
	        out.pop();
	    return out;
	},

	base64_encode = function(data, out)
	{
	    var out = out || '',
	    c1, c2, c3, e1, e2, e3, e4,
	    i = 0, l = data.length;
		while (i < l)
		{
			c1 = data[i++];
			c2 = data[i++];
			c3 = data[i++];
			e1 = c1 >> 2;
			e2 = ((c1 & 3) << 4) + (c2 >> 4);
			e3 = ((c2 & 15) << 2) + (c3 >> 6);
			e4 = c3 & 63;

			// Consider other string concatenation methods?
			out += (encoder.charAt(e1) + encoder.charAt(e2) + encoder.charAt(e3) + encoder.charAt(e4));
		}
		if (isNaN(c2))
			out = out.slice(0, -2) + '==';
		else if (isNaN(c3))
			out = out.slice(0, -1) + '=';
		return out;
	};
}

// Download a file to a byte array
var download_to_array = function( url, callback ) {
	// Callback function for legacy .js storyfiles, process with base64
	var download_base64 = function ( data ) {
		// TODO: Investigate chunking the data
		callback( base64_decode( base64_wrapper.exec(data)[1] ));
	},
	
	// Callback function for raw binary data
	download_raw = function ( data ) {
		// Check to see if this could actually be base64 encoded
	
		callback(text_to_array(data));
	};

	// What are we trying to download here?

	// Looks like a legacy .js storyfile
	if ( url.slice(-3).toLowerCase() === '.js' ) {
		// Make the request
		// Only works on local files currently
		$.ajax({
			dataType: 'text',
			error: download_error,
			success: download_base64,
			url: url
		});

	// Downloading a raw binary file
	} else {
		// Make the request
		// Only works on local files currently
		$.ajax({
			beforeSend: binary_charset,
			dataType: 'text',
			error: download_error,
			success: download_raw,
			url: url
		});
	}

},

// Change the charset for binary data
binary_charset = function ( XMLHttpRequest ) {
	XMLHttpRequest.overrideMimeType('text/plain; charset=x-user-defined');
},

// Error callback
download_error = function ( XMLHttpRequest, textStatus ) {
	throw new FatalError('Error loading story: ' + textStatus);
};

/*
	// Images made from byte arrays
	file.image = base2.Base.extend({
		// Initialise the image with a byte array
		constructor: function init_image(chunk)
		{
			this.chunk = chunk;

			this.dataURI = function create_dataURI()
			{
				// Only create the image when first requested, the encoding could be quite slow
				// Would be good to replace with a getter if it can be done reliably
				var encoded = encode_base64(this.chunk.data);
				if (this.chunk.type == 'PNG ')
					this.URI = 'data:image/png;base64,' + encoded;
				else if (this.chunk.type == 'JPEG')
					this.URI = 'data:image/jpeg;base64,' + encoded;
				this.dataURI = function() {return this.URI;};
				return this.URI;
			};
		}
	});
*/

window.file = {
	text_to_array: text_to_array,
	array_to_text: array_to_text,
	base64_decode: base64_decode,
	base64_encode: base64_encode,
	download_to_array: download_to_array
};
})(window);
/*
 * Parchment UI
 *
 * Copyright (c) 2003-2009 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(){

window.gIsIphone = navigator.userAgent.match(/iPhone/i);

var topwin_element;
var topwin_dist = '0';

// Make the statusline always move to the top of the screen in MSIE < 7
$(document).ready(function() {
    topwin_element = document.getElementById('top-window');
    topwin_dist = '0';
    var ieMatch = navigator.appVersion.match(/MSIE (\d+)\./);
    if(ieMatch && +ieMatch[1]<7) {
        topwin_element.style.position = 'absolute';
        var move_element=function() {
            topwin_element.style.top = 1 * (document.documentElement.scrollTop + 1 * topwin_dist) + 'px';
        };
        window.onscroll = move_element;
        window.onresize = move_element;
    }
});

})();
/*
 * The Parchment Library
 *
 * Copyright (c) 2003-2010 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(window){

// A story file
var Story = IFF.extend({
	// Parse a zblorb or naked zcode story file
	init: function parse_zblorb(data, story_name)
	{
		this.title = story_name;

		// Check for naked zcode
		// FIXME: This check is way too simple. We should look at
		// some of the other fields as well for sanity-checking.
		if (data[0] < 9)
		{
			this.filetype = 'ok story naked zcode';
			this._super();
			this.chunks.push({
				type: 'ZCOD',
				data: data
			});
			this.zcode = data;
		}
		// Check for potential zblorb
		else if (IFF.text_from(data, 0) == 'FORM')
		{
			this._super(data);
			if (this.type == 'IFRS')
			{
				// We have Blorb!
//				this.images = [];
//				this.resources = [];

				// Go through the chunks and extract the useful ones
				for (var i = 0, l = this.chunks.length; i < l; i++)
				{
					var type = this.chunks[i].type;
/*
					if (type == 'RIdx')
						// The Resource Index Chunk, used by parchment for numbering images correctly
						for (var j = 0, c = IFF.num_from(this.chunks[i].data, 0); j < c; j++)
							this.resources.push({
								usage: IFF.text_from(this.chunks[i].data, 4 + j * 12),
								number: IFF.num_from(this.chunks[i].data, 8 + j * 12),
								start: IFF.num_from(this.chunks[i].data, 12 + j * 12)
							});
*/
					if (type == 'ZCOD' && !this.zcode)
						// Parchment uses the first ZCOD chunk it finds, but the Blorb spec says the RIdx chunk should be used
						this.zcode = this.chunks[i].data;

					else if (type == 'IFmd')
					{
						// Treaty of Babel metadata
						// Will most likely break UTF-8
						this.metadata = file.array_to_text(this.chunks[i].data);
						var metadataDOM = $(this.metadata);
						if (metadataDOM)
						{
							//this.metadataDOM = metadataDOM;

							// Extract some useful info
							if ($('title', metadataDOM))
								this.title = $('title', metadataDOM).text();
							if ($('ifid', metadataDOM))
								this.ifid = $('ifid', metadataDOM).text();
							if ($('release', metadataDOM))
								this.release = $('release', metadataDOM).text();
						}
					}
/*
					else if (type == 'PNG ' || type == 'JPEG')
						for (var j = 0, c = this.resources.length; j < c; j++)
						{
							if (this.resources[j].usage == 'Pict' && this.resources[j].start == this.chunks[i].offset)
								// A numbered image!
								this.images[this.resources[j].number] = new image(this.chunks[i]);
						}

					else if (type == 'Fspc')
						this.frontispiece = IFF.num_from(this.chunks[i].data, 0);
*/
				}

				if (this.zcode)
					this.filetype = 'ok story blorbed zcode';
				else
					this.filetype = 'error: no zcode in blorb';
			}
			// Not a blorb
			else if (this.type == 'IFZS')
				this.filetype = 'error: trying to load a Quetzal savefile';
			else
				this.filetype = 'error unknown iff';
		}
		else
			// Not a story file
			this.filetype = 'error unknown general';
	},

	// Load zcode into engine
	load: function loadIntoEngine(engine)
	{
		if (this.zcode)
			engine.loadStory(this.zcode);
		//window.document.title = this.title + ' - Parchment';
	}
}),

// Story file cache
StoryCache = Class.extend({
	// Add a story to the cache
	add: function(story)
	{
		this[story.ifid] = story;
		if (story.url)
			this.url[story.url] = story;
	},
	url: {}
}),

// Z-Machine launcher
launch_zmachine = function( url, library )
{
	// Store the story in this closure so we can still launch when things load out of order
	var story,

	// Callback to check if everything has loaded, and to launch the Z-Machine if so
	launch = function( data )
	{
		// Are we being called with a byte array story?
		if ( $.isArray(data) )
			story = data;
		
		// Check that everything has loaded
		if ( library.loaded_zmachine || 
		     window.GnustoEngine && window.Quetzal && window.EngineRunner && window.Console && window.WebZui && story )
		{
		     library.loaded_zmachine = true;
		     
		     process_bytearray( story );
		}
	};

	// Download the Z-Machine libs now so they can be parallelised
	if ( !library.loaded_zmachine )
	{
		// Get the correct files for parchment.full.html/parchment.html
		
		
		var libs = ['lib/gnusto.min.js', 'lib/zmachine.min.js'], i = 0, l = 2;
		
		while ( i < l )
		{
			$.getScript( libs[i], launch );
			i++;
		}
	}
		
	// Download the story
	file.download_to_array( url, launch );
},

// The Parchment Library class
Library = Class.extend({
	// Load a story or savefile
	load: function(id)
	{
		// Load from URL, or the default story
		var querystring = new Querystring(),
		url = querystring.get('story', parchment.options.default_story);

		storyName = url.slice( url.lastIndexOf("/") + 1 );
		storyName = storyName ? storyName + " - Parchment" : "Parchment";
		window.document.title = storyName;

		// Check the story cache first
		if (this.stories.url[url])
			var story = this.stories.url[url];

		// We will have to download it
		else
		{
			$('#progress-text').html('Retrieving story file...');
			// When Glulx support is added we will need to sniff the filename to decide which to launch
			launch_zmachine( url, this );
			//if (url.slice(-3).toLowerCase() == '.js')
			//	$.getScript(url);
			//else
			//	$.getScript(parchment.options.zcode_appspot_url + '?url=' + escape(url) + '&jsonp=processZcodeAppspotResponse');
		}
	},

	// Loaded stories and savefiles
	stories: new StoryCache(),
	savefiles: {}
});

window.gZcode = null;
window.gStory = '';

function process_bytearray( data ) {
	gZcode = data;
	$('#progress-text').html('Starting interpreter...');
	_webZuiStartup();
}

function _webZuiStartup() {
  var logfunc = function() {};

  if (window.console)
    logfunc = function(msg) { console.log(msg); };

  window.engine = new GnustoEngine(logfunc);
  var zui = new WebZui(logfunc);
  var runner = new EngineRunner(engine, zui, logfunc);

	window.story = new Story(gZcode.slice(), storyName);
	story.load(engine);
	logfunc("Story type: " + story.filetype);

  if (window.location.hash) {
    var b64data = window.location.hash.slice(1);
    engine.loadSavedGame(file.base64_decode(b64data));
    logfunc('Loading savefile');
  }

  runner.run();
}

window.Library = Library;

})(window);
/*
 * Parchment load scripts
 *
 * Copyright (c) 2003-2010 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(window){

var parchment = window.parchment;

// The default parchment options
parchment.options = {
	default_story: 'stories/troll.z5.js',
	zcode_appspot_url: 'http://zcode.appspot.com/'
};

// Load Parchment, start it all up!
function load_parchment()
{
	// Check for any customised options
	if (window.parchment_options)
		$.extend(parchment.options, parchment_options);

	// Load the library
	var library = new Library();
	parchment.library = library;
	library.load();

	// Add the Analytics tracker, but only if we're at parchment.googlecode.com
	if (location.href.slice(0, 31) == 'http://parchment.googlecode.com')
		$.getScript('http://www.google-analytics.com/ga.js', function(){gat._getTracker("UA-7949545-1")._trackPageview();});
}

$(load_parchment);

})(window);