/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */
var IconTester = function() {
        this.testOnFinished = this.testResetTime = this.testTab = void 0;
        this.badNodesFound = []
    },
    IconTesterDomWindow = void 0;
IconTester.prototype = {
    testIcons: function() {
        preventTestIconsCheck = !0;
        if (confirm("Sidewise's sidebar appears to be showing a Chrome malware warning page. This can happen when you visit a page which Chrome believes to contain malware. Because Sidewise shows the favicon of such pages in the sidebar, this also triggers Chrome's malware warning within the sidebar itself.\n\nSidewise can try to fix this by identifying the bad favicon and removing it from the sidebar.\n\nThis process will take about a minute. DO NOT interact with Chrome until it is complete.")) {
            this.testOnFinished = this.testTab =
                void 0;
            try {
                sidebarHandler.sidebarExists() && sidebarHandler.remove(), this.doTestIcons(this.onTestIconsFinished)
            } catch (a) {
                this.destroyTestIconsPage(), alert("Sorry, but something went wrong during the testing process. No changes have been made to your tree.")
            }
        } else alert("You declined to do the favicon malware test. Sidewise won't ask again until you restart Chrome.")
    },
    onTestIconsFinished: function(a) {
        var b = this;
        0 < a.length ? (a.forEach(function(a) {
            a.favicon = "chrome://favicon"
        }), /*savePageTreeToLocalStorage(tree,"pageTree", !0), savePageTreeToLocalStorage(recentlyClosedTree, "recentlyClosedTree", !0),*/
			 this.badNodesFound.push(a), this.doTestIcons(this.onTestIconsFinished)) : (this.destroyTestIconsPage(), setTimeout(function() {
            sidebarHandler.createWithDockState(settings.get("dockState"));
            0 == b.badNodesFound.length ? setTimeout(function() {
                    alert("Sidewise did not find any favicons that caused the malware page problem. Sorry!\n\nIf you are still seeing the malware page in the sidebar, restarting Chrome and rerunning this test will usually fix it.")
                },
                100) : (setTimeout(function() {
                alert("The testing process is complete and Sidewise has detected " + b.badNodesFound.length.toString() + " favicon(s) that caused the malware page problem.\n\nSidewise has removed these favicons from the sidebar and the problem should now be resolved.")
            }, 100), preventTestIconsCheck = !1)
        }, 500))
    },
    doTestIcons: function(a) {
        this.testTab = void 0;
        this.testOnFinished = a;
        this.startTestIconsLoops()
    },
    createTestIconsPage: function(a) {
        var b = this;
        IconTesterDomWindow = void 0;
        chrome.tabs.create({
                url: "test_icons.html"
            },
            function(c) {
                b.onTestIconsTabCreated(c, a)
            })
    },
    resetTestIconsPage: function(a) {
        var b = this;
        this.testTab ? this.destroyTestIconsPage(function() {
            b.createTestIconsPage(a)
        }) : this.createTestIconsPage(a)
    },
    destroyTestIconsPage: function(a) {
        var b = this,
            a = a || function() {};
        this.testTab ? chrome.tabs.remove(this.testTab.id, function() {
            IconTesterDomWindow = b.testTab = void 0;
            a()
        }) : a()
    },
    onTestIconsTabCreated: function(a, b) {
        var c = this;
        if (!a) throw Error("Test icons tab failed to load.");
        this.testTab = a;
        setTimeout(function() {
            if (IconTesterDomWindow) b();
            else c.onTestIconsTabCreated(a, b)
        }, 250)
    },
    startTestIconsLoops: function() {
        var a = this,
            b = [];
        this.testIconsInTree(tree, function(c) {
            c && (console.warn("GOT IT", c.id, c.favicon), b.push(c));
            a.testIconsInTree(recentlyClosedTree, function(c) {
                if (c) {
                    console.warn("RC GOT IT", c.id, c.favicon);
                    b.push(c)
                }
                a.testOnFinished(b)
            })
        })
    },
    testIconsInTree: function(a, b) {
        var c = this,
            d = a.filter(function(a) {
                return a instanceof PageNode && a.favicon
            });
        this.testResetTime = 5E3;
        this.testIconBatch(d, function() {
                c.destroyTestIconsPage(function() {
                    b()
                })
            },
            function(a) {
                c.destroyTestIconsPage(function() {
                    b(a)
                })
            })
    },
    testIconBatch: function(a, b, c) {
        var d = this;
        this.resetTestIconsPage(function() {
            for (var e = 0; e < a.length; e++) IconTesterDomWindow.testIcon(a[e].favicon);
            setTimeout(function() {
                chrome.tabs.get(d.testTab.id, function(e) {
                    if (0 <= e.title.toLowerCase().indexOf("malware"))
                        if (1 == a.length) c(a[0]);
                        else {
                            var e = a.slice(0, a.length / 2),
                                f = a.slice(a.length / 2);
                            d.testResetTime = 2E3;
                            d.testIconBatch(e, function() {
                                d.testIconBatch(f, function() {
                                    throw Error("Found a bad icon in an earlier iteration but did not find it in subdivision process!");
                                }, c)
                            }, c)
                        }
                    else b()
                })
            }, d.testResetTime)
        })
    }
};