import * as XLSX from 'xlsx';
import { DailyReading, TransformerReading } from '../types';

/**
 * Export Daily Readings to Excel (.xlsx)
 */
export function exportReadingsToExcel(readings: DailyReading[], filename = 'smruthi_daily_meter_readings.xlsx') {
  const data = readings.map((r) => ({
    Date: r.date,
    Time: r.time,
    'Section Name': r.meterName ? `${r.meterCode} (${r.meterName})` : r.sectionId,
    'Meter Code': r.meterCode,
    'Prev KWH': r.prevKwh,
    'Curr KWH': r.currKwh,
    'KWH MF': r.kwhMf,
    'Consumed KWH': r.consumedKwh,
    'Prev KVAH': r.prevKvah,
    'Curr KVAH': r.currKvah,
    'KVAH MF': r.kvahMf,
    'Consumed KVAH': r.consumedKvah,
    'Power Factor': r.powerFactor,
    'Prev Demand': r.prevDemand ?? 0,
    'Curr Demand': r.currDemand ?? 0,
    'Demand MF': r.demandMf,
    'Contract Demand (kVA)': r.calculatedDemand,
    Operator: r.operatorName,
    Shift: r.shift,
    Notes: r.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Readings');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Transformer Readings to Excel
 */
export function exportTransformersToExcel(readings: TransformerReading[], filename = 'smruthi_transformer_loss_log.xlsx') {
  const data = readings.map((t) => ({
    Date: t.date,
    Time: t.time,
    'Main Plant KWH Units': t.mainKwhUnits,
    '750 KVA Prev': t.t750Prev,
    '750 KVA Curr': t.t750Curr,
    '750 KVA MF': t.t750Mf,
    '750 KVA Units': t.t750Units,
    '950 KVA Prev': t.t950Prev,
    '950 KVA Curr': t.t950Curr,
    '950 KVA MF': t.t950Mf,
    '950 KVA Units': t.t950Units,
    'Total Output Units': t.totalOutputUnits,
    'Transformer Losses (kWh)': t.transformerLosses,
    'Loss Percentage (%)': t.lossPercentage,
    Operator: t.operatorName,
    Notes: t.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transformer Losses');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Readings to CSV
 */
export function exportReadingsToCsv(readings: DailyReading[], filename = 'smruthi_daily_meter_readings.csv') {
  const headers = [
    'Date',
    'Time',
    'Meter Code',
    'Meter Name',
    'Prev KWH',
    'Curr KWH',
    'KWH MF',
    'Consumed KWH',
    'Prev KVAH',
    'Curr KVAH',
    'KVAH MF',
    'Consumed KVAH',
    'Power Factor',
    'Contract Demand',
    'Operator',
    'Shift',
  ];

  const rows = readings.map((r) => [
    r.date,
    r.time,
    `"${r.meterCode}"`,
    `"${r.meterName}"`,
    r.prevKwh,
    r.currKwh,
    r.kwhMf,
    r.consumedKwh,
    r.prevKvah,
    r.currKvah,
    r.kvahMf,
    r.consumedKvah,
    r.powerFactor,
    r.calculatedDemand,
    `"${r.operatorName}"`,
    `"${r.shift}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}
