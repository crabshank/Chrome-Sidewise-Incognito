var MonitorInfo = function() {
    this.monitors = loadSetting('monitorMetrics') || [];
    this.maximizedOffset = loadSetting('maximizedOffset') || 0;
    this.detectOnComplete = null;
    this.detectingMonitors = false;
    this.lastDetectionWindowId = null;
}

MonitorInfo.prototype = {

    isKnown: function() {
        return (this.monitors.length > 0);
    },

    retrieveMonitorMetrics: function(callback) {
        var monitors;
        var maximizedOffset;
        var os = window.navigator.platform;
        var thisObj = this;

        if (os == 'MacPPC' || os == 'MacIntel') {
            alert(getMessage('prompt_DetectMonitors_Mac'));

             // Detect single monitor
             log('Detecting single monitor');
             var monitor = [this.getPrimaryMonitorMetrics()];
             this.detectingMonitors = true;
             this.detectMaximizedOffset(true, function(maximizedOffset) {
                log('detection window removed, in callback now');
                thisObj.detectingMonitors = false;
                // alert(getMessage('prompt_DetectMonitors_complete'));
                callback(monitor, maximizedOffset);
             });

             return;
         }

        alert(getMessage('prompt_DetectMonitors'));

        // Detect multiple monitors
        log('Detecting multiple monitors');
        this.detectingMonitors = true;
        this.detectAllMonitorMetrics(function(monitors, maximizedOffset) {
            thisObj.detectingMonitors = false;
            // alert(getMessage('prompt_DetectMonitors_complete'));
            callback(monitors, maximizedOffset);
        });
    },

    saveToSettings: function() {
        log(this.monitors, this.maximizedOffset);
        saveSetting('monitorMetrics', this.monitors);
        saveSetting('maximizedOffset', this.maximizedOffset);
    },

    isDetecting: function() {
        return this.detectingMonitors;
    },

    getPrimaryMonitorMetrics: function() {
         // ascertain the primary monitor's metrics using background page screen object
        var mon = {
            detectedLeft: screen.availLeft,
            availWidth: screen.availWidth,
            marginLeft: screen.availLeft,
            marginRight: screen.width - screen.availWidth - screen.availLeft,
            left: 0,
            width: screen.width
        };
        return mon;
    },

    detectMaximizedOffset: function(closeTestWindowAfter, callback) {
        // create window used for monitor metric detection
        var thisObj = this;
        chrome.windows.create(
            { url: '/detect-monitor.html', left: screen.availLeft, top: screen.availTop, width: 500, height: 200 },
            function(win) {
                log('Created detection window', win.id);
                thisObj.lastDetectionWindowId = win.id;

                // ascertain maximizedOffset
                thisObj.detectMonitorMetrics(win.id, 0, function(winId, testedAtLeft, left, top, width, height) {
                    thisObj.maximizedOffset = screen.availTop - top;
                    if (closeTestWindowAfter) {
                        chrome.windows.remove(win.id, function() {
                            callback(thisObj.maximizedOffset, undefined);
                        });
                        return;
                    }
                    callback(thisObj.maximizedOffset, win);
                });
            }
        );
    },

    detectAllMonitorMetrics: function(onComplete) {
        this.monitors = [];
        this.detectOnComplete = onComplete;

        var mon = this.getPrimaryMonitorMetrics();
        this.monitors.push(mon);

        var thisObj = this;
        this.detectMaximizedOffset(false, function(maximizedOffset, win) {
            log('detection window id', win.id);
            this.maximizedOffset = maximizedOffset;

            // detect additional monitors
            thisObj.detectMonitorMetrics(win.id, mon.width, function() {
                thisObj.onDetectingMonitorToRight.apply(thisObj, arguments);
            });
        });
    },

    detectMonitorMetrics: function(winId, atLeft, callback) {
        chrome.windows.update(winId, { state: 'normal', left: atLeft, top: 0, width: 500, height: 200 },
            function(w) {
                chrome.windows.update(winId, { state: 'maximized' }, function(w) {
                    callback(winId, atLeft, w.left, w.top, w.width, w.height);
                });
            }
        );
    },

    onDetectingMonitorToRight: function(winId, testedAtLeft, left, top, width, height) {
        // do we already know about this monitor?
        // if so it actually means there are no more monitors to the right to be found
        var thisObj = this;
        var matching = this.monitors.filter(function(m) {
            return m.detectedLeft == left + thisObj.maximizedOffset;
        });

        if (matching.length == 0) {
            // don't know about this monitor yet, record it
            var mon = {
                detectedLeft: left + this.maximizedOffset,
                availWidth: width - 2 * this.maximizedOffset,
                marginLeft: left - testedAtLeft + this.maximizedOffset,
                marginRight: 0, // TODO figure out a way to actually determine this
                left: testedAtLeft
            };
            mon.width = mon.marginLeft + mon.availWidth + mon.marginRight;

            this.monitors.push(mon);

            // and continue looking for monitors to the right
            this.detectMonitorMetrics(winId, testedAtLeft + mon.width, function() {
                thisObj.onDetectingMonitorToRight.apply(thisObj, arguments);
            });
            return;
        }

        // TODO MAC OSX
        // if returned value for left is less than testedAtLeft, we did not succeed in finding
        // another monitor (Chrome put the test window back onto the same monitor)

        // now try to detect monitors to the left of the first one
        this.detectMonitorMetrics(winId, -600, function() {
            thisObj.onDetectingMonitorToLeft.apply(thisObj, arguments);
        });
    },

    onDetectingMonitorToLeft: function(winId, testedAtLeft, left, top, width, height) {
        // do we already know about this monitor?
        // if so it actually means there are no more monitors to the left to be found
        var thisObj = this;
        var matching = this.monitors.filter(function(m) {
            return m.detectedLeft >= left + thisObj.maximizedOffset;
        });
        if (matching.length == 0) {
            // don't know about this monitor yet, record it
            var mon = {
                detectedLeft: left + this.maximizedOffset,
                availWidth: width - 2 * this.maximizedOffset,
                marginLeft: 0, // TODO puzzle out a way to get these values
                marginRight: 0,
                left: left + this.maximizedOffset
            };
            mon.width = mon.marginLeft + mon.availWidth + mon.marginRight;

            this.monitors.splice(0, 0, mon);

            // and continue looking for monitors to the left
            this.detectMonitorMetrics(winId, mon.left - 600, function() {
                thisObj.onDetectingMonitorToLeft.apply(thisObj, arguments);
            });
            return;
        }

        // all done, close the detection window
        chrome.windows.remove(winId, function() {
            thisObj.detectOnComplete(thisObj.monitors, thisObj.maximizedOffset);
        });
    }

};