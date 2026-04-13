import React, { useState, useCallback } from "react";
import { reportsAPI } from "../api";
import { Spinner, PageHeader } from "../components/UI";

const HOSPITAL_NAME = "Kavade Nursing Home";
const HOSPITAL_SUB = "Hospital Management System";

function fmtTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toInputDate(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(dt.getDate()).padStart(2, "0")}`;
}

export default function DailyReportPage() {
  const today = toInputDate(new Date());

  const [date, setDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(async (d) => {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await reportsAPI.dailyPatientReport(d);
      setData(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = () => {
    if (!date) {
      setError("Please select a date");
      return;
    }
    loadReport(date);
  };

  const getFlatRows = () => {
    if (!data?.groups?.length) return [];

    let sr = 0;
    return data.groups.flatMap((g) =>
      g.patients.map((p) => {
        sr += 1;
        return {
          sr,
          doctor: g.doctor,
          patientName: p.name,
          mobile: p.phone || "—",
          regTime: fmtTime(p.registrationTime),
          billAmount: Number(p.totalAmount || 0),
        };
      })
    );
  };

  const handleExportPdf = () => {
    if (!data?.groups?.length) return;
    handleExportPdfAsync();
  };

  const handleExportPdfAsync = async () => {
    if (!data?.groups?.length) return;

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const rows = getFlatRows();
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    doc.setFontSize(18);
    doc.text(HOSPITAL_NAME, 40, 46);

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(HOSPITAL_SUB, 40, 62);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.text(`Daily Patient Report - ${fmtDate(date)}`, 40, 84);

    autoTable(doc, {
      startY: 96,
      head: [["Sr", "Doctor", "Patient Name", "Mobile", "Reg Time", "Bill Amount"]],
      body: rows.map((r) => [
        String(r.sr),
        r.doctor,
        r.patientName,
        r.mobile,
        r.regTime,
        `Rs ${r.billAmount.toLocaleString("en-IN")}`,
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [32, 69, 113] },
      columnStyles: { 5: { halign: "right" } },
      margin: { left: 40, right: 40 },
    });

    const endY = doc.lastAutoTable?.finalY || 110;
    doc.setFontSize(11);
    doc.text(`Total Patients: ${data.totalPatients}`, 40, endY + 24);
    doc.text(`Total Collection: Rs ${Number(data.totalCollection || 0).toLocaleString("en-IN")}`, 40, endY + 42);

    doc.save(`Daily-Patient-Report-${date}.pdf`);
  };

  const handleExportExcel = async () => {
    if (!data?.groups?.length) return;

    const XLSX = await import("xlsx");

    const rows = getFlatRows().map((r) => ({
      Sr: r.sr,
      Doctor: r.doctor,
      "Patient Name": r.patientName,
      Mobile: r.mobile,
      "Registration Time": r.regTime,
      "Bill Amount": r.billAmount,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Daily Report");

    const summaryWs = XLSX.utils.aoa_to_sheet([
      ["Hospital", HOSPITAL_NAME],
      ["Report Date", fmtDate(date)],
      ["Total Patients", data.totalPatients],
      ["Total Collection", Number(data.totalCollection || 0)],
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    XLSX.writeFile(wb, `Daily-Patient-Report-${date}.xlsx`);
  };

  /* ---------------- PRINT FUNCTION ---------------- */

  const handlePrint = () => {
    if (!data) return;

    const pw = window.open("", "_blank");

    let sr = 0;

    const groupsHtml = data.groups
      .map((g) => {
        const docTotal = g.patients.reduce((s, p) => s + p.totalAmount, 0);

        const rows = g.patients
          .map((p) => {
            sr++;

            return `
            <tr>
              <td>${sr}</td>
              <td class="name">${p.name}</td>
              <td>${p.phone}</td>
              <td>${fmtTime(p.registrationTime)}</td>
              <td class="amt">₹${p.totalAmount}</td>
            </tr>
          `;
          })
          .join("");

        return `
        <div class="doctor-block">

          <div class="doctor-title">
            Doctor: ${g.doctor}
          </div>

          <table>
            <thead>
              <tr>
                <th>Sr</th>
                <th>Patient Name</th>
                <th>Mobile</th>
                <th>Reg Time</th>
                <th class="right">Bill Amount</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="doc-summary">
            Total Patients: ${g.patients.length}
            &nbsp;&nbsp; | &nbsp;&nbsp;
            Collection: ₹${docTotal}
          </div>

        </div>
        `;
      })
      .join("");

    const html = `
    <html>
    <head>

      <title>Daily Patient Report</title>

      <style>

      body{
        font-family: 'Segoe UI', Arial;
        margin:30px;
        color:#222;
      }

      .header{
        text-align:center;
        border-bottom:2px solid #0A2342;
        padding-bottom:10px;
        margin-bottom:20px;
      }

      .header h1{
        margin:0;
        font-size:26px;
        color:#0A2342;
      }

      .header p{
        margin:2px;
        color:#666;
        font-size:13px;
      }

      .report-title{
        font-size:18px;
        font-weight:600;
        margin-top:6px;
      }

      .report-date{
        font-size:13px;
        color:#777;
      }

      table{
        width:100%;
        border-collapse:collapse;
        margin-top:8px;
      }

      th{
        background:#f3f6f9;
        padding:7px;
        border:1px solid #ddd;
        font-size:13px;
        text-transform:uppercase;
      }

      td{
        padding:6px;
        border:1px solid #eee;
        font-size:13px;
      }

      .right{
        text-align:right;
      }

      .name{
        font-weight:600;
      }

      .amt{
        text-align:right;
        font-weight:600;
        color:#00695C;
      }

      .doctor-block{
        margin-bottom:25px;
        border:1px solid #ddd;
        border-radius:4px;
        overflow:hidden;
      }

      .doctor-title{
        background:#0A2342;
        color:white;
        padding:6px 10px;
        font-weight:600;
        font-size:13px;
      }

      .doc-summary{
        background:#f7f9fb;
        padding:6px 10px;
        font-weight:600;
        font-size:12px;
        text-align:right;
      }

      .grand{
        margin-top:25px;
        padding:12px;
        border:2px solid #0A2342;
        font-weight:700;
        font-size:15px;
        background:#f9fbfd;
      }

      @page{
        size:A4;
        margin:15mm;
      }

      </style>

    </head>

    <body>

      <div class="header">
        <h1>${HOSPITAL_NAME}</h1>
        <p>${HOSPITAL_SUB}</p>
        <div class="report-title">Daily Patient Report</div>
        <div class="report-date">${fmtDate(date)}</div>
      </div>

      ${groupsHtml}

      <div class="grand">
        Total Patients : ${data.totalPatients} <br/>
        Total Collection : ₹${data.totalCollection}
      </div>

    </body>
    </html>
    `;

    pw.document.open();
    pw.document.write(html);
    pw.document.close();

    pw.onload = function () {
      pw.print();
    };
  };

  /* ---------------- UI ---------------- */

 return (
  <div
    style={{
      padding: 30,
      fontFamily: "Segoe UI, Arial",
      background: "#f5f7fb",
      minHeight: "100vh",
    }}
  >
    <PageHeader
      title="Daily Patient Report"
      subtitle="Generate & print doctor-wise patient report"
    />

    {/* Control Panel */}
    <div
      style={{
        marginTop: 20,
        marginBottom: 25,
        padding: "15px 18px",
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <label
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#333",
        }}
      >
        Select Date :
      </label>

      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => setDate(e.target.value)}
        style={{
          padding: "6px 10px",
          border: "1px solid #ccc",
          borderRadius: 4,
          fontSize: 13,
        }}
      />

      <button
        onClick={handleGenerate}
        style={{
          padding: "7px 14px",
          background: "#204571",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {loading ? "Loading..." : "Generate Report"}
      </button>

      {data && data.groups.length > 0 && (
        <>
          <button
            onClick={handleExportPdf}
            style={{
              padding: "7px 14px",
              background: "#00695C",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Export PDF
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              padding: "7px 14px",
              background: "#1565C0",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Export Excel
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: "7px 14px",
              background: "#424242",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Print Preview
          </button>
        </>
      )}
    </div>

    {/* Error Message */}
    {error && (
      <div
        style={{
          background: "#fdecea",
          color: "#d32f2f",
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid #f5c2c2",
          marginBottom: 20,
          fontSize: 13,
        }}
      >
        {error}
      </div>
    )}

    {/* Loading */}
    {loading && (
      <div style={{ marginTop: 20 }}>
        <Spinner />
      </div>
    )}

    {/* Report Summary */}
    {data && !loading && (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <h3
          style={{
            marginBottom: 10,
            color: "#0A2342",
            fontSize: 18,
          }}
        >
          {HOSPITAL_NAME} - Daily Patient Report ({fmtDate(date)})
        </h3>

        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#00695C",
          }}
        >
          Total Patients : {data.totalPatients}
        </p>
      </div>
    )}
  </div>
);
}