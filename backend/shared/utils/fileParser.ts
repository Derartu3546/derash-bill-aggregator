import * as XLSX from "xlsx";
import AdmZip from "adm-zip";
import fs from "fs";
import { parseCsv } from "./csvParser";

const excelDateToJSDate = (serial: any) => {
  
  if (typeof serial === "string") return serial;
  return new Date((serial - (25567 + 2)) * 86400 * 1000);
};

export const parseFile = async (filePath: string): Promise<any[]> => {
  const ext = filePath.split(".").pop()?.toLowerCase();

  // 1. Handle ZIP: Extract and parse the first file inside
  if (ext === "zip") {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) throw new Error("ZIP file is empty");

    const firstFile = zipEntries[0];
    const extractPath = filePath.replace(".zip", `_${firstFile.entryName}`);
    zip.extractEntryTo(firstFile.entryName, "uploads/temp", false, true);

    return parseFile(`uploads/temp/${firstFile.entryName}`);
  }

  // 2. Handle Excel: Convert to JSON
  if (ext === "xlsx" || ext === "xls") {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true }); // <--- Add cellDates: true
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      return jsonData.map((row: any) => {
          if (row.dueDate) {
            
              if (typeof row.dueDate === "number") {
                row.dueDate = new Date(
                  (row.dueDate - (25567 + 2)) * 86400 * 1000,
                );
              }
              const dateObj = new Date(row.dueDate);
              if (!isNaN(dateObj.getTime())) {
                row.dueDate = dateObj.toISOString(); // Store as clean ISO string
              }
          }
          console.log("DEBUG - Excel Row 0:", jsonData[0]);
        return row;
      });
  }

  // 3. Handle CSV: Use your existing parser
  return parseCsv(fs.readFileSync(filePath));
};
