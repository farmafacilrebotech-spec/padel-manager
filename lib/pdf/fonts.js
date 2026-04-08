import { ROBOTO_REGULAR_BASE64 } from "./roboto-base64.js";

/**
 * Carga Roboto Regular en jsPDF (UTF-8). Misma TTF para normal y bold
 * (jsPDF requiere el estilo; el glifo es idéntico).
 */
export function loadPdfFonts(doc) {
  const b64 = String(ROBOTO_REGULAR_BASE64 ?? "").replace(/\s+/g, "");
  doc.addFileToVFS("Roboto-Regular.ttf", b64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
}
