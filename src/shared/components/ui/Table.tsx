import React from "react";

export type TableColumn<T> = {
  header: string;
  accessor: keyof T;
  render?: (row: T) => React.ReactNode;
};

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
}

export default function Table<T>({
  data,
  columns,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="border px-4 py-2 text-left font-semibold"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-6 text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t hover:bg-gray-50 transition"
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="border px-4 py-2">
                    {col.render
                      ? col.render(row)
                      : String(row[col.accessor] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}