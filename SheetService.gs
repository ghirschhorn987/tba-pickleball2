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
    
    var tabName = monthName + ' Signup';
    // Check if exists
    if (ss.getSheetByName(monthName) || ss.getSheetByName(tabName)) {
      throw new Error('Sheets for ' + monthName + ' already exist.');
    }

    // Create the active Signup sheet
    var signupSheet = ss.insertSheet(tabName);
    
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
    signupSheet.setFrozenRows(1);

    var currentRow = 1;
    var headerRange = signupSheet.getRange(currentRow, 1, 1, headers.length);
    headerRange.setValues([headers]);
    
    // Apply Template Formatting to Headers
    var tFmt = CONFIG.TEMPLATE_FORMATTING.headerRow;
    headerRange.setFontFamily(tFmt.fontFamily)
               .setFontSize(tFmt.fontSize)
               .setFontWeight(tFmt.fontWeight)
               .setFontStyle(tFmt.fontStyle)
               .setFontColor(tFmt.fontColor)
               .setBackground(tFmt.background)
               .setHorizontalAlignment(tFmt.horizontalAlignment)
               .setVerticalAlignment(tFmt.verticalAlignment)
               .setWrapStrategy(tFmt.wrapText ? SpreadsheetApp.WrapStrategy.WRAP : SpreadsheetApp.WrapStrategy.OVERFLOW);
               
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
      signupSheet.getRange(startRow, 4, rowCount, 1).setValue(slot.name);
      
      // Set Formatting (Color)
      var color = CONFIG.COLORS.SLOT_BG[colorIndex % CONFIG.COLORS.SLOT_BG.length];
      signupSheet.getRange(startRow, 1, rowCount, headers.length).setBackground(color);
      
      // Border for separation
      signupSheet.getRange(endRow, 1, 1, headers.length).setBorder(null, null, true, null, null, null, CONFIG.COLORS.BORDER, SpreadsheetApp.BorderStyle.SOLID_THICK);

      // Add Checkbox for Pairing (Column 3)
      var checkboxRange = signupSheet.getRange(startRow, 3, rowCount, 1);
      checkboxRange.insertCheckboxes();

      currentRow += rowCount;
      colorIndex++;
    });
    
    // Set Column Widths
    // Set Column Widths based on Template Formatting
    var cWidths = CONFIG.TEMPLATE_FORMATTING.columnWidths;
    signupSheet.setColumnWidth(1, cWidths[1]); 
    signupSheet.setColumnWidth(2, cWidths[2]);
    signupSheet.setColumnWidth(3, cWidths[3]);
    signupSheet.setColumnWidth(4, cWidths[6]); // Time Slot is currently Column 4, but let's use cWidths[6] for time slot because 4,5 are reserved for Lottery/Action in publish

    if (headers.length > 4) {
      signupSheet.setColumnWidths(5, headers.length - 4, cWidths.defaultDateWidth);   
    }

    // Apply Conditional Formatting for "Available" (Yellow)
    var rangeToFormat = signupSheet.getRange(2, 1, currentRow - 2, 1); // Only Column A names
    var ruleAvailable = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Available')
      .setBackground(CONFIG.COLORS.AVAILABLE)
      .setRanges([rangeToFormat])
      .build();
      
    var rules = signupSheet.getConditionalFormatRules();
    rules.push(ruleAvailable);
    signupSheet.setConditionalFormatRules(rules);
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
    
    // Delete main sheet if it reached finalized state
    var sheet = ss.getSheetByName(monthName);
    if (sheet) ss.deleteSheet(sheet);
    
    // Delete signup sheet
    var signupSheet = ss.getSheetByName(monthName + ' Signup');
    if (signupSheet) ss.deleteSheet(signupSheet);
  }
  
  /**
   * Reads signup data for a given month.
   */
  function getSignupData(monthName) {
    var ss = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
    var sheet = ss.getSheetByName(monthName + ' Signup'); 
    
    // If the Signup sheet is missing, fallback to main sheet (in case it was already finalized)
    if (!sheet) {
       sheet = ss.getSheetByName(monthName);
    }

    if (!sheet) {
      throw new Error('Signup Sheet ' + monthName + ' Signup not found.');
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
   * Reads Lottery results from Admin sheet and publishes them to the Signup sheet.
   */
  function publishResults(monthName) {
     var adminSs = _getSpreadsheet(CONFIG.ADMIN_SHEET_ID);
     var lotterySheet = adminSs.getSheetByName(CONFIG.LOTTERY_TAB_NAME);
     if (!lotterySheet) throw new Error("Lottery tab not found.");
     
     var lotData = lotterySheet.getDataRange().getValues();
     var statusMap = {}; // Key: email or name -> Status
     
     var currentSlot = null;
     for (var i = 1; i < lotData.length; i++) {
        var row = lotData[i];
        if (row[0] && row[0].toString().indexOf('Slot:') === 0) {
            currentSlot = row[0].replace('Slot: ', '');
            continue;
        }
        if (row[0] === 'Pos' || row[0] === '---' || !currentSlot) continue;
        
        var name = row[1];
        var email = row[2];
        var status = row[4];
        var key = (email && email !== '') ? email.toLowerCase() : name.toLowerCase();
        
        // Include position in Waitlist if waitlisted (Waitlist #1, Waitlist #2 etc)
        // Since players are ranked in sequence per slot, we can calculate waitlist pos
        statusMap[key] = { status: status, pos: row[0] };
     }
     
     // Recalculate Waitlist # numbers based on their overall position inside the slot
     var waitlistCounts = {};
     Object.keys(statusMap).forEach(function(k) {
         if (statusMap[k].status !== 'Selected') {
             var slotMax = CONFIG.SLOTS[currentSlot] ? CONFIG.SLOTS[currentSlot].winners : 12; // Fallback
             // A better way is just sequential numbering since lottery already ordered them
         }
     });
     
     // A cleaner waitlist numbering:
     var waitlistIndex = 1;
     var currentWaitlistSlot = null;
     for (var i = 1; i < lotData.length; i++) {
        var row = lotData[i];
        if (row[0] && row[0].toString().indexOf('Slot:') === 0) {
            currentWaitlistSlot = row[0].replace('Slot: ', '');
            waitlistIndex = 1;
            continue;
        }
        if (row[0] === 'Pos' || row[0] === '---' || !currentWaitlistSlot) continue;
        if (row[4] !== 'Selected') {
            var key = (row[2] && row[2] !== '') ? row[2].toLowerCase() : row[1].toLowerCase();
            statusMap[key].displayStatus = 'Waitlist #' + waitlistIndex;
            waitlistIndex++;
        } else {
            var key = (row[2] && row[2] !== '') ? row[2].toLowerCase() : row[1].toLowerCase();
            statusMap[key].displayStatus = 'Selected';
        }
     }

     var publicSs = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
     var publicSheet = publicSs.getSheetByName(monthName + ' Signup');
     if (!publicSheet) throw new Error("Public sheet not found: " + monthName + " Signup");
     
     // Insert Columns for Lottery Status (4) and Player Action (5)
     publicSheet.insertColumnsAfter(3, 2);
     publicSheet.getRange(1, 4).setValue("Lottery Status").setFontWeight('bold');
     publicSheet.getRange(1, 5).setValue("Player Action").setFontWeight('bold');
     
     // Apply Widths
     var cWidths = CONFIG.TEMPLATE_FORMATTING.columnWidths;
     publicSheet.setColumnWidth(4, cWidths[4]);
     publicSheet.setColumnWidth(5, cWidths[5]);
     
     // Clear any inherited data validations (like checkboxes from Column 3)
     var maxRows = publicSheet.getMaxRows();
     if (maxRows > 1) {
         var wipeRange = publicSheet.getRange(2, 4, maxRows - 1, 2);
         wipeRange.clearDataValidations();
         wipeRange.clearContent();
     }
     
     // Populate Data
     var dataRange = publicSheet.getDataRange();
     var data = dataRange.getValues();
     
     // Setup Data Validation for Player Action
     var actionRule = SpreadsheetApp.newDataValidation().requireValueInList(['Pending', 'Accept', 'Decline']).setAllowInvalid(false).build();
     
     for (var r = 1; r < data.length; r++) {
         var row = data[r];
         var name = row[0];
         var email = row[1];
         // Skip empty rows and section headers
         if (!name || name === '' || name === 'Available' || name.indexOf('Slot:') === 0 || CONFIG.SLOTS[name]) continue;
         
         var key = (email && email !== '') ? email.toLowerCase() : name.toLowerCase();
         var playerRes = statusMap[key];
         
         if (playerRes) {
             var rIdx = r + 1;
             // Set Lottery Status as a single-item dropdown so it renders as a chip
             var statusRule = SpreadsheetApp.newDataValidation().requireValueInList([playerRes.displayStatus]).setAllowInvalid(true).build();
             publicSheet.getRange(rIdx, 4).setValue(playerRes.displayStatus).setDataValidation(statusRule);
             
             // Set Player Action Dropdown if Selected
             if (playerRes.displayStatus === 'Selected') {
                 publicSheet.getRange(rIdx, 5).setValue('Pending').setDataValidation(actionRule);
             }
         }
     }
     
     var pmr = publicSheet.getMaxRows();
     
     // Add Conditional Formatting for colored chips formatting
     var range4 = publicSheet.getRange(2, 4, pmr > 1 ? pmr - 1 : 1, 1);
     var range5 = publicSheet.getRange(2, 5, pmr > 1 ? pmr - 1 : 1, 1);
     var rules = publicSheet.getConditionalFormatRules();
     rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Accept').setBackground('#d9ead3').setFontColor('#274e13').setRanges([range5]).build());
     rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Selected').setBackground('#d9ead3').setFontColor('#274e13').setRanges([range4]).build());
     rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pending').setBackground('#fff2cc').setFontColor('#7f6000').setRanges([range5]).build());
     rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Decline').setBackground('#f4cccc').setFontColor('#990000').setRanges([range5]).build());
     rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Waitlist').setBackground('#fce5cd').setFontColor('#b45f06').setRanges([range4]).build());
     publicSheet.setConditionalFormatRules(rules);
     
     // Protect Lottery Status column so users can't edit it
     // Plus safeguard the original columns 1, 2, 3 so players don't edit names? Wait, the plan only specifies protecting Lottery Status
     var protection = publicSheet.getRange(2, 4, pmr > 1 ? pmr - 1 : 1, 1).protect();
     protection.setDescription('Protect Lottery Status');
     protection.setWarningOnly(false);
     
     // Strictly remove all other editors to ensure a hard lock for the public.
     var me = Session.getEffectiveUser();
     protection.addEditor(me);
     protection.removeEditors(protection.getEditors());
     if (protection.canDomainEdit()) {
       protection.setDomainEdit(false);
     }
  }

  /**
   * Finalizes the month: Converts Pending->Decline, updates history, cleans up rows, locks sheet.
   */
  function finalizeMonth(monthName) {
     var publicSs = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
     var publicSheet = publicSs.getSheetByName(monthName + ' Signup');
     if (!publicSheet) throw new Error("Public sheet not found: " + monthName + " Signup");
     
     var dataRange = publicSheet.getDataRange();
     var data = dataRange.getValues();
     
     var historyResults = {}; 
     // Reconstruct a map similar to what updateHistory expects (it expects resultsBySlot format)
     // Actually, updateHistory expects { "8:30": [ {name, email, status}, ... ] }
     // We will build a unified array format and slightly patch updateHistory locally if needed,
     // or just construct the identical shape.
     var slotKeys = Object.keys(CONFIG.SLOTS);
     slotKeys.forEach(function(k) { historyResults[k] = []; });
     
     // We will store the players who "Accepted" for each slot, in order
     var acceptedPlayersBySlot = {};
     slotKeys.forEach(function(k) { acceptedPlayersBySlot[k] = []; });
     
     var currentSlotKey = null;
     
     // Pass 1: Parse and convert Pending -> Decline, and build history
     for (var r = 1; r < data.length; r++) {
         var row = data[r];
         var name = row[0];
         var email = row[1];
         
         // Identify slot boundaries
         if (name && CONFIG.SLOTS[name]) continue;
         
         // Figure out current slot based on row ranges?
         // In SheetService.createMonthTab, Time Slot is in column F now (Index 5)
         // Wait! Column Time Slot used to be 4 (Index 3). We inserted 2 columns! So it is now Column 6 (Index 5).
         var timeSlot = row[5]; 
         if (timeSlot && timeSlot !== '') {
             // Find matching slot key
             var foundKey = null;
             slotKeys.forEach(function(k) { if(CONFIG.SLOTS[k].name === timeSlot) foundKey = k; });
             if (foundKey) currentSlotKey = foundKey;
         }
         
         if (!name || name === '' || name === 'Available') continue;
         
         var lotStatus = row[3]; // Column D (Index 3)
         var action = row[4];    // Column E (Index 4)
         
         if (action === 'Pending') {
             action = 'Decline';
             publicSheet.getRange(r + 1, 5).setValue('Decline'); // Set to Decline in sheet
         }
         
         // Log for history
         var finalHistStatus = 'Waitlist';
         if (action === 'Accept') {
             finalHistStatus = 'Selected';
             if (currentSlotKey) {
                 acceptedPlayersBySlot[currentSlotKey].push({
                     name: name,
                     email: email,
                     paired: row[2], // Pair With Previous (Column C)
                     rowArr: row     // Complete underlying row data
                 });
             }
         }
         else if (action === 'Decline') finalHistStatus = 'Declined';
         
         if (currentSlotKey) {
             historyResults[currentSlotKey].push({
                 name: name,
                 email: email,
                 // We override status mapping so updateHistory works correctly.
                 // updateHistory uses status field verbatim if we slightly patch it, wait, updateHistory computes it based on index!
                 // Let's pass pre-calculated status via a special property or adjust updateHistory later.
                 // Actually, wait limit: updateHistory currently ignores 'Declined' it only sets 'Selected' or Waitlist based on position!
                 // We must update updateHistory to accept explicit statuses.
                 explicitStatus: finalHistStatus
             });
         }
     }
     
     // Pass 2: Rewrite each slot section
     // We process slot by slot backwards to avoid shifting row issues.
     var startRows = [];
     var currentR = 2; // Data starts at row 2
     slotKeys.forEach(function(k) {
         startRows.push({ key: k, start: currentR, count: CONFIG.SLOTS[k].maxSignups });
         currentR += CONFIG.SLOTS[k].maxSignups;
     });
     
     // To safely rewrite without dealing with complex row deletion math, 
     // we will completely overwrite the values and formats for each slot's block.
     for (var i = 0; i < startRows.length; i++) {
        var slotBlock = startRows[i];
        var accepted = acceptedPlayersBySlot[slotBlock.key];
        
        // Let's cap the final row count to 12
        var finalRowCount = 12;
        var rStart = slotBlock.start;
        var rEndOrig = rStart + slotBlock.count - 1; // e.g. Row 2 to Row 21 (20 max signups)
        var colsTotal = publicSheet.getLastColumn();
        
        // Blank out the entire original slot area first (Name, Email, Pair, TimeSlot(keep), Lottery, Action... plus dates)
        // We actually only need to clear columns 1-3, 4, 5 and dates. We will rewrite them.
        for (var r = rStart; r <= rEndOrig; r++) {
             // We keep Time Slot (Column 6) as is, if it's there? Wait, the template has Time Slot in Col 6.
             // It's safer to just overwrite the values of the rows we KEEP, and DELETE the excess rows.
        }
     }
     
     // Delete excess rows bottom-up
     for (var i = startRows.length - 1; i >= 0; i--) {
        var slotBlock = startRows[i];
        var rStart = slotBlock.start;
        var rEndOrig = rStart + slotBlock.count - 1;
        
        // Delete rows from bottom of slot up to finalRowCount
        // e.g. if max=20, final=12, delete rows rStart+12 to rEndOrig
        var rowsToDelete = slotBlock.count - 12;
        if (rowsToDelete > 0) {
            // Because we delete bottom-up, we don't mess up the start rows of earlier slots
            publicSheet.deleteRows(rStart + 12, rowsToDelete);
        }
     }
     
     // Now that the sheet has exactly 12 rows per slot, we can safely overwrite the data top-down
     currentR = 2;
     for (var i = 0; i < startRows.length; i++) {
        var slotBlock = startRows[i];
        var accepted = acceptedPlayersBySlot[slotBlock.key];
        var templateColor = CONFIG.COLORS.SLOT_BG[i % CONFIG.COLORS.SLOT_BG.length];
        
        for (var rowOffset = 0; rowOffset < 12; rowOffset++) {
            var targetRow = currentR + rowOffset;
            
            if (rowOffset < accepted.length) {
                // Populate accepted player
                var p = accepted[rowOffset];
                publicSheet.getRange(targetRow, 1).setValue(p.name).setBackground(templateColor); // Name
                publicSheet.getRange(targetRow, 2).setValue(p.email); // Email
                if (p.paired) publicSheet.getRange(targetRow, 3).check(); else publicSheet.getRange(targetRow, 3).uncheck();
                
                // Keep the date column values if they had them (we won't overwrite cols 7+)
            } else {
                // Populate Available
                publicSheet.getRange(targetRow, 1).setValue('Available').setBackground(CONFIG.COLORS.AVAILABLE);
                publicSheet.getRange(targetRow, 2).clearContent(); // Email
                publicSheet.getRange(targetRow, 3).uncheck(); // Pair
                
                // Clear dates
                if (colsTotal > 6) {
                    publicSheet.getRange(targetRow, 7, 1, colsTotal - 6).clearContent();
                }
            }
        }
        currentR += 12;
     }
     
     // Delete Lottery Status and Player Action columns entirely
     publicSheet.deleteColumns(4, 2);
     
     // Rename Sheet
     publicSheet.setName(monthName);

     // We also trigger updateHistory
     updateHistoryFinalized(monthName, historyResults);
  }

  /**
   * Helper specifically designed to consume the finalized history states 
   * (Accepted->Selected, Declined/Pending->Declined, Waitlisted->Waitlist)
   */
  function updateHistoryFinalized(monthName, finalResultsBySlot) {
     var ss = _getSpreadsheet(CONFIG.ADMIN_SHEET_ID);
     var sheet = ss.getSheetByName(CONFIG.HISTORY_TAB_NAME);
     
     if (!sheet) {
       sheet = ss.insertSheet(CONFIG.HISTORY_TAB_NAME);
       sheet.appendRow(['Name', 'Email']); 
     }
     
     sheet.insertColumnsAfter(2, 1);
     sheet.getRange(1, 3).setValue(monthName).setFontWeight('bold');

     var data = sheet.getDataRange().getValues();
     var playerRowMap = {}; 
     for (var i = 1; i < data.length; i++) {
         var key = (data[i][1] && data[i][1] !== '') ? data[i][1].toLowerCase() : data[i][0].toLowerCase();
         if (key) playerRowMap[key] = i + 1;
     }

     var nextAvailableRow = data.length + 1;

     Object.keys(finalResultsBySlot).forEach(function(slotKey) {
         var slotPlayers = finalResultsBySlot[slotKey];
         slotPlayers.forEach(function(p) {
             var key = (p.email && p.email !== '') ? p.email.toLowerCase() : p.name.toLowerCase();
             
             var rowToUpdate;
             if (playerRowMap[key]) {
                 rowToUpdate = playerRowMap[key];
             } else {
                 sheet.getRange(nextAvailableRow, 1).setValue(p.name);
                 sheet.getRange(nextAvailableRow, 2).setValue(p.email);
                 rowToUpdate = nextAvailableRow;
                 playerRowMap[key] = nextAvailableRow;
                 nextAvailableRow++;
             }
             sheet.getRange(rowToUpdate, 3).setValue(p.explicitStatus);
         });
     });
     
     // Sort the history tab alphabetically by Name (Column A), ignoring the header row
     var lastRow = sheet.getLastRow();
     if (lastRow > 1) {
         var dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
         dataRange.sort({column: 1, ascending: true});
     }
  }

  /**
   * Gets available date columns for cancellation.
   */
  function getWeeksForMonth(monthName) {
     var publicSs = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
     var sheet = publicSs.getSheetByName(monthName + ' Signup') || publicSs.getSheetByName(monthName);
     if (!sheet) throw new Error("Could not find sheet for " + monthName);
     
     var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
     var weeks = [];
     var timeSlotIdx = headers.indexOf('Time Slot');
     
     // Dates are safely located after Time Slot in all standard configurations
     var startIdx = timeSlotIdx !== -1 ? timeSlotIdx + 1 : 4; 
     for (var i = startIdx; i < headers.length; i++) {
         if (headers[i] && headers[i].toString().trim() !== '') {
             weeks.push(headers[i].toString());
         }
     }
     return weeks;
  }

  /**
   * Helper to format a specific Sunday column as Cancelled
   */
  function cancelWeek(monthName, headerName) {
     var publicSs = _getSpreadsheet(CONFIG.PUBLIC_SHEET_ID);
     var sheet = publicSs.getSheetByName(monthName + ' Signup') || publicSs.getSheetByName(monthName);
     if (!sheet) throw new Error("Could not find sheet for " + monthName);
     
     var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
     var colIndex = -1;
     for (var i = 0; i < headers.length; i++) {
         if (headers[i] && headers[i].toString() === headerName) colIndex = i + 1;
     }
     if (colIndex === -1) throw new Error("Could not find week column for " + headerName);
     
     // Color it red/gray block
     var range = sheet.getRange(1, colIndex, sheet.getMaxRows(), 1);
     range.setBackground('#ffcccc'); // Red-ish tint
     
     // Populate "Cancelled" for all signups in this column
     var maxRows = sheet.getLastRow();
     if (maxRows > 1) {
         var dataRange = sheet.getRange(2, colIndex, maxRows - 1, 1);
         var vals = dataRange.getValues();
         for (var r = 0; r < vals.length; r++) {
             vals[r][0] = 'Cancelled';
         }
         dataRange.setValues(vals);
     }
     
     // Protect it
     var prot = range.protect().setDescription('Cancelled Week');
     
     // Strictly remove all other editors to ensure a hard lock for the public.
     // (Note: The owner of the spreadsheet will mathematically always bypass soft/hard locks)
     var me = Session.getEffectiveUser();
     prot.addEditor(me);
     prot.removeEditors(prot.getEditors());
     if (prot.canDomainEdit()) {
       prot.setDomainEdit(false);
     }
     prot.setWarningOnly(false);
  }

  return {
    createMonthTab: createMonthTab,
    clearMonthTab: clearMonthTab,
    getSignupData: getSignupData,
    updateHistory: updateHistoryFinalized, // Keeping legacy reference mapping just in case
    publishResults: publishResults,
    finalizeMonth: finalizeMonth,
    getWeeksForMonth: getWeeksForMonth,
    cancelWeek: cancelWeek
  };

})();
