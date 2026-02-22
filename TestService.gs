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

      var sheetName = monthName + ' Signup';
      var sheet = ss.getSheetByName(sheetName);
      
      // Fallback to regular monthName if Signup Doesn't exist (e.g. older months)
      if (!sheet) {
        sheet = ss.getSheetByName(monthName);
      }

      if (!sheet) {
        throw new Error('Sheet ' + sheetName + ' not found. Please create it first.');
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

      var date = new Date(monthName + ' 1');
      var m = (date.getFullYear() * 12 + date.getMonth()) - (2024 * 12);
      if (isNaN(m)) m = 0;

      var namesByLetter = {
        'A': ['Alice', 'Aaron', 'Adam', 'Alex', 'Arthur', 'Alan', 'Amy', 'Anna', 'Andrew', 'Audrey'],
        'B': ['Bob', 'Betty', 'Bella', 'Brian', 'Benjamin', 'Bill', 'Barbara', 'Brenda', 'Brad', 'Bruce'],
        'C': ['Charlie', 'Carl', 'Connor', 'Colin', 'Caleb', 'Cameron', 'Charlotte', 'Chloe', 'Chris', 'Craig'],
        'D': ['David', 'Diana', 'Daniel', 'Derek', 'Donna', 'Dylan', 'Daisy', 'Dustin', 'Dave', 'Dana'],
        'E': ['Eve', 'Evan', 'Eric', 'Emily', 'Ethan', 'Emma', 'Edward', 'Erin', 'Eli', 'Elena'],
        'F': ['Frank', 'Fiona', 'Felicity', 'Finn', 'Felix', 'Flora', 'Fred', 'Faith', 'Faye', 'Ford'],
        'G': ['Grace', 'George', 'Gavin', 'Gina', 'Greg', 'Gloria', 'Gabriel', 'Gwen', 'Gary', 'Gemma'],
        'H': ['Heidi', 'Harry', 'Hannah', 'Henry', 'Hope', 'Harper', 'Hugo', 'Holly', 'Harrison', 'Hazel'],
        'I': ['Ivan', 'Isla', 'Isaac', 'Ian', 'Iris', 'Ivy', 'Irene', 'Igor', 'Imani', 'Isaiah'],
        'J': ['Judy', 'Jack', 'Jill', 'James', 'John', 'Jane', 'Jason', 'Justin', 'Julia', 'Jacob'],
        'K': ['Kevin', 'Kate', 'Kyle', 'Kelly', 'Kurt', 'Karen', 'Keith', 'Kayla', 'Ken', 'Kim'],
        'L': ['Linda', 'Luke', 'Lucy', 'Liam', 'Lily', 'Leo', 'Laura', 'Logan', 'Leah', 'Lance'],
        'M': ['Mike', 'Mary', 'Mark', 'Mia', 'Max', 'Megan', 'Mason', 'Molly', 'Matt', 'Morgan'],
        'N': ['Nancy', 'Nick', 'Nora', 'Noah', 'Nina', 'Neil', 'Naomi', 'Nate', 'Natalie', 'Nelson'],
        'O': ['Oscar', 'Olivia', 'Owen', 'Opal', 'Oliver', 'Orla', 'Omar', 'Odette', 'Orion', 'Otis'],
        'P': ['Peggy', 'Paul', 'Penny', 'Peter', 'Piper', 'Patrick', 'Paige', 'Parker', 'Pearl', 'Preston'],
        'Q': ['Quinn', 'Quincy', 'Queenie', 'Quentin', 'Qasim', 'Quiana', 'Quinton', 'Quill', 'Quigley', 'Quida'],
        'R': ['Rupert', 'Rachel', 'Ryan', 'Rose', 'Richard', 'Ruby', 'Robert', 'Riley', 'Ray', 'Rebecca'],
        'S': ['Sybil', 'Sam', 'Sarah', 'Steve', 'Sophia', 'Scott', 'Stella', 'Sean', 'Samantha', 'Simon'],
        'T': ['Trent', 'Tina', 'Tom', 'Tara', 'Tyler', 'Tess', 'Tim', 'Tracy', 'Toby', 'Taylor']
      };
      var letters = 'ABCDEFGHIJKLMNOPQRST'.split('');

      var currentRow = 2; // Data starts at row 2 usually

      slotConfigs.forEach(function(slotConf, sIndex) {
        // Randomly decide how many spots to fill
        var fillCount;
        if (slotConf.count === 20) {
           // For 20 slots, equal frequency between 10 and 20
           fillCount = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
        } else {
           // For others, 50% to 100%, assuming 12 max
           fillCount = Math.floor(slotConf.count * (0.5 + Math.random() * 0.5));
        } 
        
        for (var i = 0; i < slotConf.count; i++) {
          var currentNameCell = sheet.getRange(currentRow + i, 1).getValue();
          
          // If the cell already has a manual signup (not empty and not 'Available'), skip changing it
          if (currentNameCell && currentNameCell !== '' && currentNameCell !== 'Available') {
              continue;
          }

          if (i < fillCount) {
             var letter = letters[i % letters.length];
             var nameList = namesByLetter[letter];
             
             // Base generation that shifts 20% of names forward each month
             var gen = Math.floor((m + i * 3) / 5);
             
             // Select name. Shift by sIndex to ensure different slots get different names
             var baseName = nameList[(sIndex + gen) % nameList.length];
             
             var name = baseName + '_' + (i + 1);
             var email = baseName.toLowerCase() + '_' + (i + 1) + '@example.com';
             
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
