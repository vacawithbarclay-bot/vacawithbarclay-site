// Paste into the reservations sheet: Extensions > Apps Script. Then
// Project Settings > Script properties: add SECRET = (any long random text).
// Deploy > New deployment > Web app, execute as Me, access Anyone.
// Put the web app URL in Netlify as SHEET_WEBHOOK_URL and the same secret as SHEET_WEBHOOK_SECRET.
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secret || body.secret !== secret) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  sheet.appendRow(body.row);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
