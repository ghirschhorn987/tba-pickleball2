/**
 * Serves the HTML file for the web app.
 */
function doGet() {
    return HtmlService.createHtmlOutputFromFile('index')
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

    // We generally care about edits deeper than row 1 (headers)
    if (row > 1) {

        // --- 4.1 Replacement Highlighting ---
        if (col === 1 && oldValue === 'Available' && newValue && newValue !== '' && newValue !== 'Available') {
            range.setBackground(CONFIG.COLORS.REPLACEMENT);
        }

        // --- 4.2 Duplicate Validation ---
        // Duplicate validation ONLY applies to active ' Signup' tabs
        if (col === 1 && sheetName.endsWith(' Signup') && newValue && newValue !== '' && newValue !== 'Available') {
            var dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1);
            var names = dataRange.getValues();
            var count = 0;

            for (var i = 0; i < names.length; i++) {
                var n = names[i][0];
                if (n && CONFIG.GENERATE_KEY(n, '') === CONFIG.GENERATE_KEY(newValue, '')) {
                    count++;
                }
            }

            if (count > 1) {
                SpreadsheetApp.getUi().alert(
                    "Duplicate Signup Detected",
                    "The name '" + newValue + "' is already signed up for a time slot this month. You cannot sign up multiple times.",
                    SpreadsheetApp.getUi().ButtonSet.OK
                );
                range.setValue(oldValue || '');
                if (oldValue === 'Available') {
                    range.setBackground(CONFIG.COLORS.AVAILABLE);
                }
            }
        }

        // --- 4.3 Waitlist Bump Automation ---
        if (col === 5 && sheetName.endsWith(' Signup') && newValue === 'Decline') {
            // Find the active time slot block
            var timeSlot = sheet.getRange(row, 6).getValue(); // Col 6 is Time Slot
            if (timeSlot && timeSlot !== '') {
                // Find all rows in this time slot
                var allData = sheet.getDataRange().getValues(); // 0-indexed array
                // Find the lowest waitlist number in this block
                var lowestWaitlistNum = 9999;
                var lowestWaitlistRowIndex = -1; // 1-indexed true sheet row

                for (var r = 1; r < allData.length; r++) {
                    var iterSlot = allData[r][5];
                    var iterStatus = allData[r][3]; // Col 4 (Index 3)

                    if (iterSlot === timeSlot && iterStatus && iterStatus.toString().indexOf('Waitlist') === 0) {
                        // Extract number
                        var match = iterStatus.toString().match(/Waitlist #(\d+)/);
                        if (match && match[1]) {
                            var num = parseInt(match[1], 10);
                            if (num < lowestWaitlistNum) {
                                lowestWaitlistNum = num;
                                lowestWaitlistRowIndex = r + 1; // back to 1-indexed sheet row
                            }
                        }
                    }
                }

                // If we found someone to bump
                if (lowestWaitlistRowIndex !== -1) {
                    var actionRule = SpreadsheetApp.newDataValidation().requireValueInList(['Pending', 'Accept', 'Decline']).build();

                    sheet.getRange(lowestWaitlistRowIndex, 4).setValue('Selected');
                    sheet.getRange(lowestWaitlistRowIndex, 5).setValue('Pending').setDataValidation(actionRule);

                    SpreadsheetApp.getUi().alert(
                        "Waitlist Automation",
                        "Someone declined! Promoted the next waitlisted player to Selected.",
                        SpreadsheetApp.getUi().ButtonSet.OK
                    );
                }
            }
        }
    }
}

/**
 * Shows a sidebar.
 */
function showSidebar() {
    var html = HtmlService.createHtmlOutputFromFile('index')
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
 * Validates the signup data for the selected month against history.
 */
function validateSignupData(monthName) {
    try {
        return LotteryService.validateSignupData(monthName);
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
 * Publishes the lottery results to the Signup sheet.
 */
function publishResults(monthName) {
    try {
        SheetService.publishResults(monthName);
        return 'Success: Published results for ' + monthName;
    } catch (e) {
        throw new Error(e.message);
    }
}

/**
 * Finalizes the month.
 */
function finalizeMonth(monthName) {
    try {
        SheetService.finalizeMonth(monthName);
        return 'Success: Finalized ' + monthName;
    } catch (e) {
        throw new Error(e.message);
    }
}

/**
 * Gets a list of date headers for the selected month to populate the cancellation dropdown.
 */
function getWeeksForMonth(monthName) {
    try {
        return SheetService.getWeeksForMonth(monthName);
    } catch (e) {
        throw new Error(e.message);
    }
}

/**
 * Custom UI action to cancel the selected week from the sidebar.
 */
function cancelSelectedWeek(monthName, headerName) {
    try {
        SheetService.cancelWeek(monthName, headerName);
        return 'Success: Cancelled Week ' + headerName;
    } catch (e) {
        throw new Error(e.message);
    }
}
