const SPREADSHEET_ID = '1reR9DB9xsPir8WOs9pVD1HThyJ9bmHN_qwcZQ8ICJxY';

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');

    if (!expectedSecret || body.secret !== expectedSecret) {
      return json({ ok: false, error: 'Unauthorized' });
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const operations = body.operations || [];

    operations.forEach((operation) => applyOperation(spreadsheet, operation));

    return json({
      ok: true,
      event: body.event || '',
      operationCount: operations.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return json({ ok: false, error: String(error.message || error) });
  }
}

function applyOperation(spreadsheet, operation) {
  const sheet = spreadsheet.getSheetByName(operation.sheetName);

  if (!sheet) {
    throw new Error('Missing sheet tab: ' + operation.sheetName);
  }

  if (operation.action === 'upsertRow') {
    upsertObjectRow(sheet, operation.matchColumn, operation.row || {});
    return;
  }

  if (operation.action === 'replaceClientRows') {
    replaceClientRows(sheet, operation.matchColumn, operation.rows || []);
    return;
  }

  if (operation.action === 'appendRow') {
    appendObjectRow(sheet, operation.row || {});
    return;
  }

  throw new Error('Unsupported operation: ' + operation.action);
}

function upsertObjectRow(sheet, matchColumn, rowObject) {
  const headers = getHeaders(sheet);
  const matchColumnIndex = headers.indexOf(matchColumn);

  if (matchColumnIndex === -1) {
    throw new Error('Missing match column "' + matchColumn + '" in ' + sheet.getName());
  }

  const matchValue = rowObject[matchColumn];
  const rowValues = objectToRow(headers, rowObject);
  const lastRow = sheet.getLastRow();

  if (matchValue && lastRow >= 2) {
    const values = sheet.getRange(2, matchColumnIndex + 1, lastRow - 1, 1).getValues();
    const matchIndex = values.findIndex((row) => String(row[0]).trim() === String(matchValue).trim());

    if (matchIndex !== -1) {
      sheet.getRange(matchIndex + 2, 1, 1, headers.length).setValues([rowValues]);
      return;
    }
  }

  sheet.appendRow(rowValues);
}

function replaceClientRows(sheet, matchColumn, rows) {
  const headers = getHeaders(sheet);
  const matchColumnIndex = headers.indexOf(matchColumn);

  if (matchColumnIndex === -1) {
    throw new Error('Missing match column "' + matchColumn + '" in ' + sheet.getName());
  }

  const clientName = rows[0] && rows[0][matchColumn];
  const lastRow = sheet.getLastRow();

  if (clientName && lastRow >= 2) {
    const values = sheet.getRange(2, matchColumnIndex + 1, lastRow - 1, 1).getValues();

    for (let i = values.length - 1; i >= 0; i -= 1) {
      if (String(values[i][0]).trim() === String(clientName).trim()) {
        sheet.deleteRow(i + 2);
      }
    }
  }

  rows.forEach((rowObject) => appendObjectRow(sheet, rowObject));
}

function appendObjectRow(sheet, rowObject) {
  const headers = getHeaders(sheet);
  sheet.appendRow(objectToRow(headers, rowObject));
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function objectToRow(headers, rowObject) {
  return headers.map((header) => rowObject[header] || '');
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
