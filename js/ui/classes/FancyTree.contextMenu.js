/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

///////////////////////////////////////////////////////////
// FancyTree.contextMenu.js
// Context menu implementation
///////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////
// Event handlers
///////////////////////////////////////////////////////////

FancyTree.prototype.onContextMenu = function(evt) {
    var treeObj = evt.data.treeObj;

    if (treeObj.contextMenuShown) {
        treeObj.disableContextMenu.call(treeObj);
    }

    var row = treeObj.getParentRowNode($(evt.target));

    if (!row) {
        // didn't click a row
        return false;
    }

    treeObj.contextMenuTarget = row;

    if (treeObj.multiSelection.length == 0 || !row.hasClass('ftSelected')) {
        treeObj.clearMultiSelection.call(treeObj);
        treeObj.toggleMultiSelectionSingle.call(treeObj, row);
    }

    treeObj.contextMenuSelectionData = treeObj.multiSelection;

    treeObj.enableContextMenu.call(treeObj, evt.pageX, evt.pageY);
    return false;
};

FancyTree.prototype.onContextMenuItemClick = function(evt) {
    var treeObj = evt.data.treeObj;
    var id = this.attributes.contextMenuId.value;
    var contextMenuItem = treeObj.contextMenuItems[id];
    var callback = contextMenuItem.callback;
    var $rows = contextMenuItem.$rows;

    treeObj.disableContextMenu();
    treeObj.sortMultiSelection();

    if (!contextMenuItem.preserveSelectionAfter) {
        treeObj.clearMultiSelection();
    }

    treeObj.resetDragDropState(function() {
        // Perform context menu after a short delay to allow for sidebar to
        // do its visual updates first
        setTimeout(function() { callback($rows); }, 50);
    });

    return false;
};


///////////////////////////////////////////////////////////
// Context menu functions
///////////////////////////////////////////////////////////

// show context menu positioned at mouse click
FancyTree.prototype.enableContextMenu = function(x, y)
{
    if (!this.onContextMenuShow) {
        return;
    }

    var items = this.onContextMenuShow(this.contextMenuSelectionData);

    if (items.length == 0) {
        return;
    }

    var menu = $('<ul/>', { id: 'ftContextMenu', class: 'ftContextMenu' });

    this.contextMenuItems = {};
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var elem;
        if (item.separator) {
            elem = $('<li/>', { class: 'ftContextMenuSeparator' });
        }
        else {
            var id = item.id;
            this.contextMenuItems[id] = item;
            var elem = $('<li/>', { class: 'ftContextMenuItem', contextMenuId: id })
                .append($('<img/>', { src: item.icon || '/images/x.gif' }))
                .append($('<span/>').html(item.label));
        }
        menu.append(elem);
    }

    $(document.body).append(menu);

    var width = menu.width();
    var height = menu.height();

    var docWidth = $(document).width();
    var docHeight = $(document).height();

    if (x + width > docWidth - 15) {
       x = docWidth - width - 15;
    }

    if (y + height > docHeight - 15) {
        y = docHeight - height - 15;
    }

    menu.css({ top: y, left: x });
    menu.show();
    this.contextMenuShown = true;
},

FancyTree.prototype.disableContextMenu = function() {
    // hide context menu
    if (!this.contextMenuShown)
    {
      return false;
    }

    $('#ftContextMenu').remove();
    this.contextMenuShown = false;
};
