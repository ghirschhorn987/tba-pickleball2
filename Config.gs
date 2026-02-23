/**
 * Configuration constants for the Pickleball Application.
 */
var CONFIG = {
  // IDs for the Spreadsheets. 
  // IMPORTANT: These should be replaced with actual IDs or retrieved from PropertiesService.
  PUBLIC_SHEET_ID: '1Ygx9m7zV6iMg11PCzvY7J8ByUpeT9P-wtbrWdLe5WD4',
  ADMIN_SHEET_ID: '1MAP0TkpL---nr_LWT607c1-MBSoSBaSvYrv9pRcWfg4',
  
  // Sheet Names
  HISTORY_TAB_NAME: 'History',
  LOTTERY_TAB_NAME: 'Lottery',

  // Time Slots
  SLOTS: {
    '8:30': { name: '8:30–10:00', maxSignups: 20, winners: 12 },
    '10:00': { name: '10:00–11:30', maxSignups: 20, winners: 12 },
    '11:30': { name: '11:30–1:00', maxSignups: 12, winners: 12 },
    '1:00': { name: '1:00–2:30', maxSignups: 12, winners: 12 }
  },
  
  // Colors (Hex codes)
  COLORS: {
    SLOT_BG: ['#f0f8ff', '#e6e6fa', '#fff0f5', '#f5f5dc'], // Light distinct colors
    AVAILABLE: '#ffff00', // Yellow
    REPLACEMENT: '#add8e6', // Light Blue
    BORDER: '#000000'
  },

  // Template Formatting Constants from "MANUAL MONTHLY TEMPLATE"
  TEMPLATE_FORMATTING: {
    columnWidths: {
      1: 130, // Name
      2: 160, // Email
      3: 90,  // Pair With Previous
      4: 90,  // Lottery Status
      5: 100, // Player Action
      6: 100, // Time Slot
      defaultDateWidth: 100 // Sunday columns
    },
    headerRow: {
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'bold',
      fontStyle: 'normal',
      fontColor: '#000000',
      background: '#efefef',
      horizontalAlignment: 'center',
      verticalAlignment: 'middle',
      wrapText: true
    }
  },
  
  // Lottery Weights/Priorities (Higher score = higher priority to play)
  // Note: The logic handles these specifically, but constants can be useful
  
  /**
   * Generates a normalized unique key for a player using email or name.
   * Strips leading/trailing whitespace and collapses multiple internal spaces.
   */
  GENERATE_KEY: function(name, email) {
      name = (name || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
      email = (email || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
      return (email !== '') ? email : name;
  }
};
