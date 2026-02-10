import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  customer: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
    email: string;
  };
  technician: {
    firstName: string;
    lastName: string;
  };
  appointment: {
    workDescription: string;
    laborPrice: number;
    partsPrice: number;
    ivaRate: number;
    totalPrice: number;
    completedAt: Date;
    actualDuration: number;
  };
  companyInfo: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    vatNumber: string;
  };
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  console.log(`[generateInvoicePDF] Starting PDF generation with data:`, JSON.stringify(invoiceData, null, 2));
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  console.log(`[generateInvoicePDF] Page created with size: ${width}x${height}`);

  const fontSize = 12;
  const smallFontSize = 10;
  const titleFontSize = 20;
  const margin = 40;
  const lineHeight = 20;

  let yPosition = height - margin;

  // Helper function to draw text
  const drawText = (text: string, x: number, y: number, size: number = fontSize, color = rgb(0, 0, 0)) => {
    page.drawText(text, {
      x,
      y,
      size,
      color,
    });
  };

  // Helper function to draw line
  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  };

  // Header - Company Info
  drawText("FATTURA", margin, yPosition, titleFontSize);
  yPosition -= lineHeight * 1.5;

  drawText(`${invoiceData.companyInfo.name}`, margin, yPosition, fontSize);
  yPosition -= lineHeight;
  drawText(`${invoiceData.companyInfo.address}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`${invoiceData.companyInfo.city}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`Tel: ${invoiceData.companyInfo.phone}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`Email: ${invoiceData.companyInfo.email}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`P.IVA: ${invoiceData.companyInfo.vatNumber}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight * 2;

  // Invoice Details
  drawLine(margin, yPosition, width - margin, yPosition);
  yPosition -= lineHeight;

  drawText(`Numero Fattura: ${invoiceData.invoiceNumber}`, margin, yPosition, fontSize);
  drawText(`Data: ${invoiceData.invoiceDate.toLocaleDateString("it-IT")}`, width - margin - 150, yPosition, fontSize);
  yPosition -= lineHeight;
  drawText(`Scadenza: ${invoiceData.dueDate.toLocaleDateString("it-IT")}`, width - margin - 150, yPosition, fontSize);
  yPosition -= lineHeight * 2;

  // Customer Info
  drawText("CLIENTE", margin, yPosition, fontSize);
  yPosition -= lineHeight;
  drawText(`${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`, margin, yPosition, fontSize);
  yPosition -= lineHeight;
  drawText(`${invoiceData.customer.address}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`${invoiceData.customer.zipCode} ${invoiceData.customer.city}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`Tel: ${invoiceData.customer.phone}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`Email: ${invoiceData.customer.email}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight * 2;

  // Service Details
  drawLine(margin, yPosition, width - margin, yPosition);
  yPosition -= lineHeight;

  drawText("DETTAGLI INTERVENTO", margin, yPosition, fontSize);
  yPosition -= lineHeight;
  drawText(`Tecnico: ${invoiceData.technician.firstName} ${invoiceData.technician.lastName}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`Data Intervento: ${invoiceData.appointment.completedAt.toLocaleDateString("it-IT")}`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight;
  drawText(`Durata: ${invoiceData.appointment.actualDuration} minuti`, margin, yPosition, smallFontSize);
  yPosition -= lineHeight * 2;

  drawText("Descrizione Lavoro:", margin, yPosition, fontSize);
  yPosition -= lineHeight;
  drawText(invoiceData.appointment.workDescription, margin, yPosition, smallFontSize);
  yPosition -= lineHeight * 2;

  // Pricing Table
  drawLine(margin, yPosition, width - margin, yPosition);
  yPosition -= lineHeight;

  const col1 = margin;
  const col2 = width - margin - 200;
  const col3 = width - margin - 100;

  drawText("Descrizione", col1, yPosition, fontSize);
  drawText("Importo", col2, yPosition, fontSize);
  drawText("Totale", col3, yPosition, fontSize);
  yPosition -= lineHeight;

  drawLine(margin, yPosition, width - margin, yPosition);
  yPosition -= lineHeight;

  // Labor Price
  drawText("Manodopera", col1, yPosition, smallFontSize);
  drawText(`€ ${invoiceData.appointment.laborPrice.toFixed(2)}`, col2, yPosition, smallFontSize);
  yPosition -= lineHeight;

  // Parts Price
  if (invoiceData.appointment.partsPrice > 0) {
    drawText("Materiali/Pezzi", col1, yPosition, smallFontSize);
    drawText(`€ ${invoiceData.appointment.partsPrice.toFixed(2)}`, col2, yPosition, smallFontSize);
    yPosition -= lineHeight;
  }

  // Subtotal
  const subtotal = invoiceData.appointment.laborPrice + invoiceData.appointment.partsPrice;
  drawLine(margin, yPosition, width - margin, yPosition);
  yPosition -= lineHeight;
  drawText("Subtotale:", col1, yPosition, fontSize);
  drawText(`€ ${subtotal.toFixed(2)}`, col3, yPosition, fontSize);
  yPosition -= lineHeight * 1.5;

  // VAT
  const ivaAmount = subtotal * (invoiceData.appointment.ivaRate / 100);
  drawText(`IVA ${invoiceData.appointment.ivaRate}%:`, col1, yPosition, fontSize);
  drawText(`€ ${ivaAmount.toFixed(2)}`, col3, yPosition, fontSize);
  yPosition -= lineHeight * 1.5;

  // Total
  drawLine(margin, yPosition, width - margin, yPosition);
  yPosition -= lineHeight;
  drawText("TOTALE:", col1, yPosition, titleFontSize);
  drawText(`€ ${invoiceData.appointment.totalPrice.toFixed(2)}`, col3, yPosition, titleFontSize);
  yPosition -= lineHeight * 2;

  // Footer
  drawLine(margin, lineHeight * 2, width - margin, lineHeight * 2);
  drawText("Grazie per la fiducia", margin, lineHeight, smallFontSize);

  const pdfBytes = await pdfDoc.save();
  console.log(`[generateInvoicePDF] PDF saved, size: ${pdfBytes.length} bytes`);
  const buffer = Buffer.from(pdfBytes);
  console.log(`[generateInvoicePDF] Buffer created, size: ${buffer.length} bytes`);
  return buffer;
}
