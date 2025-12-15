"use client";

import { exportData } from "@/app/actions/export";
import { Download } from "lucide-react";

export default function ExportButton() {
    const handleExport = async () => {
        try {
            const csvData = await exportData();
            const blob = new Blob([csvData], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `hevy_export_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Failed to export data");
        }
    };

    return (
        <button
            onClick={handleExport}
            className="fixed bottom-24 right-4 bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40 border border-gray-700"
            title="Export CSV"
        >
            <Download size={24} />
        </button>
    );
}
