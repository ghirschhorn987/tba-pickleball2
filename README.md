# TBA Pickleball Manager

A Google Sheets managed system for coordinating weekly Sunday pickleball games. This project uses Google Apps Script to automate signups, player selection via a weighted lottery system, and historical tracking.

## Features

- **Public Signup Sheet**: Logic to handle monthly signups with specific time slots (8:30, 10:00, 11:30, 1:00).
- **Lottery System**: Algorithm to select 12 players per slot based on a priority hierarchy (History of rejections, declines, recent play time, etc.).
- **Admin Sidebar**: Custom sidebar for administrators to create new months, run the lottery, and manage the system.
- **Data Validation**: Prevents duplicate signups and manages waitlists.

## Project Structure

- **`Code.js`**: Main entry point for the Apps Script. Contains `onOpen`, sidebar launch logic, and acts as the controller for client-side calls.
- **`LotteryService.gs`**: Contains the core logic for the player selection lottery, including ranking and history retrieval.
- **`SheetService.gs`**: Handles all interactions with the Google Sheets (reading/writing user data, formatting, creating tabs).
- **`TestService.gs`**: Utilities to generate mock data for testing the lottery capabilities.
- **`Config.gs`**: Central configuration file for constants (Sheet names, Color codes, Rules).
- **`Debug.gs`**: Helper functions for logging and debugging.
- **`index.html`**: HTML/CSS/JS for the Administrator Sidebar UI.
- **`tba-pickleball-spec.md`**: Detailed technical specification and requirements document.
- **`DEPLOYMENT.md`**: Instructions for deploying and compiling the project using `clasp`.

## Setup

See [DEPLOYMENT.md](DEPLOYMENT.md) for instructions on how to push this code to your Google Sheet project.
