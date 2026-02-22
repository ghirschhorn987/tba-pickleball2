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
 * Trigger that runs when a user edits the spreadsheet.
 */
function onEdit(e) {
    if (!e || !e.range) return;

    var sheet = e.source.getActiveSheet();
    var sheetName = sheet.getName();

    // Ignore edits on Admin tabs
    if (sheetName === CONFIG.HISTORY_TAB_NAME || sheetName === CONFIG.LOTTERY_TAB_NAME) return;

    var range = e.range;
    var col = range.getColumn();
    var row = range.getRow();
    var newValue = e.value;
    var oldValue = e.oldValue;

    // We only care about edits in the Name column (Column 1) deeper than row 1 (headers)
    if (col === 1 && row > 1) {

        // --- 4.1 Replacement Highlighting ---
        // If the cell was literally the word 'Available' and is now replaced by a name, color it light blue
        if (oldValue === 'Available' && newValue && newValue !== '' && newValue !== 'Available') {
            range.setBackground(CONFIG.COLORS.REPLACEMENT);
        }

        // --- 4.2 Duplicate Validation ---
        // If they typed a real name, check if they are already signed up somewhere else this month
        if (newValue && newValue !== '' && newValue !== 'Available') {
            var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1);
            var names = dataRange.getValues();
            var count = 0;

            for (var i = 0; i < names.length; i++) {
                var n = names[i][0];
                if (n && n.toString().toLowerCase() === newValue.toString().toLowerCase()) {
                    count++;
                }
            }

            // If the name appears more than once (the one they just typed + any existing one)
            if (count > 1) {
                SpreadsheetApp.getUi().alert(
                    "Duplicate Signup Detected",
                    "The name '" + newValue + "' is already signed up for a time slot this month. You cannot sign up multiple times.",
                    SpreadsheetApp.getUi().ButtonSet.OK
                );
                // Revert the cell
                range.setValue(oldValue || '');
                // Try to reset the background if it was an accidental overwrite of a slot
                if (oldValue === 'Available') {
                    range.setBackground(CONFIG.COLORS.AVAILABLE);
                }
            }
        }
    }
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

/**
 * Updates the signup sheet to remove non-selected players.
 */
function updateSignupSheet(monthName) {
    try {
        SheetService.updateSignupSheet(monthName);
        return 'Success: Signup Sheet Updated for ' + monthName;
    } catch (e) {
        throw new Error(e.message);
    }
}
