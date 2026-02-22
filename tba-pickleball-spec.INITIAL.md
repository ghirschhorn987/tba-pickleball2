### Project Overview

**System Name:** TBA Pickleball Manager  
**Objective:** Manage weekly Sunday pickleball games with four specific time slots, utilizing a lottery system to select 12 players per slot from a larger pool of signups   
**Platform:** Google Sheets & Google Apps Script.

### 1\. Architecture & Data Structure

The system consists of two distinct Google Sheets 

#### A. Public Signup Sheet (User Accessible)

* **Structure:** Contains multiple tabs, where each tab represents a single month   
* **Columns:**  
  * **Name**  
  * **Email**  
  * **Time Slot:** (Must be one of four specific slots: 8:30–10:00, 10:00–11:30, 11:30–1:00, 1:00–2:30)   
  * **Sundays:** A column for every Sunday in that specific month   
  * **Pairing Indicator:** A column/indicator allowing a user to request to stay paired with the person on the row immediately previous   
* **Row Configuration:**  
  * **Slots 1 & 2 (8:30 & 10:00):** Must allow 20 rows for signups (to allow for overbooking)   
  * **Slots 3 & 4 (11:30 & 1:00):** Must allow 12 rows   
* **User Interaction:**  
  * Signing up implies the player plays all Sundays   
* **Cancellations:** If a user cannot attend a specific date, they replace the cell with the word "Available"   
* **Replacements:** A new user can overwrite "Available" with their name 

#### B. Administration Sheet (Restricted Access)

* **Access:** available only to specific administrator emails   
* **Tab 1: "History"**  
  * **Rows:** Player Name and Email   
  * **Columns:** One column per month recording historical status   
  * **Values:** "Not Signed Up," "Selected," "Declined," or "Rejected"   
* **Tab 2: "Lottery"**  
  * A staging area to list the 12 selected players per slot after running the algorithm

### 2\. UI & Formatting Requirements

#### A. Spreadsheet Styling (Public Sheet)

* **Time Slot Distinction:**  
* Each of the four time slots must use a distinct, light/muted background color   
  A thick, bold black border must separate the time slot sections   
  **Status Color Coding (Conditional Formatting):**  
* **"Available":** Cell background turns **Yellow**   
  **Replacement:** If "Available" is overwritten with a name, the background turns **Light Blue**   
  B. Administrator Sidebar (Apps Script)  
* All management functions must be accessible via a sidebar.html UI   
  **Components:**  
* **Month Selection:** A dropdown menu dynamically populating the next 12 months   
  **Action Buttons:** "Create Month," "Clear Month," "Create Test Data," "Run Lottery," "Update Signup Sheet"

### 3\. Functional Specifications

#### Function: Create New Month

* **Input:** Selected month from Sidebar.  
* **Action:** Generates a new tab in the Public Sheet formatted with the columns and row limits defined in Section 1.A

#### Function: Clear Month

* **Action:** Resets a month to start from scratch (deletes data/tab) 

#### Function: Create Test Data

* **Logic:**  
  * Fills rows with unique common English names   
* **Pattern:** Slot 1 names start with 'A', Slot 2 with 'B', etc.   
* **Variance:** Do not fill all spots; leave some blank, ensure some slots have \>12 and some \<12 signups   
* **History Consistency:** Reuse some names from previous months, introduce some new ones 

#### Function: Run Lottery (Selection Algorithm)

* **Goal:** Select 12 players per time slot from the pool of signups   
* **Constraint:** The algorithm only considers data from the **last 10 months**   
* **Ranking Hierarchy (Tie-Breakers):**  
  **Highest Rejections:** Player with the most previous rejections   
  **Highest Declines:** Player with the most previous declines   
  **Recent Rejection:** Player rejected more recently   
  **Recent Decline:** Player who declined more recently   
  **Least Recently Played:** Player with the oldest "Selected" status   
  **Fewest Selections:** Player selected the fewest times in the last 10 months   
  **Random:** If all else is equal 

* **Pairing Logic:**  
  * If a player has a "keep with previous" indicator, they must be selected or rejected as a unit with the person above them   
    **Edge Case:** If only 1 spot remains (11 filled), and the next rank is a pair, the pair is skipped/rejected   
* **Output:**  
  * Update the "Lottery" tab with the list of winners   
  * Update the "History" tab: New players are added; status updated to "Selected" or "Rejected"; existing players not in the lottery marked "Not Signed Up" 5, 

#### Function: Update Signup Sheet (Finalize)

* **Trigger:** Administrator reviews "Lottery" results and clicks button   
* **Action:** Updates the Public Signup Sheet   
  Removes rows for any player who was **not** selected (leaving only the 12 winners)  
* **Manual Override:** Admin can manually switch a status from "Selected" to "Declined" and pick a replacement before finalizing 

### 4\. Validation Logic

* **Duplicate Prevention:** The Public Sheet must validate that a single name cannot be entered more than once for a given month, even across different time slots,   
* **Pairing Validation:** Ensure pairing requests respect the 12-player cap per slot   