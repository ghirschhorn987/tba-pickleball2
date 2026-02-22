/**
 * Service to handle the Lottery Selection Algorithm.
 */
var LotteryService = (function() {

  /**
   * Structure to hold Player score and stats.
   */
  function PlayerStats(name, email) {
    this.name = name;
    this.email = email;
    this.rejections = 0;
    this.declines = 0;
    this.lastRejectionMonth = -1; // Month index, higher is more recent
    this.lastDeclineMonth = -1;
    this.monthsSinceLastPlayed = 0; 
    this.selectionsLast10Months = 0;
    
    // Calculated Score and Reason
    this.score = 0;
    this.reason = ''; 
  }

  /**
   * Main function to run the lottery for a specific month.
   */
  function runLottery(monthName) {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); // Or Config.ID
    if (CONFIG.PUBLIC_SHEET_ID !== 'REPLACE_WITH_PUBLIC_SHEET_ID') {
       ss = SpreadsheetApp.openById(CONFIG.PUBLIC_SHEET_ID);
    }
    
    var signupData = SheetService.getSignupData(monthName);
    var historyData = _getHistoryData(); // Need to implement this fetch or mock
    
    var resultsBySlot = {};

    // 1. Group Signups by Slot
    var signupsBySlot = _groupSignups(signupData);

    // 2. Process each slot
    Object.keys(signupsBySlot).forEach(function(slotKey) {
      var slotSignups = signupsBySlot[slotKey];
      
      // Calculate scores for all signups in this slot
      var scoredPlayers = slotSignups.map(function(signup) {
        var stats = _getPlayerStats(signup.name, signup.email, historyData);
        signup.stats = stats;
        var scoreResult = _calculateScore(stats);
        signup.score = scoreResult.score;
        signup.reason = scoreResult.reason;
        return signup;
      });
      
      // Handle Pairings (create units)
      var units = _createUnits(scoredPlayers);
      
      // Sort Units by Score (Descending)
      units.sort(function(a, b) {
        return b.score - a.score; // Higher score wins
      });
      
      // Flatten units back to players for Ranking List
      var allRanked = [];
      units.forEach(function(unit) {
          unit.players.forEach(function(p) {
              p.finalScore = unit.score; // Assign unit score to player
              allRanked.push(p);
          });
      });
      
      resultsBySlot[slotKey] = allRanked;
    });
    
    // 3. Update Admin Sheet (Lottery Tab)
    _writeLotteryResults(monthName, resultsBySlot);
    
    return { results: resultsBySlot };
  }
  
  // --- Helper Functions ---

  function _groupSignups(data) {
    var groups = {};
    var currentRow = 0;
    Object.keys(CONFIG.SLOTS).forEach(function(key) {
       var count = CONFIG.SLOTS[key].maxSignups;
       var slotRows = data.slice(currentRow, currentRow + count);
       
       var validSignups = slotRows.filter(function(row) {
         var name = row[0];
         return name && name !== '' && name !== 'Available' && !name.includes('Slot');
       }).map(function(row) {
          return {
            name: row[0],
            email: row[1],
            pairingRequest: row[2] // Column C is Pairing
          };
       });
       
       groups[key] = validSignups;
       currentRow += count;
    });
    return groups;
  }

  function _getHistoryData() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (CONFIG.ADMIN_SHEET_ID !== 'REPLACE_WITH_ADMIN_SHEET_ID') {
       ss = SpreadsheetApp.openById(CONFIG.ADMIN_SHEET_ID);
    }
    var sheet = ss.getSheetByName(CONFIG.HISTORY_TAB_NAME);
    if (!sheet) return {};
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return {}; // Only headers or empty
    
    var historyMap = {};
    // Start at row 1 to skip headers
    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var name = row[0];
        var email = row[1];
        var key = (email && email !== '') ? email.toLowerCase() : name.toLowerCase();
        
        // Everything from index 2 onwards are the monthly statuses (Index 2 is the MOST recent month)
        var statuses = row.slice(2);
        historyMap[key] = statuses;
    }
    
    return historyMap;
  }
  
  function _getPlayerStats(name, email, historyData) {
     var stats = new PlayerStats(name, email);
     var key = (email && email !== '') ? email.toLowerCase() : name.toLowerCase();
     var statuses = historyData[key];
     
     if (!statuses || statuses.length === 0) {
         return stats; // Brand new player
     }

     // Analyze the last 10 months (which are the first 10 elements in the array since the newest is at index 0)
     var searchDepth = Math.min(10, statuses.length);
     var lastPlayedFound = false;
     
     for (var i = 0; i < searchDepth; i++) {
         var status = statuses[i];
         
         if (status === 'Waitlist') {
             stats.rejections++;
             if (stats.lastRejectionMonth === -1) {
                 stats.lastRejectionMonth = 10 - i; // Higher value = more recent (10 is most recent, 1 is 10 months ago)
             }
         } else if (status === 'Declined') {
             stats.declines++;
             if (stats.lastDeclineMonth === -1) {
                 stats.lastDeclineMonth = 10 - i;
             }
         } else if (status === 'Selected') {
             stats.selectionsLast10Months++;
             if (!lastPlayedFound) {
                 stats.monthsSinceLastPlayed = i + 1; // i=0 means they played 1 month ago
                 lastPlayedFound = true;
             }
         }
     }
     
     // If they never played in the last 10 months, set it to max + 1
     if (!lastPlayedFound) {
         stats.monthsSinceLastPlayed = 11;
     }

     return stats;
  }
  
  function _calculateScore(stats) {
    var score = 0;
    var reason = 'Random';

    // Weights configuration to prioritize fairness
    var W_REJECT = 10000;
    var W_DECLINE = 1000;
    var W_RECENCY_BONUS = 100; // Bonus for not having played recently
    var W_SELECTION_PENALTY = 200; // Penalty for playing frequently
    
    if (stats.rejections > 0) {
        score += stats.rejections * W_REJECT;
        // Break ties with recency of rejection (more recent = higher score)
        score += stats.lastRejectionMonth * (W_REJECT / 100); 
        reason = 'High Rejections (' + stats.rejections + ')';
    } else if (stats.declines > 0) {
        score += stats.declines * W_DECLINE;
        score += stats.lastDeclineMonth * (W_DECLINE / 100);
        reason = 'Previous Declines (' + stats.declines + ')';
    } else {
        // Base score favors people who haven't played in a while and penalizes frequent players
        var recencyScore = stats.monthsSinceLastPlayed * W_RECENCY_BONUS;
        var frequencyPenalty = stats.selectionsLast10Months * W_SELECTION_PENALTY;
        var tieBreaker = Math.random() * 10;
        
        score = (recencyScore - frequencyPenalty) + tieBreaker;
        
        if (stats.selectionsLast10Months === 0) {
            reason = 'New/Infrequent Player';
        } else {
            reason = 'Played ' + stats.monthsSinceLastPlayed + ' mo ago';
        }
    }
    
    return { score: score, reason: reason };
  }
  
  function _createUnits(players) {
    var units = [];
    var processedIndices = {};
    
    for (var i = 0; i < players.length; i++) {
      if (processedIndices[i]) continue;
      
      var player = players[i];
      var unit = { players: [player], score: player.score };
      
      if (i + 1 < players.length) {
         var nextPlayer = players[i+1];
         if (nextPlayer.pairingRequest === true) {
             unit.players.push(nextPlayer);
             unit.score = (player.score + nextPlayer.score) / 2;
             player.reason += ' [Paired]';
             nextPlayer.reason += ' [Paired]';
             processedIndices[i+1] = true;
         }
      }
      
      units.push(unit);
      processedIndices[i] = true;
    }
    return units;
  }
  
  function _writeLotteryResults(monthName, resultsBySlot) {
     var ss = SpreadsheetApp.getActiveSpreadsheet();
     if (CONFIG.ADMIN_SHEET_ID !== 'REPLACE_WITH_ADMIN_SHEET_ID') {
       ss = SpreadsheetApp.openById(CONFIG.ADMIN_SHEET_ID);
     }
     
     var sheet = ss.getSheetByName(CONFIG.LOTTERY_TAB_NAME);
     if (!sheet) {
       sheet = ss.insertSheet(CONFIG.LOTTERY_TAB_NAME);
     } else {
       sheet.clear();
     }
     
     sheet.appendRow(['Month:', monthName]);
     
     Object.keys(resultsBySlot).forEach(function(slot) {
        sheet.appendRow(['Slot: ' + slot]);
        // Headers: Pos, Name, Email, Reason, Status
        sheet.appendRow(['Pos', 'Name', 'Email', 'Reason', 'Status']);
        
        var allRanked = resultsBySlot[slot];
        var maxWinners = CONFIG.SLOTS[slot].winners;
        
        // Pass 1: Determine statuses, avoiding splitting pairs
        var spotsAllocated = 0;
        for (var i = 0; i < allRanked.length; i++) {
            var player = allRanked[i];
            var isPaired = player.reason && player.reason.indexOf('[Paired]') > -1;
            
            if (spotsAllocated < maxWinners) {
                if (isPaired) {
                    // Check if we have room for both (assuming this player and the next player are the pair)
                    // We also ensure we don't go out of bounds checking i + 1
                    var nextPlayerIsPaired = (i + 1 < allRanked.length) && allRanked[i+1].reason && allRanked[i+1].reason.indexOf('[Paired]') > -1;
                    
                    // If this is the FIRST of the pair (next player is also paired, and we haven't assigned this one yet)
                    // Or if spotsAllocated + 2 <= maxWinners we distribute safely
                    if (spotsAllocated + 1 === maxWinners && nextPlayerIsPaired) {
                        // Only 1 spot left, but it's a pair. Skip the pair.
                        player.calculatedStatus = 'Waitlist';
                        // The next iteration will handle the second half of the pair, who also won't have room
                    } else {
                        // Room for the whole pair (or it's the second half of the pair)
                        player.calculatedStatus = 'Selected';
                        spotsAllocated++;
                    }
                } else {
                    // Solo player, print normally
                    player.calculatedStatus = 'Selected';
                    spotsAllocated++;
                }
            } else {
                player.calculatedStatus = 'Waitlist';
            }
        }
        
        // Pass 2: Write to sheet
        allRanked.forEach(function(p, index) {
           var pos = index + 1;
           var status = p.calculatedStatus || 'Waitlist';
           sheet.appendRow([pos, p.name, p.email, p.reason, status]);
        });
        sheet.appendRow(['---']);
     });
  }

  return {
    runLottery: runLottery
  };

})();
