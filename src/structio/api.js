/*

StructIO
========

Copyright (c) 2011 The Parchment Contributors
BSD licenced
http://code.google.com/p/parchment

*/

/*

TODO:
	Timed input
	input terminators
	Listen for the window being resized to smaller than the current width
	Allow the window to be drag-resized
	Detect that position: fixed doesn't work

*/

// Function to replace initial spaces with entities the browsers will respect. &ensp; seems a better width than &nbsp;
var space_replacer = function( spaces )
{
	return '\n' + Array( spaces.length ).join( '&ensp;' );
},

spanningEnabled = true,

// Root stream handler. Some structures (like text grids) could have alternative handlers
basic_stream_handler = function( e )
{
	var order = e.order,
	struct = e.io.structures[order.name] || { node: 'span' },
	node = order.node || struct.node,
	text = order.text,
	
	// Create the new element and set everything that needs to be set
	elem = $( '<' + node + '>' )
		.appendTo( e.target )
		.addClass( order.name )
		.css( order.css || {} );
	if ( order.css && order.css.reverse )
	{
		do_reverse( elem );
	}
	// Add the text, if we've been given any
	if ( text )
	{
		// Fix initial spaces, but not for tt (which will actually mess it up)
		// For tt's, fix all spaces so that they will still wrap
		text = node == 'tt' ? text.replace( /( +)/g, '<span class="space">$1</span>' ) : text.replace( /\n +(?=\S)/g, space_replacer );

		elem.html( text.replace( /\n/g, '<br>' ) );

        if(spanningEnabled) {
            // surround each word with clickable span tags
            spanify(elem);

            // on double clicking a word, add it to the input line
            setTimeout(function() {
                elem.find('.clk-add').dblclick(addWordToLine)
            }, 100);

            // clean up old spans, so the pages doesn't get too clutered with elements for every single word
            despanifySibling(elem, 15);
        }
	}
	
	// If we have a custom function to run, do so
	if ( struct.func )
	{
		struct.func( elem, e.io );
	}
		
	return false;
},

// Surround each word in the element with span tags
spanify = function($elem) {
    $elem.contents().each(function() {
        // if this child is a text node, do a regex replace
        if(this.nodeValue != null) {
            // surround the each word in the text node with a span
            var spanHTML = this.nodeValue.replace(/(\b\w+\b)/g, "<span class='clk-add'>$1</span>");

            // HACK: surround HTML with dummy <a> tags that will will clean up at the end
            // This is because jQuery drops bookending text nodes but not element nodes, e.g.:
            //   $("foo <span>bar</span> baz") == [<span>bar</span>]
            //   $("<a></a>foo <span>baz</span> baz<a></a>") == [<a></a>, "foo ", <span>bar</span>, " baz", <a></a>]
            spanHTML = "<a class='parchment-remove-me'></a>" + spanHTML + "<a class='parchment-remove-me'></a>";

            // build the HTML string and replace the text node with it
            $(this).replaceWith( $(spanHTML) );
        } else {
            // if this is an element node, recursively spanify child elements
            spanify($(this));
        }
    });
    // clean up all bookending dummy tags
    $elem.children("a.parchment-remove-me").remove();
},


// Find nth-last sibling of the element and despanify it
despanifySibling = function($elem, n) {
        var siblings = $elem.parent().children();
        if(siblings.length > n) {
            despanify( siblings.eq(siblings.length - n - 1) );
        }
},

// Replace all clickable spans in the element with their text
despanify = function($elem) {
    $elem.find(".clk-add").replaceWith(function() {
        return this.innerText || this.textContent;
    });
},

// Add the innerText value of the calling (e.g. clicked) element to the input line
// (Should be used an event listener) 
addWordToLine = function() {
    // get the clicked word and the input line text
    var addText = this.innerText || this.textContent;
    var currentText = $(".TextInput").val();
    // add the clicked word to the input line (with a leading space, if appropriate)
    if(currentText.lastIndexOf(" ") == currentText.length-1 || currentText == "") {
        $(".TextInput").val(currentText + addText);
    } else {
        $(".TextInput").val(currentText + " " + addText);
    }
    // after the doubleclick, return focus to the input line
    $(".TextInput").focus();
},

// Pattern for getting the RGB components from a colour
RGB_pattern = /(\d+),\s*(\d+),\s*(\d+)/,

// The public API
// .input() must be set by whatever uses StructIO
StructIO = Object.subClass({
	
	init: function( env )
	{
		env = extend( {}, env );
		this.env = env;
		var element = $( env.container ),
		
		// Calculate the width we want
		measureelem = $( '<tt>00000</tt>' )
			.appendTo( element ),
		charheight = measureelem.height(),
		charwidth = measureelem.width() / 5,
		widthinchars = Math.min( Math.floor( element.width() / charwidth ), env.width || 80 );
		measureelem.remove();
		
		extend( env, {
			charheight: charheight,
			charwidth: charwidth,
			width: widthinchars,
			fgcolour: RGB_pattern.exec( element.css( 'color' ) ).slice( 1 ),
			bgcolour: RGB_pattern.exec( element.css( 'bgcolor' ) ).slice( 1 )
		});
		// Set the container's width: +2 to account for the 1px of padding the structures inside will receive to hide obnoxious serifs
		element.width( widthinchars * charwidth + 2 );
		
		this.container = element
		this.target = element;
		element.on( 'stream', basic_stream_handler );
		this.TextInput = new TextInput( element );
		
		// Default structures
		this.structures = {
			main: {
				node: 'div'
			},
			status: {
				node: 'div',
				func: function( elem, io ) { new TextGrid( elem, io ); }
			}
		};
	},
	
	// Process some output events
	event: function( orders )
	{
		var order, code, i,
		target = this.target,
		temp;
		
		// Process the orders
		for ( i = 0; i < orders.length; i++ )
		{
			order = orders[i];
			code = order.code;
			
			// Specify the elements to use for various structures
			// All structures must specify at least the node to use
			if ( code == 'structures' )
			{
				order.code = undefined;
				$.extend( this.structures, order );
			}
			
			// Find a new target element
			if ( code == 'find' )
			{
				this.target = target = $( '.' + order.name );
			}
			
			// Add a structure
			if ( code == 'stream' )
			{
				// .to will let you temporarily stream to something else
				( order.to ? $( '.' + order.to ) : target )
					.trigger({
						type: 'stream',
						io: this,
						order: order
					});
			}
			
			if ( code == 'clear' )
			{
				var temp = order.name ? $( '.' + order.name ) : target;
				temp.empty();
				// Set the background colour
				// If we're clearing the main window, then change <body> instead
				if ( order.css && order.css['background-color'] )
				{
					( order.name == 'main' ? $body : temp ).css( 'background-color', order.css['background-color'] );
				}
			}
			
			// Line input
			if ( code == 'read' )
			{
				order.target = target;
				this.TextInput.getLine( order );
			}
			
			// Character input
			if ( code == 'char' )
			{
				this.TextInput.getChar( order );
			}
		}
	}
});
