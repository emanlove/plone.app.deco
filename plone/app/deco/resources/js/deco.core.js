/**
 * This plugin is used to define the deco namespace
 *
 * @author Rob Gietema
 * @licstart  The following is the entire license notice for the JavaScript
 *            code in this page.
 *
 * Copyright (C) 2010 Plone Foundation
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * @licend  The above is the entire license notice for the JavaScript code in
 *          this page.
 * @version 0.1
 */
"use strict";

/*global tiledata: false, jQuery: false, window: false */
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true,
eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true,
immed: true, strict: true, maxlen: 80, maxerr: 9999 */

(function ($) {

    // # Namespace
    $.deco = $.deco || {};

    // TODO: docs needed what each variable does
    $.deco.loaded = false;
    $.deco.nrOfTiles = 0;
    $.deco.tileInitCount = 0;


    /**
     * Called upon full initialization (that is: when all tiles have
     * been loaded).
     * @id jQuery.deco.initialized
     */
    $.deco.initialized = function () {
        if ($.deco.loaded) {
            return;
        }
        $.deco.loaded = true;

        // Take first snapshot
        $.deco.undo.snapshot();
    };

    // default deco options
    $.deco.options = $.deco.default_options = {
        url: window.parent.document.location.href,
        type: '',
        ignore_context: false
    };

    /**
     * Initialize the Deco UI
     *
     * @id jQuery.deco.init
     * @param {Object} options Options used to initialize the UI
     */
    $.deco.init = function (content, options) {

        // merging options
        $.deco.options = $.extend($.deco.default_options, options);

        // Set document
        $.deco.document = window.parent.document;

        // Get the url of the page
        var match = $.deco.options.url.match(/^([\w#!:.?+=&%@!\-\/]+)\/edit$/);
        if (match) {
            $.deco.options.url = match[1];
        }

        // Chop add
        match = $.deco.options.url.match(/^([\w#:.?=%@!\-\/]+)\/\+\+add\+\+([\w#!:.?+=&%@!\-\/]+)$/);
        if (match) {
            $.deco.options.url = match[1];
            $.deco.options.type = match[2];
            $.deco.options.ignore_context = true;
        }

        // Get the configuration from the backend
        $.ajax({
            type: "GET",
            url: $.deco.options.url + "/@@deco-config" +
                ($.deco.options.type === '' ? '' : "?type=" + $.deco.options.type),
            success: function (configdata) {

                // Add global options
                $.extend($.deco.options, configdata);
                $.deco.options.tileheadelements = [];

                // Get the layout
                $.deco.formdocument = document;
                if (!content) {
                    // try the parent frame
                    $.deco.formdocument = $.deco.document;
                    content = window.parent.jQuery('#form-widgets-ILayoutAware-content').val();

                    if (content === '') {
                        // Exit
                        return;
                    }
                }

                // Get dom tree
                content = $.deco.getDomTreeFromHtml(content);
                $.deco.options.layout = content.attr('data-layout');
                // Find panels
                content.find("[data-panel]").each(function () {

                    // Local variables
                    var panel_id = $(this).attr("data-panel"),
                        target = $("[data-panel=" + panel_id + "]",
                        $.deco.document);

                    // If it's the content panel and the form is in the main frame,
                    // create a new div to replace the form
                    var content_panel = content.find("[data-panel=" + panel_id + "]");
                    if (panel_id === 'content' && $.deco.document == $.deco.formdocument) {
                        $("#content", $.deco.document).addClass('deco-original-content');
                        $("#content", $.deco.document).before(
                            $($.deco.document.createElement("div")).attr({
                                'id': 'content',
                                'data-panel': content_panel.attr("data-panel")
                            }).addClass('deco-panel').html(content_panel.html()));
                    } else {
                        target.addClass('deco-panel');
                        target.html(content_panel.html());
                    }
                });

                // Init app tiles
                $.deco.options.panels = $(".deco-panel", $.deco.document);
                $.deco.nrOfTiles =
                    $.deco.options.panels.find("[data-tile]").size();

                $.deco.options.panels.find("[data-tile]").each(function () {

                    // Local variables
                    var target, href, tile_content, tiletype, classes, url,
                        tile_config, x, tile_group, y, fieldhtml, lines, i;

                    href = $(this).attr("data-tile");

                    // Get tile type
                    tile_content = $(this).parent();
                    tiletype = '';
                    classes = tile_content.parents('.deco-tile').attr('class').split(" ");
                    $(classes).each(function () {

                        // Local variables
                        var classname;

                        classname = this.match(/^deco-([\w.\-]+)-tile$/);
                        if (classname !== null) {
                            if ((classname[1] !== 'selected') &&
                                (classname[1] !== 'new') &&
                                (classname[1] !== 'read-only') &&
                                (classname[1] !== 'helper') &&
                                (classname[1] !== 'original')) {
                                tiletype = classname[1];
                            }
                        }
                    });

                    // Get tile config
                    for (x = 0; x < $.deco.options.tiles.length; x += 1) {
                        tile_group = $.deco.options.tiles[x];
                        for (y = 0; y < tile_group.tiles.length; y += 1) {

                            // Set settings value
                            if (tile_group.tiles[y].tile_type === 'field') {
                                switch (tile_group.tiles[y].widget) {
                                    case "z3c.form.browser.text.TextWidget":
                                    case "z3c.form.browser.text.TextFieldWidget":
                                    case "z3c.form.browser.textarea.TextAreaWidget":
                                    case "z3c.form.browser.textarea.TextAreaFieldWidget":
                                    case "plone.app.z3cform.wysiwyg.widget.WysiwygWidget":
                                    case "plone.app.z3cform.wysiwyg.widget.WysiwygFieldWidget":
                                        tile_group.tiles[y].settings = false;
                                        break;
                                    default:
                                        tile_group.tiles[y].settings = true;
                                        break;
                                }
                            }
                            if (tile_group.tiles[y].name === tiletype) {
                                tile_config = tile_group.tiles[y];
                            }
                        }
                    }

                    // Check if a field tile
                    if (tile_config.tile_type === 'field') {

                        fieldhtml = '';

                        switch (tile_config.widget) {
                        case "z3c.form.browser.text.TextWidget":
                        case "z3c.form.browser.text.TextFieldWidget":
                            fieldhtml = '<div>' +
                                $("#" + tile_config.id, $.deco.formdocument).find('input').attr('value') + '</div>';
                            break;
                        case "z3c.form.browser.textarea.TextAreaWidget":
                        case "z3c.form.browser.textarea.TextAreaFieldWidget":
                            lines = $("#" + tile_config.id, $.deco.formdocument).find('textarea').attr('value').split('\n');
                            for (i = 0; i < lines.length; i += 1) {
                                fieldhtml += '<div>' + lines[i] + '</div>';
                            }
                            break;
                        case "plone.app.z3cform.wysiwyg.widget.WysiwygWidget":
                        case "plone.app.z3cform.wysiwyg.widget.WysiwygFieldWidget":
                            fieldhtml = $("#" + tile_config.id, $.deco.formdocument).find('textarea').attr('value');
                            break;
                        default:
                            fieldhtml = '<div class="discreet">Placeholder ' +
                                'for field:<br/><b>' + tile_config.label +
                                '</b></div>';
                            break;
                        }
                        tile_content.html(fieldhtml);

                    // Get data from app tile
                    } else {
                        url = href;
                        if (tile_config.name ===
                            'plone.app.deco.title' ||
                            tile_config.name ===
                            'plone.app.deco.description') {
                            url += '?ignore_context=' +
                                $.deco.options.ignore_context;
                        }
                        $.ajax({
                            type: "GET",
                            url: url,
                            success: function (value) {

                                // Get dom tree
                                value = $.deco.getDomTreeFromHtml(value);

                                // Add head tags
                                $.deco.addHeadTags(href, value);

                                tile_content.html('<p class="hiddenStructure ' +
                                        'tileUrl">' + href + '</p>' +
                                        value.find('.temp_body_tag').html());

                                $.deco.tileInitCount += 1;

                                if ($.deco.tileInitCount >= $.deco.nrOfTiles) {
                                    $.deco.initialized();
                                }
                            }
                        });
                    }
                });

                // Init overlay
                if ($.deco.document == $.deco.formdocument) {
                    $('#content.deco-original-content',
                      $.deco.document).decoOverlay().addClass('overlay');
                }

                // Hide toolbar
                // XXX: not really nice to hide it here
                $('.toolbar .toolbarleft > *').remove();
                $('.toolbar').removeClass('toolbarglobal').addClass('toolbarlocal');

                // Add toolbar div below menu
                $(".toolbar .toolbarleft").addClass("deco-toolbar");

                // Add the toolbar to the options
                $.deco.options.toolbar = $(".deco-toolbar");

                // Add page url to the options
                $.deco.options.url = options.url;

                // Init toolbar
                $.deco.options.toolbar.decoToolbar();

                // Init panel
                $.deco.options.panels.decoLayout();

                // Add blur to the rest of the content using jQT expose
                // XXX: window.parent.$ !== $; this may need refactoring
                window.parent.$($.deco.options.panels).expose({
                    closeOnEsc: false,
                    closeOnClick: false
                });

                // Init upload
                // $.deco.initUpload();
                $.deco.undo.init();
            }
        });
    };

    /**
     * Get the dom tree of the specified content
     *
     * @id jQuery.deco.getDomTreeFromHtml
     * @param {String} content Html content
     * @return {Object} Dom tree of the html
     */
    $.deco.getDomTreeFromHtml = function (content) {

        // Remove doctype and replace html, head and body tag since the are
        // stripped when converting to jQuery object
        content = content.replace(/<!DOCTYPE[\w\s\- .\/\":]+>/, '');
        content = content.replace(/<html/, "<div class=\"temp_html_tag\"");
        content = content.replace(/<\/html/, "</div");
        content = content.replace(/<head/, "<div class=\"temp_head_tag\"");
        content = content.replace(/<\/head/, "</div");
        content = content.replace(/<body/, "<div class=\"temp_body_tag\"");
        content = content.replace(/<\/body/, "</div");
        return $($(content)[0]);
    };

    /**
     * Remove head tags based on tile url
     *
     * @id jQuery.deco.removeHeadTags
     * @param {String} url Url of the tile
     */
    $.deco.removeHeadTags = function (url) {

        // Local variables
        var tile_type_id, html_id, headelements, i;

        // Calc delete url
        url = url.split('?')[0];
        url = url.split('@@');
        tile_type_id = url[1].split('/');
        url = url[0] + '@@delete-tile?type=' + tile_type_id[0] + '&id=' +
            tile_type_id[1] + '&confirm=true';
        html_id = tile_type_id[0].replace(/\./g, '-') + '-' + tile_type_id[1];

        // Remove head elements
        headelements = $.deco.options.tileheadelements[html_id];
        for (i = 0; i < headelements.length; i += 1) {
            $(headelements[i], $.deco.document).remove();
        }
        $.deco.options.tileheadelements[html_id] = [];
    };

    /**
     * Add head tags based on tile url and dom
     *
     * @id jQuery.deco.addHeadTags
     * @param {String} url Url of the tile
     * @param {Object} dom Dom object of the tile
     */
    $.deco.addHeadTags = function (url, dom) {

        // Local variables
        var tile_type_id, html_id;

        // Calc url
        url = url.split('?')[0];
        url = url.split('@@');
        tile_type_id = url[1].split('/');
        html_id = tile_type_id[0].replace(/\./g, '-') + '-' + tile_type_id[1];
        $.deco.options.tileheadelements[html_id] = [];

        // Get head items
        dom.find(".temp_head_tag").children().each(function () {

            // Add element
            $.deco.options.tileheadelements[html_id].push(this);

            // Add head elements
            $('head', $.deco.document).append(this);
        });
    };

}(jQuery));


// Deco initialization
//
// XXX: maybe this should be done outside this script
(function($) {

    // we wait 
    var window = window.parent,
        document = window.document;

    $(document).ready(function () {

        var layout = $('#form-widgets-ILayoutAware-content', document);

        // Check if layout exists
        if (layout.length > 0) {

            // initialize deco
            $.deco.init(layout.val(), window.$.deco.options);

        }
    });

})(jQuery);
