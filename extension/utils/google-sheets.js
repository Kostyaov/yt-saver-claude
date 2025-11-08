// Google Sheets API Integration
// Handles all interactions with Google Sheets API v4

class GoogleSheetsAPI {
  constructor(accessToken, spreadsheetId = null) {
    this.accessToken = accessToken;
    this.spreadsheetId = spreadsheetId;
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  // Create a new spreadsheet
  async createSpreadsheet(title = 'YouTube Bookmarks') {
    const url = this.baseUrl;

    const body = {
      properties: {
        title: title,
        locale: 'uk_UA',
        timeZone: 'Europe/Kiev'
      },
      sheets: [
        {
          properties: {
            title: 'Програмування',
            gridProperties: {
              rowCount: 1000,
              columnCount: 8,
              frozenRowCount: 1
            }
          }
        }
      ]
    };

    const response = await this.makeRequest(url, 'POST', body);

    if (response.spreadsheetId) {
      this.spreadsheetId = response.spreadsheetId;

      // Add header row
      await this.setupHeaderRow('Програмування');

      return response.spreadsheetId;
    } else {
      throw new Error('Failed to create spreadsheet');
    }
  }

  // Setup header row for a sheet
  async setupHeaderRow(sheetName) {
    const headers = [
      'Адреса (URL)',
      'Назва відео',
      'Початок (сек)',
      'Кінець (сек)',
      'Опис',
      'Опис відео',
      'Канал',
      'Дата додавання'
    ];

    await this.appendRow(sheetName, headers);

    // Format header row (bold, background color)
    await this.formatHeaderRow(sheetName);
  }

  // Format header row
  async formatHeaderRow(sheetName) {
    const sheetId = await this.getSheetId(sheetName);

    const url = `${this.baseUrl}/${this.spreadsheetId}:batchUpdate`;

    const body = {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.2,
                  green: 0.2,
                  blue: 0.2
                },
                textFormat: {
                  foregroundColor: {
                    red: 1,
                    green: 1,
                    blue: 1
                  },
                  bold: true
                }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }
      ]
    };

    await this.makeRequest(url, 'POST', body);
  }

  // Ensure a sheet with the given name exists
  async ensureSheetExists(sheetName) {
    try {
      const sheets = await this.getSheets();
      const sheetExists = sheets.some(sheet => sheet.properties.title === sheetName);

      if (!sheetExists) {
        await this.createSheet(sheetName);
        await this.setupHeaderRow(sheetName);
      }

      return true;
    } catch (error) {
      console.error('Error ensuring sheet exists:', error);
      throw error;
    }
  }

  // Get list of sheets in the spreadsheet
  async getSheets() {
    const url = `${this.baseUrl}/${this.spreadsheetId}?fields=sheets.properties`;

    const response = await this.makeRequest(url, 'GET');

    return response.sheets || [];
  }

  // Get sheet ID by name
  async getSheetId(sheetName) {
    const sheets = await this.getSheets();
    const sheet = sheets.find(s => s.properties.title === sheetName);

    if (sheet) {
      return sheet.properties.sheetId;
    }

    throw new Error(`Sheet "${sheetName}" not found`);
  }

  // Create a new sheet
  async createSheet(sheetName) {
    const url = `${this.baseUrl}/${this.spreadsheetId}:batchUpdate`;

    const body = {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 8,
                frozenRowCount: 1
              }
            }
          }
        }
      ]
    };

    await this.makeRequest(url, 'POST', body);
  }

  // Append a row to a sheet
  async appendRow(sheetName, rowData) {
    const range = `${sheetName}!A:H`;
    const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodeURIComponent(range)}:append`;

    const params = new URLSearchParams({
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS'
    });

    const body = {
      values: [rowData]
    };

    await this.makeRequest(`${url}?${params}`, 'POST', body);
  }

  // Get spreadsheet info
  async getSpreadsheetInfo() {
    const url = `${this.baseUrl}/${this.spreadsheetId}?fields=properties,sheets.properties`;

    const response = await this.makeRequest(url, 'GET');

    return {
      title: response.properties.title,
      url: response.spreadsheetUrl,
      sheets: response.sheets.map(s => ({
        name: s.properties.title,
        id: s.properties.sheetId,
        rowCount: s.properties.gridProperties.rowCount,
        columnCount: s.properties.gridProperties.columnCount
      }))
    };
  }

  // Make HTTP request to Google Sheets API
  async makeRequest(url, method = 'GET', body = null) {
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
    }

    // Some requests (like DELETE) may not return JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {};
  }
}

// Export for use in service worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleSheetsAPI;
}
