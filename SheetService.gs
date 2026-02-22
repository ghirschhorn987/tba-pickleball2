/**
 * Service to handle Google Sheet interactions.
 */
var SheetService = (function() {

  /**
   * Helper to get a spreadsheet by ID.
   */
  function _getSpreadsheet(id) {
    try {
      if (id === 'REPLACE_WITH_PUBLIC_SHEET_ID' || id === 'REPLACE_WITH_ADMIN_SHEET_ID') {
        // Fallback for development if IDs aren't set, use active sheet for everything
        return SpreadsheetApp.getActiveSpreadsheet();
      }
      return SpreadsheetApp.openById(id);
    } catch (e) {
      console.error('Error opening spreadsheet: ' + id, e);
      return SpreadsheetApp.getActiveSpreadsheet(); // Fallback
    }
  }

  /**
   * Creates a new month tab in the Public Sheet.
   * @param {string} monthName - The name of the month (e.g., "October 2023").
   * @param {number} sundaysCount - Number of Sundays in that month.
   */
  function createMonthTab(monthName) {
    var ss = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
    
    // Check if exists
    if (ss.getSheetByName(monthName) || ss.getSheetByName(monthName + '_Signup')) {
      throw new Error('Sheets for ' + monthName + ' already exist.');
    }

    // Create the Main display sheet
    var sheet = ss.insertSheet(monthName);
    // Create the active Signup sheet
    var signupSheet = ss.insertSheet(monthName + '_Signup');
    
    // Calculate Sundays
    var sundays = _getSundaysInMonth(monthName);

    // Setup Headers
    // New Order: Name, Email, Pair With Previous, Time Slot
    var headers = ['Name', 'Email', 'Pair With Previous', 'Time Slot'];
    sundays.forEach(function(d) {
       var dateStr = _formatDate(d);
       headers.push(dateStr);
    });
    
    // Freeze top row
    sheet.setFrozenRows(1);

    var currentRow = 1;
    sheet.getRange(currentRow, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    currentRow++;

    // Prepare Slot Data
    var slotKeys = Object.keys(CONFIG.SLOTS);
    var colorIndex = 0;

    slotKeys.forEach(function(key) {
      var slot = CONFIG.SLOTS[key];
      var rowCount = slot.maxSignups;
      
      var startRow = currentRow;
      var endRow = currentRow + rowCount - 1;
      
      // Set Slot Name column (Column 4 is Time Slot)
      sheet.getRange(startRow, 4, rowCount, 1).setValue(slot.name);
      
      // Set Formatting (Color)
      var color = CONFIG.COLORS.SLOT_BG[colorIndex % CONFIG.COLORS.SLOT_BG.length];
      sheet.getRange(startRow, 1, rowCount, headers.length).setBackground(color);
      
      // Border for separation
      sheet.getRange(endRow, 1, 1, headers.length).setBorder(null, null, true, null, null, null, CONFIG.COLORS.BORDER, SpreadsheetApp.BorderStyle.SOLID_THICK);

      // Add Checkbox for Pairing (Column 3)
      var checkboxRange = sheet.getRange(startRow, 3, rowCount, 1);
      checkboxRange.insertCheckboxes();

      currentRow += rowCount;
      colorIndex++;
    });
    
    // Set Column Widths
    // Name (1) and Sundays (5+) -> Wide enough for "Michael Longishlastname" (~200px)
    // Email (2) -> 1.5x wider (~300px)
    // Pair (3) -> Standard
    // Slot (4) -> Standard
    
    sheet.setColumnWidth(1, 200); 
    sheet.setColumnWidth(2, 300);
    // Columns 5 onwards are Sundays
    if (headers.length > 4) {
      sheet.setColumnWidths(5, headers.length - 4, 200);   
    }

    // Apply Conditional Formatting for "Available" (Yellow)
    var rangeToFormat = sheet.getRange(2, 1, currentRow - 2, 1); // Only Column A names
    var ruleAvailable = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Available')
      .setBackground(CONFIG.COLORS.AVAILABLE)
      .setRanges([rangeToFormat])
      .build();
      
    var rules = sheet.getConditionalFormatRules();
    rules.push(ruleAvailable);
    sheet.setConditionalFormatRules(rules);

    // EXACT same formatting for the Signup sheet
    signupSheet.setFrozenRows(1);
    signupSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    
    // Copy the entire formatted range from the Main sheet to the Signup sheet
    var sourceRange = sheet.getRange(2, 1, currentRow - 2, headers.length);
    var targetRange = signupSheet.getRange(2, 1, currentRow - 2, headers.length);
    sourceRange.copyTo(targetRange); // Copy values, formats, data validations, everything
    
    // Set matching column widths on Signup Sheet
    signupSheet.setColumnWidth(1, 200); 
    signupSheet.setColumnWidth(2, 300);
    if (headers.length > 4) {
      signupSheet.setColumnWidths(5, headers.length - 4, 200);   
    }
  }

  /**
   * Formats date as "MMM DD" (e.g. Oct 05)
   */
  function _formatDate(date) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var m = months[date.getMonth()];
    var d = date.getDate();
    if (d < 10) d = '0' + d;
    return m + ' ' + d;
  }

  /**
   * Helper to find Sundays in a given month string "MonthName YYYY"
   */
  function _getSundaysInMonth(monthStr) {
    var parts = monthStr.split(' ');
    var monthName = parts[0];
    var year = parseInt(parts[1]);
    
    var monthMap = {
      "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
      "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
    };
    var monthIndex = monthMap[monthName];
    
    var date = new Date(year, monthIndex, 1);
    var sundays = [];
    
    // Find first Sunday
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1);
    }
    
    // Collect all Sundays
    while (date.getMonth() === monthIndex) {
      sundays.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }
    
    return sundays;
  }

  /**
   * Clears/Deletes a month tab.
   */
  function clearMonthTab(monthName) {
    var ss = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
    
    // Delete main sheet
    var sheet = ss.getSheetByName(monthName);
    if (sheet) ss.deleteSheet(sheet);
    
    // Delete signup sheet
    var signupSheet = ss.getSheetByName(monthName + '_Signup');
    if (signupSheet) ss.deleteSheet(signupSheet);
  }
  
  /**
   * Reads signup data for a given month.
   */
  function getSignupData(monthName) {
    var ss = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
    // Lottery reads from the _Signup sheet!
    var sheet = ss.getSheetByName(monthName + '_Signup'); 
    
    // If the Signup sheet is missing, fallback to main sheet (in case it was already finalized)
    if (!sheet) {
       sheet = ss.getSheetByName(monthName);
    }

    if (!sheet) {
      throw new Error('Signup Sheet ' + monthName + '_Signup not found.');
    }
    
    var data = sheet.getDataRange().getValues();
    // Remove header
    data.shift();
    return data;
  }
  
  /**
   * Updates the History tab in the Admin Spreadsheet.
   * Inserts the new month at Column C (reverse chronological) and updates status.
   */
  function updateHistory(monthName, lotteryResults) {
     var ss = _getSpreadsheet(CONFIG.ADMIN_SHEET_ID);
     var sheet = ss.getSheetByName(CONFIG.HISTORY_TAB_NAME);
     
     if (!sheet) {
       // Create if doesn't exist
       sheet = ss.insertSheet(CONFIG.HISTORY_TAB_NAME);
       sheet.appendRow(['Name', 'Email']); // Initial headers
     }
     
     // 1. Insert new column for the month at Column C (index 3)
     sheet.insertColumnsAfter(2, 1);
     sheet.getRange(1, 3).setValue(monthName).setFontWeight('bold');

     // 2. Read existing data to find players row mapping
     var dataRange = sheet.getDataRange();
     var data = dataRange.getValues();
     var playerRowMap = {}; // Key: Email (or Name if no email), Value: Row Index (1-based)
     
     for (var i = 1; i < data.length; i++) {
         var name = data[i][0];
         var email = data[i][1];
         var key = (email && email !== '') ? email.toLowerCase() : name.toLowerCase();
         // i is 0-indexed based on data array, but rows are 1-indexed. row = i + 1
         if (key) {
             playerRowMap[key] = i + 1;
         }
     }

     // 3. Process the lottery results
     var nextAvailableRow = data.length + 1;
     var processedKeys = {};

     // Create a flattened list of all players who participated this month
     var allParticipants = [];
     Object.keys(lotteryResults).forEach(function(slotKey) {
         var slotPlayers = lotteryResults[slotKey];
         // Waitlist is determined by max winners per slot
         var maxWinners = CONFIG.SLOTS[slotKey].winners;
         
         slotPlayers.forEach(function(p, index) {
             var status = (index < maxWinners) ? 'Selected' : 'Waitlist';
             // Default to email as key, fallback to name
             var key = (p.email && p.email !== '') ? p.email.toLowerCase() : p.name.toLowerCase();
             allParticipants.push({
                 name: p.name,
                 email: p.email,
                 key: key,
                 status: status
             });
         });
     });

     // 4. Update the sheet
     allParticipants.forEach(function(participant) {
         var rowToUpdate;
         if (playerRowMap[participant.key]) {
             // Existing player
             rowToUpdate = playerRowMap[participant.key];
         } else {
             // New player - append Name and Email, then setup the row map
             sheet.getRange(nextAvailableRow, 1).setValue(participant.name);
             sheet.getRange(nextAvailableRow, 2).setValue(participant.email);
             rowToUpdate = nextAvailableRow;
             playerRowMap[participant.key] = nextAvailableRow;
             nextAvailableRow++;
         }
         
         // Set the status for this month (Column C = 3)
         sheet.getRange(rowToUpdate, 3).setValue(participant.status);
         processedKeys[participant.key] = true;
     });

     // Optional: We don't necessarily need to fill "Not Signed Up" for blank cells in the new column.
     // Blank cells in Column C implies they didn't participate this month.
  }

  /**
   * Reads the Lottery tab to find "Selected" users and updates the Public Sheet
   * to remove any non-selected players.
   */
  function updateSignupSheet(monthName) {
     var adminSs = _getSpreadsheet(CONFIG.ADMIN_SHEET_ID);
     var lotterySheet = adminSs.getSheetByName(CONFIG.LOTTERY_TAB_NAME);
     if (!lotterySheet) throw new Error("Lottery tab not found.");
     
     // Parse Lottery Results
     var lotData = lotterySheet.getDataRange().getValues();
     var winnersBySlot = {};
     var currentSlot = null;
     
     // Skip row 0 which is ['Month:', monthName]
     for (var i = 1; i < lotData.length; i++) {
        var row = lotData[i];
        if (row[0] && row[0].toString().indexOf('Slot:') === 0) {
            currentSlot = row[0].replace('Slot: ', '');
            winnersBySlot[currentSlot] = [];
            continue;
        }
        if (row[0] === 'Pos' || row[0] === '---' || !currentSlot) continue;
        
        // Headers: Pos, Name, Email, Reason, Status
        var status = row[4];
        if (status === 'Selected') {
            var name = row[1];
            var email = row[2];
            winnersBySlot[currentSlot].push({name: name, email: email, pairing: false});
            // We just set pairing back to false as they are already selected and it doesn't matter much post-lottery
        }
     }
     
     var publicSs = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
     var publicSheet = publicSs.getSheetByName(monthName);
     if (!publicSheet) throw new Error("Public sheet not found: " + monthName);
     
     var currentRow = 2; // Row 1 is frozen headers
     var slotKeys = Object.keys(CONFIG.SLOTS);
     
     slotKeys.forEach(function(key) {
        var slot = CONFIG.SLOTS[key];
        var rowCount = slot.maxSignups;
        var winners = winnersBySlot[key] || [];
        
        // We will overwrite the block with winners, then clear the rest
        var targetRange = publicSheet.getRange(currentRow, 1, rowCount, 3); // Name, Email, Pair
        var blockData = [];
        
        for (var j = 0; j < rowCount; j++) {
            if (j < winners.length) {
                var w = winners[j];
                blockData.push([w.name, w.email, false]);
            } else {
                blockData.push(['', '', false]); // Clear non-winners
            }
        }
        
        targetRange.setValues(blockData);
        currentRow += rowCount;
     });
     
     // FINALIZE: Delete the _Signup tab so players can no longer edit values
     var signupSheet = publicSs.getSheetByName(monthName + '_Signup');
     if (signupSheet) {
         publicSs.deleteSheet(signupSheet);
     }
  }

  return {
    createMonthTab: createMonthTab,
    clearMonthTab: clearMonthTab,
    getSignupData: getSignupData,
    updateHistory: updateHistory,
    updateSignupSheet: updateSignupSheet
  };

})();
