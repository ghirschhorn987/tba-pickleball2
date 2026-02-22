/**
 * Serves the HTML file for the web app.
 */
function doGet() {
    return HtmlService.createHtmlOutputFromFile('tba-pickleball2/index')
        .setTitle('Pickleball Manager')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Trigger that runs when the spreadsheet is opened.
 */
function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Pickleball Menu')
        .addItem('Open Sidebar', 'showSidebar')
        .addToUi();
}

/**
 * Shows a sidebar.
 */
function showSidebar() {
    var html = HtmlService.createHtmlOutputFromFile('tba-pickleball2/index')
        .setTitle('Pickleball Manager')
        .setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html);
}

// --- Client Callable Functions ---

/**
 * Creates a new month tab.
 * @param {string} monthName
 */
function createMonth(monthName) {
    try {
        SheetService.createMonthTab(monthName);
        return 'Success: Created ' + monthName;
    } catch (e) {
        throw new Error(e.message);
    }
}

/**
 * Clears a month tab.
 */
function clearMonth(monthName) {
    try {
        SheetService.clearMonthTab(monthName);
        return 'Success: Cleared ' + monthName;
    } catch (e) {
        throw new Error(e.message);
    }
}

/**
 * Creates test data for development.
 */
function createTestData(monthName) {
    try {
        TestService.createTestData(monthName);
        return 'Success: Created Test Data for ' + monthName;
    } catch (e) {
        throw new Error(e.message);
    }
}

/**
 * Runs the lottery.
 */
function runLottery(monthName) {
    try {
        var results = LotteryService.runLottery(monthName);
        return 'Success: Lottery Run. check Lottery Tab.';
    } catch (e) {
        throw new Error(e.message);
    }
}
