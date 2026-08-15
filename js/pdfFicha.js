// Ficha técnica en PDF: mosaico de 4 fotos, logo de InmoMaps, precio,
// características, descripción, contacto y un código QR que abre la
// propiedad dentro de InmoMaps. Usa jsPDF y qrcode (cargados por CDN) para
// generarla completamente en el navegador.
(function () {
  "use strict";

  var u = window.App.utils;

  var INK = [17, 24, 39];
  var INK_SECONDARY = [70, 60, 53];
  var INK_MUTED = [138, 122, 112];
  var PRIMARY = [220, 38, 38];
  var PLACEHOLDER_BG = [237, 228, 220];
  var PRIMARY_LIGHT = [254, 242, 242];

  function loadImageAsDataUrl(url) {
    return new Promise(function (resolve) {
      if (!url) { resolve(null); return; }
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext("2d").drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  // El logo se dibuja renderizando el mismo SVG de la marca (igual que en
  // la app) a un canvas, para no tener que reconstruir la forma a mano con
  // las primitivas de dibujo de jsPDF.
  function loadLogoDataUrl() {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60" viewBox="0 0 300 60" font-family="Arial, Helvetica, sans-serif">' +
      '<text x="0" y="45" font-weight="800" font-size="42" fill="#111827">Inm</text>' +
      '<g transform="translate(112,8)"><path fill-rule="evenodd" clip-rule="evenodd" fill="#DC2626" d="M0 22A22 22 0 1 1 22 44L0 44Z M22 12.5A9.5 9.5 0 1 0 22 31.5 9.5 9.5 0 0 0 22 12.5Z"/></g>' +
      '<text x="168" y="45" font-weight="800" font-size="42" fill="#111827">Maps</text>' +
      '</svg>';
    return new Promise(function (resolve) {
      var blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        try {
          var scale = 3;
          var canvas = document.createElement("canvas");
          canvas.width = 300 * scale;
          canvas.height = 60 * scale;
          var ctx = canvas.getContext("2d");
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) { URL.revokeObjectURL(url); resolve(null); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  // Fila de datos centrada con separadores verticales entre cada uno (en
  // vez de íconos, para no tener que rasterizar más imágenes por ficha).
  function drawDividedRow(doc, items, y, pageW) {
    if (!items.length) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    var padX = 12;
    var widths = items.map(function (t) { return doc.getTextWidth(t); });
    var totalW = widths.reduce(function (a, b) { return a + b; }, 0) + padX * 2 * items.length;
    var x = pageW / 2 - totalW / 2;
    items.forEach(function (t, i) {
      var w = widths[i] + padX * 2;
      doc.setTextColor.apply(doc, INK_SECONDARY);
      doc.text(t, x + w / 2, y, { align: "center" });
      if (i < items.length - 1) {
        doc.setDrawColor(224, 214, 204);
        doc.line(x + w, y - 8, x + w, y + 2);
      }
      x += w;
    });
  }

  async function generate(property, agent) {
    if (!window.jspdf || !window.QRCode) {
      u.toast("La generación de PDF no está disponible en este momento.");
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" });
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var margin = 40;

    var photoUrls = (property.photos || []).slice(0, 4);
    var qrTarget = window.location.origin + window.location.pathname + "#/propiedad/" + property.id;
    var results = await Promise.all([
      loadImageAsDataUrl(photoUrls[0]),
      loadImageAsDataUrl(photoUrls[1]),
      loadImageAsDataUrl(photoUrls[2]),
      loadImageAsDataUrl(photoUrls[3]),
      loadLogoDataUrl(),
      window.QRCode.toDataURL(qrTarget, { width: 220, margin: 1 })
    ]);
    var photos = results.slice(0, 4);
    var logoData = results[4];
    var qrDataUrl = results[5];

    // --- Mosaico 2x2 ---
    var gridY = margin, gridH = 260, gap = 4;
    var gridW = pageW - margin * 2;
    var quadW = (gridW - gap) / 2, quadH = (gridH - gap) / 2;
    var quadRects = [
      [margin, gridY],
      [margin + quadW + gap, gridY],
      [margin, gridY + quadH + gap],
      [margin + quadW + gap, gridY + quadH + gap]
    ];
    quadRects.forEach(function (pos, i) {
      if (photos[i]) {
        try { doc.addImage(photos[i], "JPEG", pos[0], pos[1], quadW, quadH); return; } catch (e) { /* se usa el relleno de abajo */ }
      }
      doc.setFillColor.apply(doc, PLACEHOLDER_BG);
      doc.rect(pos[0], pos[1], quadW, quadH, "F");
    });
    var gridBottom = gridY + gridH;

    // --- Insignia del logo, flotando sobre la esquina del mosaico ---
    var badgeW = 128, badgeH = 34, badgeX = margin + 16, badgeY = gridBottom - 16;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6, 6, "F");
    if (logoData) {
      var logoH = 18, logoW = logoH * (300 / 60);
      doc.addImage(logoData, "PNG", badgeX + (badgeW - logoW) / 2, badgeY + (badgeH - logoH) / 2, logoW, logoH);
    }

    // --- Título, ubicación y precio, centrados ---
    var y = gridBottom + 42;
    doc.setTextColor.apply(doc, INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(property.title || "Propiedad", pageW / 2, y, { align: "center" });
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, INK_MUTED);
    doc.text([property.neighborhood, property.city].filter(Boolean).join(", "), pageW / 2, y, { align: "center" });
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor.apply(doc, PRIMARY);
    doc.text(window.App.components.propertyPriceLabel(property), pageW / 2, y, { align: "center" });
    y += 24;

    // --- Características, en una fila con separadores ---
    var specs = [];
    if (property.bedrooms) specs.push(property.bedrooms + " rec.");
    if (property.bathrooms) specs.push(property.bathrooms + " baños");
    if (property.builtArea) specs.push(property.builtArea + " m² const.");
    if (property.lotArea) specs.push(property.lotArea + " m² terreno");
    if (property.parking) specs.push(property.parking + " autos");
    drawDividedRow(doc, specs, y, pageW);
    y += 24;

    // --- Descripción, centrada ---
    if (property.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, INK_SECONDARY);
      var lines = doc.splitTextToSize(property.description, pageW - margin * 2 - 60).slice(0, 4);
      doc.text(lines, pageW / 2, y, { align: "center" });
    }

    // --- Franja de contacto, fija al fondo de la página ---
    var bandH = 56, bandY = pageH - margin - bandH;
    doc.setFillColor.apply(doc, PRIMARY_LIGHT);
    doc.rect(margin, bandY, pageW - margin * 2, bandH, "F");

    var qrSize = 40, qrX = margin + 12, qrY = bandY + (bandH - qrSize) / 2;
    if (qrDataUrl) doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    var contactName = agent ? agent.name : (property.ownerName || "");
    var contactPhone = agent ? (agent.whatsapp || agent.phone) : property.ownerPhone;
    var textX = qrX + qrSize + 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, INK);
    doc.text(contactName || "Contáctanos por InmoMaps", textX, bandY + bandH / 2 - 4);
    if (contactPhone) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, INK_SECONDARY);
      doc.text("WhatsApp / Tel: " + contactPhone, textX, bandY + bandH / 2 + 11);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, PRIMARY);
    doc.text("InmoMaps", pageW - margin - 12, bandY + bandH / 2 + 3, { align: "right" });

    doc.save((property.title || "propiedad").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".pdf");
  }

  window.App.pdfFicha = { generate: generate };
})();
