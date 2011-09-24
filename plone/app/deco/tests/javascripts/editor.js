module("editor", {
    setup: function () {
        $(document.body).append($('<div class="test">' +
            '<p id="line1">Some paragraph with text</p>' +
            '<p id="line2">Some more text</p>' +
            '</div>'));

        // Init editor
        $('.test').decoEditor();
        $.deco.editor.registerFormat('blockclass', {block : 'div', attributes : {'class' : 'callout'}, expand : false, wrapper : true })
        $.deco.editor.registerFormat('inlineclass', {inline : 'span', attributes : {'class' : 'highlight'}})

        // Set document
        $.deco.document = window.document;
    },
    teardown: function () {

        // Remove test div
        $('.test').remove();
    }
});

test("Apply block formatting", function() {
    expect(1);

    // Set selection within test paragraph
    $.textSelect('setRange', {
        start : 5,
        startElement : $('#line1'),
        end : 14,
        endElement : $('#line1')
    });

    // Set header tag
    $.deco.editor.applyFormat('h1');

    // Check if the tag is replaced
    equals($('#line1').get(0).tagName.toLowerCase(), 'h1', "Header format was applied");
});

test("Apply inline formatting", function() {
    expect(1);

    // Set selection within test paragraph
    $.textSelect('setRange', {
        start : 5,
        startElement : $('#line1'),
        end : 14,
        endElement : $('#line1')
    });

    // Set strong to selection
    $.deco.editor.applyFormat('strong');

    // Check if the tag is replaced
    equals($('#line1').html(), 'Some <strong>paragraph</strong> with text', "The strong tag was applied");
});

test("Apply block formatting with a classname", function() {
    expect(2);

    // Set selection within test paragraph
    $.textSelect('setRange', {
        start : 5,
        startElement : $('#line1'),
        end : 14,
        endElement : $('#line1')
    });
    
    // Set header tag
    $.deco.editor.applyFormat('blockclass');

    // Check if the tag is replaced
    equals($('#line1').get(0).tagName.toLowerCase(), 'div', "Div format was applied");
    equals($('#line1').hasClass('callout'), true, "Callout class was applied");
});

test("Apply inline formatting with a classname", function() {
    expect(1);

    // Set selection within test paragraph
    $.textSelect('setRange', {
        start : 5,
        startElement : $('#line1'),
        end : 14,
        endElement : $('#line1')
    });
    
    // Set header tag
    $.deco.editor.applyFormat('inlineclass');

    // Check if the tag is replaced
    equals($('#line1').html(), 'Some <span class="highlight">paragraph</span> with text', "The strong tag was applied");
});

test("Apply block formatting to a selection covering multiple block elements", function() {
    expect(2);

    // Set selection within test paragraph
    $.textSelect('setRange', {
        start : 5,
        startElement : $('#line1'),
        end : 14,
        endElement : $('#line2')
    });

    // Set header tag
    $.deco.editor.applyFormat('h1');

    // Check if the tag is replaced
    equals($('#line1').get(0).tagName.toLowerCase(), 'h1', "Line 1 has the header format applied");
    equals($('#line2').get(0).tagName.toLowerCase(), 'h1', "Line 2 has the header format applied");
});

test("Apply inline formatting to a selection covering multiple block elements", function() {
    expect(2);

    // Set selection within test paragraph
    $.textSelect('setRange', {
        start : 5,
        startElement : $('#line1'),
        end : 4,
        endElement : $('#line2')
    });

    // Set strong to selection
    $.deco.editor.applyFormat('strong');

    // Check if the tag is replaced
    equals($('#line1').html(), 'Some <strong>paragraph with text</strong>', "The strong tag was applied to line 1");
    equals($('#line2').html(), '<strong>Some</strong> more text', "The strong tag was applied to line 2");
});

test("Apply inline formatting to a selection spanning partial elements", function() {
    // <p><b>some text</b> here</p>
    ok(false, "not implemented");
});

