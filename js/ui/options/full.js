/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

$(document).ready(function() {
    initOptionsPage(postInit)
});
function postInit() {
    "Mac" == PLATFORM && $("#allowAutoUnmaximize").parents(".optionsRow").first().hide();
    showCard("optionsCard");
    if (settings.get("alwaysShowAdvancedOptions"))
        showAdvancedOptions(!1);
    else
        $(document).on("click", "#advancedOptionsExpander", function() {
            showAdvancedOptions(!0)
        });
    $(document).on("click", "#closeButton", onCloseButtonClick).on("click", "#resetButton", resetAllSettings).on("click", "#detectMonitorsButton", detectMonitors).on("click", "#submitBugReportButton", submitBugReport).on("click", "#exportButton", exportState).on("click", "#importButton", importState).on("click", "#recoverLastSessionButton", restoreFromPreviousSessionBackup).on("click", "#loggingEnabled", onLoggingEnabledClick).on("click", "#panePickerExpander", showPanePicker);
    $("#panePickerContainer").hide();
    setSubmitBugReportButtonDisabledState();
    $("#version").text(getMessage("text_Version") + " " + getVersion());
    setMonitorCountInfo(settings.get("monitorMetrics").length, !1);
}
function onLoggingEnabledClick() {
    setSubmitBugReportButtonDisabledState()
}
function setSubmitBugReportButtonDisabledState() {
    var a = $("#submitBugReportButton")
      , b = !$("#loggingEnabled").is(":checked");
    a.attr("disabled", b).attr("title", getMessage("option_submitBugReportButton_hint"))
};