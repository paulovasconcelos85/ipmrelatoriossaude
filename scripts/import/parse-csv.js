// Utilitário de parsing CSV (delimitador ; suporte a aspas RFC4180) usado só para gerar o seed SQL.
const fs = require('fs');
const path = require('path');

function parseCsv(text, delimiter = ';') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delimiter) {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\r') {
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadCsv(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  raw = raw.replace(/^﻿/, '');
  const rows = parseCsv(raw);
  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c && c.trim() !== ''));
  return { header, dataRows };
}

module.exports = { parseCsv, loadCsv };

if (require.main === module) {
  const file = process.argv[2] || path.join(__dirname, '..', '..', 'ipm_system.csv');
  const { header, dataRows } = loadCsv(file);
  console.log('header length', header.length);
  console.log('data rows', dataRows.length);
  dataRows.forEach((r, idx) => {
    if (r.length !== header.length) {
      console.log('ROW LENGTH MISMATCH at', idx, 'len=', r.length, 'first cells:', r.slice(0, 3));
    }
  });
}
