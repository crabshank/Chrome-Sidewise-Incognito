/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */
$(document).ready(function() {
    initDebugBar();
    initPageTree(bg.tree, "pages", createFancyTree);
    bg.focusCurrentTabInPageTree(!0);
    settings.get("createdNewTabViaDoubleClick") || $(".ftBottomPadding").text("Double-click to create a new tab");
    $(document).on("dblclick", "body, .ftBottomPadding", onBodyDoubleClick);
    $(document).on("keydown", "body", onBodyKeyDown)
});

function removeNodePrint(n){
		function getAllPageNodes(n){
			var allNodes=[];
			try{
				let nc=n.children;
				for(let i=0, len=nc.length; i<len; i++){
					allNodes.push(nc[i]);
				}
				
				let c=0;
				while (c<allNodes.length){
					if(typeof allNodes[c]!=='undefined'){
						let h=allNodes[c].children;
						for(let i=0, len=h.length; i<len; i++){
							allNodes.push(h[i]);
						}
					}
					c++;
				}
				return Array.from(new Set(allNodes)).filter((n)=>{return (n instanceof PageNode);});
			}catch(e){return allNodes;}
		}
		
	let p=getAllPageNodes(n);
	if(p.length>0){
		console.group('Window removed: ');
		for(let i=0, len=p.length; i<len; i++){
			console.log('Removed: '+p[i].url);
		}
		console.groupEnd();
	}
	
}

function onBodyKeyDown(b) {
	
	if(b.keyCode===46){
		let k=$("ul.ftChildren > li.ftFocused, ul.ftChildren > li.ftSelected");
		for (let i=0, len=k.length; i<len; i++){
			onContextMenuItemClosePages($(k[i]));
		}
	}else if(b.keyCode===35){
		let k=$("ul.ftChildren > li.ftFocused, ul.ftChildren > li.ftSelected");
		if(b.shiftKey){
			for (let i=0, len=k.length; i<len; i++){
				onContextMenuItemHibernatePages($(k[i]));
			}
		}else{
			for (let i=0, len=k.length; i<len; i++){
				onContextMenuItemDiscardPages($(k[i]));
			}
		}
	}else{
		if (b.ctrlKey && (87 == b.keyCode || 115 == b.keyCode)) return bg.tree.focusedTabId && chrome.tabs.remove(bg.tree.focusedTabId), !1
	}
}

function initDebugBar() {
    loggingEnabled && ($("footer, #main").addClass("debugEnabled"), $(document).on("click", "#debug_promoteIframe", debugBarClickPromoteIframe).on("click", "#debug_resetTree", debugBarClickResetTree))
}

function debugBarClickPromoteIframe() {
    window.parent.location = "pages.html"
}

function debugBarClickResetTree() {
    confirm("This will completely delete your existing tree and rebuild it from scratch. All existing hibernated rows will be lost. Are you sure you want to continue?") && (ft.clear(), bg.tree.clear(), bg.injectContentScriptInExistingTabs("content_script.js"), bg.populatePages(), setTimeout(function() {
        location.reload()
    }, 500))
}

function createFancyTree(b, a, c) {
    var d = {
        page: {
            allowedDropTargets: ["window", "page", "folder"],
            onClick: onPageRowClick,
            onDoubleClick: onPageRowDoubleClick,
            onMiddleClick: onPageRowMiddleClick,
            onExpanderClick: onRowExpanderClick,
            onIconError: onPageRowIconError,
            buttons: [{
                id: "hibernate",
                icon: "/images/hibernate_wake.png",
                tooltip: getMessage("pages_pageRowButtonTip_hibernateWake"),
                onClick: onPageRowHibernateButton
            }, {
                id: "close",
                icon: "/images/close.png",
                tooltip: getMessage("pages_pageRowButtonTip_close"),
                onClick: onPageRowCloseButton
            }]
        },
        folder: {
            allowedDropTargets: ["window", "page", "folder"],
            onDoubleClick: onFolderRowDoubleClick,
            onMiddleClick: onFolderRowMiddleClick,
            onExpanderClick: onRowExpanderClick,
            buttons: [{
                id: "close",
                icon: "/images/close.png",
                tooltip: getMessage("pages_folderRowButtonTip_close"),
                onClick: onFolderRowCloseButton
            }]
        },
        window: {
            allowedDropTargets: ["ROOT", "window"],
            onClick: onWindowRowClick,
            onDoubleClick: onWindowRowDoubleClick,
            onMiddleClick: onWindowRowMiddleClick,
            onExpanderClick: onRowExpanderClick,
            onShowButtons: onWindowShowButtons,
            buttons: [{
                id: "createTab",
                icon: "/images/create_tab.png",
                tooltip: getMessage("pages_windowRowButtonTip_createTab"),
                onClick: onWindowRowCreateTabButton
            }, {
                id: "close",
                icon: "/images/close.png",
                tooltip: getMessage("pages_windowRowButtonTip_close"),
                onClick: onWindowRowCloseButton
            }]
        }
    };
    copyObjectSubProps(PageTreeRowTypes, d, !1);
    var e;
    settings.get("pages_clickOnHoverDelay") && (e = settings.get("pages_clickOnHoverDelayMs"));
    fancyTree = new FancyTree($(b), $(a), {
        rowTypes: d,
        onContextMenuShow: onContextMenuShow,
        onRowsMoved: onRowsMoved,
        allowDropHandler: allowDropHandler,
        scrollTargetElem: $("#main"),
        showFilterBox: !0,
        autoSelectChildrenOnDrag: settings.get("autoSelectChildrenOnDrag"),
        filterPlaceholderText: getMessage("prompt_filterPlaceholderText"),
        filterActiveText: getMessage("prompt_filterActiveText"),
        useAdvancedFiltering: settings.get("useAdvancedTreeFiltering"),
        clickOnHoverDelayMs: e,
        clickOnMouseWheel: settings.get("pages_clickOnMouseWheel"),
        logger: bg.log
    });
    $(".ftFilterStatus").attr("title", getMessage("pages_omniboxTip"));
    setTimeout(function() {
        populateFancyTreeFromPageTree(fancyTree,
            c)
    }, 0);
    return fancyTree
}

function populateFancyTreeFromPageTree(b, a) {
    a.forEach(function(a, d, e, f, h) {
        addPageTreeNodeToFancyTree(b, a, h ? h.id : void 0)
    })
}

function addPageTreeNodeToFancyTree(b, a, c, d) {
    var e;
    if (a instanceof bg.WindowNode) {
        var f = "popup" == a.type;
        e = b.getNewRowElem("window", a.id, a.incognito ? "/images/incognito-16.png" : f ? "/images/tab-single-16.png" : "/images/tab-stack-16.png", a.label, a.title, {
            incognito: a.incognito,
            hibernated: a.hibernated,
            type: a.type,
            chromeId: a.chromeId
        }, a.collapsed)
    } else if (a instanceof bg.PageNode) e = b.getNewRowElem("page", a.id, "chrome://favicon", a.label, a.title, {
		url: getUrl(a),
        status: a.status,
        pinned: a.pinned,
        unread: a.unread,
        hibernated: a.hibernated,
        restorable: a.restorable,
        highlighted: a.highlighted,
        incognito: a.incognito,
        chromeId: a.chromeId
    }, a.collapsed);
    else if (a instanceof bg.FolderNode) e = b.getNewRowElem("folder", a.id, "/images/folder.png", a.label, "Folder", {}, a.collapsed);
    else throw Error("Unknown node type");
    b.addRow(e, c, d);
    setTimeout(function() {
        b.updateRow.call(b, e, {
            icon: a.favicon
        })
    }, 10)
}

function PageTreeCallbackProxyListener(b, a) {
    if (window) switch (b) {
        case "add":
            addPageTreeNodeToFancyTree(ft, a.element, a.parentId, a.beforeSiblingId);
            break;
        case "remove":
            ft.removeRow(a.element.id, a.removeChildren);
            break;
        case "move":
            ft.moveRow(a.element.id, a.newParentId, a.beforeSiblingId, a.keepChildren);
            break;
        case "merge":
            ft.mergeRows(a.fromId, a.toId);
            break;
        case "update":
            var c = a.element,
                d = {},
                e;
            for (e in c) e in PAGETREE_FANCYTREE_UPDATE_DETAILS_MAP && (d[PAGETREE_FANCYTREE_UPDATE_DETAILS_MAP[e]] = c[e]);
            var f =
                ft.getRow(a.id);
            if (!f) throw Error("Could not find row with id " + a.id);
            "complete" == c.status && ("complete" != f.attr("status") && "page" == f.attr("rowtype") && "false" == f.attr("hibernated")) && (setTimeout(function() {
                f.css("-webkit-transform", "rotate(0deg)")
            }, 100), setTimeout(function() {
                f.css("-webkit-transform", "")
            }, 150));
            ft.updateRow(f, d);
            break;
        case "focusPage":
            ft.focusRow(a.id);
            break;
        case "expand":
            ft.expandRow(a.id);
            break;
        case "collapse":
            ft.collapseRow(a.id);
            break;
        case "multiSelectInWindow":
            c = ft.getRow(a.windowNodeId);
            if (0 == c.length) break;
            d = $("#" + a.pageNodeIds.join(",#"));
            ft.setMultiSelectedChildrenUnderRow(c, d, "[rowtype=page][hibernated=false]")
    }
}

function onBodyDoubleClick(b) {
    b = $(b.target);
    if (b.parents().is(ft.root) && !b.is(".ftBottomPadding")) return !0;
    b = bg.focusTracker.getFocused();
    createNewTabInWindow(b);
    settings.set("createdNewTabViaDoubleClick", !0);
    $(".ftBottomPadding").text("");
    return !1
}

function onRowExpanderClick(b) {
    bg.tree.updateNode(b.data.row.attr("id"), {
        collapsed: !b.data.expanded
    })
}

function onRowsMoved(b) {
	let doneDiscard=false;
	try{
		let pgb=b[0].$row[0];
		let wnd=b[0].$newParent[0];
		let wndHib=(wnd.getAttribute('hibernated')=='true')?true:false;
		let pgs=[];
		if(wndHib===false){
			pgs=[...wnd.querySelectorAll('li[rowtype=page]')].filter(p=>{return p!==pgb});
			let pgl=pgs.length;
			pgsDisc=pgs.filter(p=>{return p.getAttribute('discarded')=='true'});
			if(pgl>0 && pgl===pgsDisc.length){
				doneDiscard=true;
				onContextMenuItemDiscardPages($(pgb));
			}
		}
	}catch(e){;}
    log(b);
    for (var a = {}, c = 0, d, /*e = !1,*/ h=false, f = 0; f < b.length; f++) {
        var h = b[f],
            g = h.$row,
            i = h.$to,
            k = g.attr("id"),
            l = i ? i.attr("id") : void 0;
        log("---- move:", k, h.relation, l, h.keepChildren ? "KEEP CHILDREN" : "");
        "nomove" != h.relation && bg.tree.moveNodeRel(k, h.relation, l, h.keepChildren, !0);
        g.hasClass("ftCollapsed") && (log("check collapse-hidden descendants for win to win moves"), g = g.add(g.find(".ftRowNode")));
        g.each(function(b, f) {
            var m = $(f);
            if (m.attr("rowtype") == "page") {
				
					d = i.parents(".ftRowNode").last();
					d.length == 0 && (d = i);
					var g = h.$oldAncestors.last();
					let dw=(d.attr("rowtype") == "window")?true:false;
					
				if( doneDiscard===false && m.attr("hibernated") != "true"){ //page not hibernated

					if ( dw && !d.is(g)) { // non-hibernated page's window found
						var m = getChromeId(m),
							g = getChromeId(g),
							j = bg.tree.getNode(k);

							if(d.attr("hibernated") == "false"){ //window not hibernated
								j.windowId = getChromeId(d);
							}else{
								onContextMenuItemHibernatePages($(f));
								onContextMenuItemHibernateWindow(d);
								h=true;
							}

								/*if(typeof h.$oldAncestors !=='undefined'){
									let wn=bg.tree.getNode(h.$oldAncestors.attr('id'));
									wn && (0 < wn.children.length ? bg.tree.updateNode(wn, {
									hibernated: !0,
									restorable: !1,
									title: getMessage("text_hibernatedWindow"),
									chromeId: null
									}) : bg.tree.removeNode(wn));
								}else{
									console.groupCollapsed('Dragged from window node not found: ')
									console.error(h);
									console.groupEnd();
								}*/

						if (a[g] === void 0) {
							a[g] = [];
							c++
						}
						a[g].push({
							node: j,
							movingTabId: m
						})
					}
				}
            }
        })
    }
    if (0 < c) {
        bg.tree.rebuildTabIndex();
        var j = getChromeId(d),
            n = function(b) {
                var d = 0,
                    f;
                for (f in a) a.hasOwnProperty(f) && (d++, d == c ? moveTabsBetweenWindows(parseInt(f), j, a[f], b,h) : moveTabsBetweenWindows(parseInt(f), j, a[f], void 0,h))
            };
       /* e ? (b =
            bg.sidebarHandler.getIdealNewWindowMetrics(), b.url = "about:blank", b.type = "normal", chrome.windows.create(b, function(a) {
                chrome.windows.update(a.id, bg.sidebarHandler.getIdealNewWindowMetrics());
                chrome.tabs.query({
                    windowId: a.id
                }, function(b) {
                    1 != b.length && console.error("Wrong number of tabs under new waking-window, should be exactly one", a, b.length, b);
                    var c = b[0].id;
                    j = a.id;
                    if (b = bg.tree.getNode(["chromeId", j])) bg.tree.updateNode(b, {
                        id: "X" + generateGuid()
                    }), bg.tree.removeNode(b, !0);
                    bg.tree.setWindowToAwake(d.attr("id"),
                        j);
                    n(function() {
                        chrome.tabs.remove(c)
                    })
                })
            })) :*/ 
			n();
    } else bg.tree.conformAllChromeTabIndexes(!0)
}

function moveBetweenNewWindowBody(a,e,d,c/*,b*/){
	            var f = function() {
					/*if(typeof b!=='undefined'){
						chrome.tabs.remove(b.id);
					}*/
                    setTimeout(function() {
                        bg.tree.rebuildPageNodeWindowIds(function() {
                            bg.tree.conformAllChromeTabIndexes(!0);
                            d && d()
                        })
                    }, 500)
                },
                e;
            for (e in c) {
                var h = c[e],
                    g = bg.tree.getTabIndex(h.node) || 0;
                log("win to win move + last-tab hack", "moving", h.node.id, "to", a, "index", g);
                moveTabToWindow(h.movingTabId, a, g, e == c.length - 1 ? f : void 0)
            }
}

function moveTabsBetweenWindows(b, a, c, d) {
    var e = ft.multiSelection;
    chrome.tabs.query({
        windowId: b
    }, function(f) {
        if (f.length > c.length) {
            var f = function() {
                    setTimeout(function() {
                        bg.tree.rebuildPageNodeWindowIds(function() {
                            bg.tree.conformAllChromeTabIndexes(!0);
                            ft.setMultiSelectedChildrenUnderRow(ft.root, e);
                            d && d()
                        })
                    }, 500)
                },
                h;
            for (h in c) {
                var g = c[h],
                    i = bg.tree.getTabIndex(g.node) || 0;
                log("win to win move", "moving", g.node.id, "to", a, "index", i);
               moveTabToWindow(g.movingTabId, a, i, h == c.length - 1 ? f : void 0)
            }
        } else{
			moveBetweenNewWindowBody(a,e,d,c);
	}
    });
}

function moveTabToWindow(b, a, c, d) {
	if(!isNaN(a)){
		log("moving tab to window", "movingTabId", b, "toWindowId", a, "toPosition", c);
		bg.expectingTabMoves.push(b);
		chrome.tabs.move(b, {
			windowId: a,
			index: c
		}, function() {
			chrome.tabs.update(b, {
				active: !0
			}, function(a) {
				a.pinned || (a = bg.tree.getNode(["chromeId", b]), a.pinned && (bg.tree.updateNode(a, {
					pinned: !1
				}), bg.fixPinnedUnpinnedTabOrder.call(bg, a)));
				d && d()
			})
		})
	}
}

function allowDropHandler(b, a, c) {
    if (b.is("[rowtype=window]") && c.is("[rowtype=window]")) return "append" == a || "prepend" == a ? !1 : !0;
    if (0 < b.parents("[rowtype=window][type=popup]").length || c.add(c.parents()).is("[rowtype=window][type=popup]")) return !1;
    var d = b.add(b.parents()).is("[incognito=true]"),
        e = c.add(c.parents()).is("[incognito=true]");
   // if (d != e) return !1;
    b = b.add(b.filter(".ftCollapsed").find(".ftRowNode"));
    if (b.is("[rowtype=page][pinned=false][hibernated=false]")) {
        if ("before" == a && c.is("[rowtype=page][hibernated=false][pinned=true]") ||
            ("before" == a || "prepend" == a) && 0 < c.following(".ftRowNode[rowtype=page][hibernated=false][pinned=true]", c.parentsUntil(".ftRoot > .ftChildren").last()).length || "prepend" == a && c.is("[rowtype=window]") && (d = bg.tree.getNode(c.attr("id")), d.following(function(a) {
                return a.isTab() && a.pinned
            }, d))) return !1;
        d = bg.tree.getNode(c.attr("id"));
        if (d.following(function(a) {
                return a.isTab() && a.pinned
            }, d.topParent())) return !1
    }
    if (b.is("[rowtype=page][pinned=true][hibernated=false]")) {
        if ("before" != a && c.is("[rowtype=page][hibernated=false][pinned=false]")) return !1;
        if ("after" == a || "append" == a)
            if (0 < c.preceding(".ftRowNode[rowtype=page][hibernated=false][pinned=false]", c.parentsUntil(".ftRoot > .ftChildren").last()).length || c.hasClass("ftCollapsed") && 0 < c.find(".ftRowNode[rowtype=page][hibernated=false][pinned=false]").length) return !1;
        if ("append" == a && c.is("[rowtype=window]")) return !1;
        d = bg.tree.getNode(c.attr("id"));
        if (d.topParent() && 0 <= b.map(function(a, b) {
                var c = $(b).parentsUntil(ft.root);
                return c[c.length - 2].id
            }).toArray().indexOf(d.topParent().id) && d.preceding(function(a) {
                return a.isTab() &&
                    !a.pinned
            }, d.topParent())) return !1
    }
    return !0
}

function onContextMenuShow(b) {
    log(b);
    var a = [],
        c = b.first();
    if ("window" == c.attr("rowtype")) {
        var b = c.find(".ftChildren > .ftRowNode"),
            d = b.filter(function(a, b) {
                return "true" == $(b).attr("hibernated")
            }).length,
            e = b.length - d;
        d && a.push({
            $rows: c,
            id: "awakenWindow",
            icon: "/images/wake_branch.png",
            label: "Wake tabs in window",
            callback: onContextMenuItemWakeWindow
        });     
		d && a.push({
            $rows: c,
            id: "awakenDiscardWindow",
            icon: "/images/wake_branch.png",
            label: "Wake + discard tabs in window",
            callback: onContextMenuItemWakeDiscardWindow
        });
		d && e && a.push({
            separator: !0
        });
        e && a.push({
            $rows: c,
            id: "hibernateWindow",
            icon: "/images/hibernate_branch.png",
            label: "Hibernate tabs in window",
            callback: onContextMenuItemHibernateWindow
        });
		e && a.push({
            $rows: c,
            id: "discardWindow",
            icon: "/images/hibernate_branch.png",
            label: "Discard tabs in window",
            callback: onContextMenuItemDiscardWindow
        });
        (e || d) && a.push({
            separator: !0
        });
        a.push({
            $rows: c,
            id: "setLabel",
            icon: "/images/label.png",
            label: "Edit title",
            callback: onContextMenuItemSetLabel,
            preserveSelectionAfter: !0
        });
        a.push({
            separator: !0
        });
        a.push({
            $rows: c,
            id: "closeWindow",
            icon: "/images/close.png",
            label: "Close window",
            callback: onContextMenuItemCloseWindow
        });
        return a
    }
    var c = b.filter(function(a, b) {
            return "page" == $(b).attr("rowtype")
        }),
        f = b.find(".ftRowNode"),
        h = b.add(f),
        g = h.filter(function(a, b) {
            return "page" == $(b).attr("rowtype")
        }),
        d = c.filter(function(a,
            b) {
            return "true" == $(b).attr("hibernated")
        }).length, 
		dd = c.filter(function(a,
            b) {
            return "true" == $(b).attr("discarded")
        }).length,
        e = c.length - d,
        ed = c.length - dd,
        i = g.filter(function(a, b) {
            return "true" == $(b).attr("hibernated")
        }).length,
        k = g.length - i,
        l = b.filter(function(a, b) {
            return "true" == $(b).attr("highlighted")
        }).length,
        j = b.length - l,
        n = c.filter(function(a, b) {
            return "true" == $(b).attr("pinned")
        }).length,
        o = c.length - n;
    d && a.push({
        $rows: c,
        id: "awakenPage",
        icon: "/images/wake.png",
        label: `Wake tab${(d>1) ? 's' : ''}`,
        callback: onContextMenuItemWakePages
    }); 
	d && a.push({
        $rows: c,
        id: "awakenPageHib",
        icon: "/images/wake.png",
        label: `Wake tab${(d>1) ? 's' : ''} + discard`,
        callback: onContextMenuItemWakePagesDisc
    });
	d && a.push({
            separator: !0
    });
    e && a.push({
        $rows: c,
        id: "hibernatePage",
        icon: "/images/hibernate.png",
        label: `Hibernate tab${(e>1) ? 's' : ''}`,
        callback: onContextMenuItemHibernatePages
    });    
	ed && a.push({
        $rows: c,
        id: "discardPage",
        icon: "/images/hibernate.png",
        label: `Discard tab${(ed>1) ? 's' : ''}`,
        callback: onContextMenuItemDiscardPages
    });
	i && i != d && a.push({
            separator: !0
    });
	i && i != d && a.push({
        $rows: g,
        id: "awakenDiscardBranch",
        icon: "/images/wake_branch.png",
        label: "Wake + discard branch",
        callback: onContextMenuItemWakePagesDisc
    });
	i && i != d && a.push({
        $rows: g,
        id: "awakenBranch",
        icon: "/images/wake_branch.png",
        label: "Wake branch",
        callback: onContextMenuItemWakePages
    });
	k && k != e && a.push({
            separator: !0
    });
    k && k != e && a.push({
        $rows: g,
        id: "hibernateBranch",
        icon: "/images/hibernate_branch.png",
        label: "Hibernate branch",
        callback: onContextMenuItemHibernatePages
    });    
	k && k != e && a.push({
        $rows: g,
        id: "discardBranch",
        icon: "/images/hibernate_branch.png",
        label: "Discard branch",
        callback: onContextMenuItemDiscardPages
    });
    (e || d) && a.push({
        separator: !0
    });
    d = 1 == a.length && "folder" == b.attr("rowtype") ? "Edit title" : "Set label";
    a.push({
        $rows: b,
        id: "setLabel",
        icon: "/images/label.png",
        label: d,
        callback: onContextMenuItemSetLabel,
        preserveSelectionAfter: !0
    });
    j && a.push({
        $rows: b,
        id: "setHighlight",
        icon: "/images/highlight.png",
        label: "Highlight",
        callback: onContextMenuItemSetHighlight,
        preserveSelectionAfter: !0
    });
    l && a.push({
        $rows: b,
        id: "clearHighlight",
        icon: "/images/clear_highlight.png",
        label: "Clear highlight",
        callback: onContextMenuItemClearHighlight,
        preserveSelectionAfter: !0
    });
    o && a.push({
        $rows: c,
        id: "pinPage",
        icon: "/images/pinned.png",
        label: `Pin tab${(o>1) ? 's' : ''}`,
        callback: onContextMenuItemPinPages,
        preserveSelectionAfter: !0
    });
    n && a.push({
        $rows: c,
        id: "unpinPage",
        icon: "/images/unpin.png",
        label: `Unpin tab${(n>1) ? 's' : ''}`,
        callback: onContextMenuItemUnpinPages,
        preserveSelectionAfter: !0
    });
    0 < c.length && a.push({
        $rows: b,
        id: "copyUrl",
        icon: "/images/copy_url.png",
        label: `Copy URL${(c.length>1) ? 's' : ''}`,
        callback: onContextMenuItemCopyURL,
        preserveSelectionAfter: !0
    });
    bg.loggingEnabled && a.push({
        $rows: b,
        id: "copyId",
        icon: "/images/copy_url.png",
        label: `Copy ID${(b.length>1) ? 's' : ''}`,
        callback: onContextMenuItemCopyId,
        preserveSelectionAfter: !0
    });
    a.push({
        separator: !0
    });
    a.push({
        $rows: b,
        id: "moveToNewFolder",
        icon: "/images/folder.png",
        label: "Put in new folder",
        callback: onContextMenuItemMoveToNewFolder,
        preserveSelectionAfter: !0
    });
    a.push({
        separator: !0
    });
    e && a.push({
        $rows: b,
        id: "reloadPage",
        icon: "/images/reload.png",
        label: `Reload tab${(e>1) ? 's' : ''}`,
        callback: onContextMenuItemReload,
        preserveSelectionAfter: !0
    });
    0 < c.length ? a.push({
        $rows: b,
        id: "closePage",
        icon: "/images/close.png",
        label: `Close tab${(c.length>1) ? 's' : ''}`,
        callback: onContextMenuItemClosePages
    }) : a.push({
        $rows: b,
        id: "closeFolder",
        icon: "/images/close_branch.png",
        label: `Remove folder${(b.length>1) ? 's' : ''}`,
        callback: onContextMenuItemCloseBranches
    });
    (b.length != h.length || 0 < f.length) && a.push({
        separator: !0
    });
    0 < f.length && (0 < f.find(".ftRowNode").length && a.push({
        $rows: b,
        id: "flattenBranch",
        icon: "/images/text_indent_remove.png",
        label: "Flatten branch",
        callback: onContextMenuItemFlattenBranch,
        preserveSelectionAfter: !0
    }), a.push({
        $rows: b,
        id: "promoteChildren",
        icon: "/images/text_indent_promote.png",
        label: "Promote children",
        callback: onContextMenuItemPromoteChildren,
        preserveSelectionAfter: !0
    }));
    b.length != h.length && a.push({
        $rows: b,
        id: "closeBranch",
        icon: "/images/close_branch.png",
        label: "Close branch",
        callback: onContextMenuItemCloseBranches
    });
    return a
}

function onContextMenuItemCloseWindow(b) {
    closeWindowRow(b.first())
}

function onContextMenuItemClosePages(b) {
    b.reverse().each(function(a, b) {
        closeRow($(b))
    })
}

function onContextMenuItemCloseBranches(b) {
    var a = b.find(".ftRowNode"),
        c = a.length,
        d = settings.get("multiSelectActionConfirmThreshold");
    0 < d && c >= d && !confirm("This action will close " + c + " child row(s). Proceed?") || b.add(a).reverse().each(function(a, b) {
        closeRow($(b))
    })
}

function onContextMenuItemWakeDiscardWindow(b) {
	bg.tree.awakenWindow(b.first().attr("id"),null,true);
}

function onContextMenuItemWakeWindow(b) {
	bg.tree.awakenWindow(b.first().attr("id"));
}

function onContextMenuItemHibernateWindow(b) {
	bg.tree.hibernateWindow(b.first().attr("id"));
}

function onContextMenuItemDiscardWindow(b) {
	bg.tree.discardWindow(b.first().attr("id"));
}

function onContextMenuItemHibernatePages(b) {
    togglePageRowsHibernated(b, -1)
}

function onContextMenuItemDiscardPages(b) {
    togglePageRowsHibernated(b, -2)
}

function onContextMenuItemWakePages(b) {
    togglePageRowsHibernated(b, 1)
}

function onContextMenuItemWakePagesDisc(b) {
    togglePageRowsHibernated(b, 2)
}

function onContextMenuItemReload(b) {
    b.each(function(a, b) {
        var d = $(b);
        "page" != d.attr("rowtype") || "true" == d.attr("hibernated") || (d = getChromeId(d), chrome.tabs.executeScript(d, {
            code: "window.location.reload(true);"
        }))
    })
}

function onContextMenuItemSetLabel(b) {
    setRowLabels(b)
}

function onContextMenuItemSetHighlight(b) {
    b.each(function(a, b) {
        setRowHighlight($(b), 1)
    })
}

function onContextMenuItemClearHighlight(b) {
    b.each(function(a, b) {
        setRowHighlight($(b), -1)
    })
}

function onContextMenuItemMoveToNewFolder(b) {
    var a = b.not(".ftCollapsed").find(".ftRowNode").not(b).not(function() {
        return 0 != $(this).parents(".ftCollapsed").length
    });
    0 < a.length && confirm("Move entire branches of selected rows into new folder?\nPress Cancel to move just the selected rows.") && (b = b.add(a));
    var a = b.map(function(a, b) {
            var c = $(b).attr("url");
            if (c) try {
                return splitUrl(c).domain.replace("www.", "").split(".")[0]
            } catch (h) {}
        }),
        c = mostFrequent(a),
        a = c.count >= a.length / 2 && c.val ? c.val : getMessage("text_NewFolder");
    if (a = prompt(getMessage("prompt_setNewFolderName"), a)) a = new bg.FolderNode(a), bg.tree.addNode(a), bg.tree.moveNodeRel(a, "before", b.first().attr("id")), ft.moveRowSetAnimate(b, "append", ft.getRow(a.id), function(a) {
        onRowsMoved(a)
    })
}

function onContextMenuItemFlattenBranch(b) {
    var a = b.find(".ftRowNode"),
        b = b.add(a);
    flattenRows(b, "prepend", !1)
}

function onContextMenuItemPromoteChildren(b) {
    var a = b.children(".ftChildren").children();
    flattenRows(b.add(a), "after", !0)
}

function flattenRows(b, a, c) {
    for (var d = b.length; 0 <= d; d--) {
        var e = $(b[d]),
            f = e.parents().filter(b);
        0 < f.length && (f = $(f[f.length - 1]), bg.tree.moveNodeRel(e.attr("id"), a, f.attr("id"), c))
    }
    ft.formatLineageTitles(b)
}

function onContextMenuItemUnpinPages(b) {
    b.filter(function(a, b) {
        $e = $(b);
        return "true" == $e.attr("pinned")
    }).each(function(a, b) {
        setPageRowPinnedState($(b), !1)
    })
}

function onContextMenuItemPinPages(b) {
    b.filter(function(a, b) {
        $e = $(b);
        return "false" == $e.attr("pinned")
    }).each(function(a, b) {
        setPageRowPinnedState($(b), !0)
    })
}

function onFolderRowDoubleClick(b) {
    var a = settings.get("pages_doubleClickAction");
    handleFolderRowAction(a, b)
}

function onFolderRowMiddleClick(b) {
    var a = settings.get("pages_middleClickAction");
    handleFolderRowAction(a, b)
}

function handleFolderRowAction(b, a) {
    switch (b) {
        case "close":
            onFolderRowCloseButton(a);
            break;
        case "hibernate":
            var c = ft.getChildrenContainer(a.data.row),
                d = "true" == c.children().first().attr("hibernated") ? 1 : -1,
                c = c.find(".ftRowNode[rowtype=page]");
            togglePageRowsHibernated(c, d, !1);
            break;
        case "expand":
            a.data.treeObj.toggleExpandRow(a.data.row);
            break;
        case "setlabel":
            setRowLabels(a.data.row);
            break;
        case "highlight":
            setRowHighlight(a.data.row, 0)
    }
}

function onFolderRowCloseButton(b) {
    var a = b.data.row,
        c = b.data.row.children(".ftChildren").find(".ftRowNode"),
        d = c.length;
    ft.resetDragDropState(function() {
        0 < d && confirm("Also close " + d + " child row(s)?\nPress Cancel to remove the parent folder only.") && (a = a.add(c));
        a.each(function(a, b) {
            closeRow($(b))
        })
    })
}

function onPageRowClick(b) {
    var a = b.data.treeObj,
        c = b.data.row;
    if ("true" == c.attr("hibernated")) a.startTooltipTimer(c, b, 500), settings.get("wakeHibernatedPagesOnClick") && (!b.data.clickedViaHover && !b.data.clickedViaScroll) && bg.tree.awakenPages([c.attr("id")], !0);
    else {
        var d = "undocked" == bg.sidebarHandler.dockState && settings.get("keepSidebarOnTop");
        if (!d || bg.tree.focusedTabId != getChromeId(c)) ft.focusRow(c), chrome.tabs.update(getChromeId(c), {
            active: !0
        }, function(a) {
			if(!!a && typeof a!=='undefined'){
				chrome.windows.get(a.windowId, function(a) {
					"minimized" ==
					a.state && chrome.windows.update(a.id, {
						state: "normal"
					});
					a.focused || chrome.windows.update(a.id, {
						focused: !0
					});
					d && chrome.windows.update(bg.sidebarHandler.windowId, {
						focused: !0
					})
				});
			}
        });
        a.startTooltipTimer(c, b, 2E3)
    }
}

function onPageRowDoubleClick(b) {
    var a = settings.get("pages_doubleClickAction");
    handlePageRowAction(a, b)
}

function onPageRowMiddleClick(b) {
    var a = settings.get("pages_middleClickAction");
    handlePageRowAction(a, b)
}

function handlePageRowAction(b, a) {
    switch (b) {
        case "close":
            onPageRowCloseButton(a);
            break;
        case "hibernate":
            var c = a.data.row.is(a.data.treeObj.focusedRow);
            togglePageRowsHibernated(a.data.row, 0, c);
            break;
        case "expand":
            a.data.treeObj.toggleExpandRow(a.data.row);
            break;
        case "setlabel":
            setRowLabels(a.data.row);
            break;
        case "highlight":
            setRowHighlight(a.data.row, 0)
    }
}

function onPageRowCloseButton(b) {
    var a = b.data.row,
        c = a;
    ft.resetDragDropState(function() {
        if (a.hasClass("ftCollapsed")) {
            var b = a.children(".ftChildren").find(".ftRowNode"),
                e = b.length;
            0 < e && confirm("Also close " + e + " hidden child row(s)?\nPress Cancel to remove the parent row only.") && (c = c.add(b))
        }
		if(c.length>1 || (c.length==1 && c[0].attributes.incognito.value!=="true")){
			c.each(function(a, b) {
				closeRow($(b));
			})
		}else if(c.length==1){
			c.each(function(a, b) {
				closeRow($(b),true);
			})
		}
    })
}

function onPageRowHibernateButton(b) {
    togglePageRowsHibernated(b.data.row)
}

function onWindowRowClick(b) {
    var a = b.data.row,
        b = b.data.treeObj,
        c = getChromeId(a);
    if (c) chrome.windows.update(c, {
        focused: !0
    });
    else if ("true" == a.attr("hibernated")) {
        var c = b.getChildrenContainer(a).find(".ftRowNode[rowtype=page][hibernated=true][restorable=true]").length,
            d;
        0 == c ? (c = b.getChildrenContainer(a).find(".ftRowNode[rowtype=page][hibernated=true]").length, d = !1) : d = !0;
        b = getMessage(d ? "prompt_restoreWindow" : "prompt_awakenWindow", [c, 1 == c ? getMessage("text_page") : getMessage("text_pages")]);
        confirm(b) &&
            bg.tree.awakenWindow(a.attr("id"), function(a) {
                return a.hibernated && (!d || a.restorable)
            })
    }
}

function onWindowRowDoubleClick(b) {
    var a = settings.get("pages_doubleClickAction");
    handleWindowRowAction(a, b)
}

function onWindowRowMiddleClick(b) {
    var a = settings.get("pages_middleClickAction");
    handleWindowRowAction(a, b)
}

function handleWindowRowAction(b, a) {
    switch (b) {
        case "close":
            onWindowRowCloseButton(a);
            break;
        case "expand":
            a.data.treeObj.toggleExpandRow(a.data.row);
            break;
        case "setlabel":
            setRowLabels(a.data.row)
    }
}

function onWindowShowButtons(b, a) {
    for (var c = [], d = 0; d < a.length; d++) {
        var e = a[d];
        "close" == e.id ? c.push(e) : "createTab" == e.id && ("false" == b.attr("hibernated") && "normal" == b.attr("type")) && c.push(e)
    }
    return c
}

function onWindowRowCloseButton(b) {
    closeWindowRow(b.data.row)
}

function onWindowRowCreateTabButton(b) {
    createNewTabInWindow(getChromeId(b.data.row) || void 0)
}

function closeRow(b,icg) {
	let clse=true;
	if(typeof icg !=='undefined' && icg){
		var d = confirm("Delete incognito row?");
		  if (!d) {
			clse=false;
		  }
	}
	if(clse){
		var a = ft.getParentRowNode(b.parent());
		"page" != b.attr("rowtype") || "true" == b.attr("hibernated") || b.hasClass("closing") ? bg.tree.removeNode(b.attr("id")) : (b.addClass("closing"), bg.tree.removeNode(b.attr("id")), setTimeout(function() {
			chrome.tabs.remove(getChromeId(b))
		}, 0));
		"window" == a.attr("rowtype") && 0 == a.find(".ftRowNode").length && bg.tree.removeNode(a.attr("id"), !0)
	}
}

function closeWindowRow(b) {
    ft.resetDragDropState(function() {
        var a = ft.getChildrenCount(b),
            c = settings.get("multiSelectActionConfirmThreshold");
        if (0 < c && a >= c && (a = getMessage("prompt_closeWindow", [a, 1 == a ? getMessage("text_page") : getMessage("text_pages")]), !confirm(a))) return;
        var a = b.attr("id"),
            d = getChromeId(b),
            a = bg.tree.getNode(a);
        "true" == b.attr("hibernated") || !d ? ( removeNodePrint(a), bg.tree.removeNode(a, !0) ) : chrome.windows.get(d, function(a) {
            a && (b.find(".ftRowNode[rowtype=page][hibernated=false]").each(function(a, b) {
                    closeRow($(b))
                }),
                chrome.windows.remove(d))
        })
    })
}

function togglePageRowsHibernated(b, a, c) {
	var h=(a===2)?true:false;
	var dsc=(a===-2)?true:false;
    var d = b.filter(function(a, b) {
            return "true" == $(b).attr("hibernated")
        }),
        b = b.not(d),
        a = a || 0;
    0 <= a && 0 < d.length ? (a = d.map(function(a, b) {
        return $(b).attr("id")
    }), bg.tree.awakenPages(a, c || !1,h)) : 1 == a || 0 == b.length || (a = b.map(function(a, b) {
        return parseInt($(b).attr("chromeId"))
    }), bg.tree.discHibPg(a,dsc))
}

function setPageRowPinnedState(b, a) {
    bg.tree.updateNode(b.attr("id"), {
        pinned: a
    });
    "true" != b.attr("hibernated") && chrome.tabs.update(getChromeId(b), {
        pinned: a
    })
}

function setRowLabels(b) {
    var a = prompt(getMessage("prompt_setLabel"), $(b[0]).attr("label"));
    if (null !== a)
        for (var c = 0; c < b.length; c++) {
            var d = $(b[c]);
            bg.tree.updateNode(d.attr("id"), {
                label: a
            })
        }
}

function setRowHighlight(b, a) {
    var a = a || 0,
        c = "true" == b.attr("highlighted");
    c && 0 >= a ? bg.tree.updateNode(b.attr("id"), {
        highlighted: !1
    }) : -1 == a || c || bg.tree.updateNode(b.attr("id"), {
        highlighted: !0
    })
}

function createNewTabInWindow(b, a) {
    if (!a) switch (settings.get("pages_createNewTabUrl")) {
        case "newtab":
            a = "chrome://newtab/";
            break;
        case "homepage":
            a = void 0;
            break;
        case "blank":
            a = "about:blank";
            break;
        case "google":
            a = "https://www.google.com/webhp"
    }
    chrome.windows.update(b, {
        focused: !0
    }, function() {
        chrome.tabs.create({
            windowId: b,
            url: a,
            active: !0
        })
    })
};