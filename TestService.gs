/**
 * Service to generate test data for the Pickleball application.
 */
var TestService = (function() {

  /**
   * Generates test data for a given month.
   */
  function createTestData(monthName) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      // In production we'd use Config.PUBLIC_SHEET_ID, but for local testing without IDs we use Active
       if (CONFIG.PUBLIC_SHEET_ID !== 'REPLACE_WITH_PUBLIC_SHEET_ID') {
         ss = SpreadsheetApp.openById(CONFIG.PUBLIC_SHEET_ID);
       }

      var sheet = ss.getSheetByName(monthName);
      if (!sheet) {
        throw new Error('Sheet ' + monthName + ' not found. Please create it first.');
      }

      var data = sheet.getDataRange().getValues();
      var headers = data[0]; // First row is header
      
      // Slot Config Mapping
      var slotConfigs = [
        { key: '8:30', prefix: 'A', count: CONFIG.SLOTS['8:30'].maxSignups }, // Slot 1
        { key: '10:00', prefix: 'B', count: CONFIG.SLOTS['10:00'].maxSignups }, // Slot 2
        { key: '11:30', prefix: 'C', count: CONFIG.SLOTS['11:30'].maxSignups }, // Slot 3
        { key: '1:00', prefix: 'D', count: CONFIG.SLOTS['1:00'].maxSignups }   // Slot 4
      ];

      var currentRow = 2; // Data starts at row 2 usually

      slotConfigs.forEach(function(slotConf) {
        // Randomly decide how many spots to fill
        var fillCount;
        if (slotConf.count === 20) {
           // For 20 slots, equal frequency between 8 and 20
           fillCount = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
        } else {
           // For others, 50% to 100%, assuming 12 max
           fillCount = Math.floor(slotConf.count * (0.5 + Math.random() * 0.5));
        } 
        
        for (var i = 0; i < slotConf.count; i++) {
          if (i < fillCount) {
             var name = slotConf.prefix + '_Player_' + (i + 1);
             var email = name.toLowerCase() + '@example.com';
             
             // Set Name
             sheet.getRange(currentRow + i, 1).setValue(name);
             // Set Email
             sheet.getRange(currentRow + i, 2).setValue(email);
             
             // Randomly set pairing
             if (i > 0 && Math.random() < 0.2) { // 20% chance of pairing
                sheet.getRange(currentRow + i, 3).check();
             }
          } else {
             // Leave some Available
             sheet.getRange(currentRow + i, 1).setValue('Available');
             sheet.getRange(currentRow + i, 1).setBackground(CONFIG.COLORS.AVAILABLE);
          }
        }
        currentRow += slotConf.count;
      });
      
    } catch (e) {
      console.error('Error creating test data: ' + e);
      throw e;
    }
  }

  return {
    createTestData: createTestData
  };

})();
