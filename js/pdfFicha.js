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

  // targetRatio (ancho/alto) recorta la foto tipo "cover" antes de meterla
  // al PDF, para que llene el recuadro sin estirarse — igual que
  // object-fit:cover en la web. Sin targetRatio, se usa la foto tal cual.
  function loadImageAsDataUrl(url, targetRatio) {
    return new Promise(function (resolve) {
      if (!url) { resolve(null); return; }
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        try {
          var sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (targetRatio) {
            var srcRatio = img.width / img.height;
            if (srcRatio > targetRatio) { sw = img.height * targetRatio; sx = (img.width - sw) / 2; }
            else { sh = img.width / targetRatio; sy = (img.height - sh) / 2; }
          }
          var canvas = document.createElement("canvas");
          canvas.width = sw;
          canvas.height = sh;
          canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
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

  // Bloque de "ETIQUETA" en mayúsculas + un párrafo debajo (para Amenidades
  // y Créditos aceptados). Regresa la nueva posición "y" para encadenar;
  // recorta las líneas que no quepan antes de maxY.
  function drawLabeledParagraph(doc, label, text, x, y, width, maxY) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, INK_MUTED);
    doc.text(label, x, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.7);
    doc.setTextColor.apply(doc, INK_SECONDARY);
    var lines = doc.splitTextToSize(text, width);
    var maxLines = Math.max(1, Math.floor(((maxY || Infinity) - y) / 11));
    if (lines.length > maxLines) lines = lines.slice(0, maxLines);
    doc.text(lines, x, y);
    return y + lines.length * 11 + 12;
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
    var bandH = 56, bandY = pageH - margin - bandH;
    var maxY = bandY - 14; // tope para que la descripción/amenidades/créditos no se encimen con la franja de contacto

    // --- Mosaico 2x2: medidas primero, para poder recortar cada foto al
    // recuadro exacto antes de dibujarla (si no, jsPDF la estira). ---
    var gridY = margin, gridH = 260, gap = 4;
    var gridW = pageW - margin * 2;
    var quadW = (gridW - gap) / 2, quadH = (gridH - gap) / 2;
    var quadRatio = quadW / quadH;

    var photoUrls = (property.photos || []).slice(0, 4);
    var qrTarget = window.location.origin + "/propiedad/" + property.id;
    var results = await Promise.all([
      loadImageAsDataUrl(photoUrls[0], quadRatio),
      loadImageAsDataUrl(photoUrls[1], quadRatio),
      loadImageAsDataUrl(photoUrls[2], quadRatio),
      loadImageAsDataUrl(photoUrls[3], quadRatio),
      loadLogoDataUrl(),
      window.QRCode.toDataURL(qrTarget, { width: 220, margin: 1 })
    ]);
    var photos = results.slice(0, 4);
    var logoData = results[4];
    var qrDataUrl = results[5];

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

    // --- Tipo + operación, título, ubicación y precio, centrados ---
    var contentW = pageW - margin * 2;
    var y = gridBottom + 34;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor.apply(doc, PRIMARY);
    doc.text((u.propertyTypeLabel(property.type) + " · " + u.operationLabel(property.operation)).toUpperCase(), pageW / 2, y, { align: "center" });
    y += 16;

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
    if (property.halfBathrooms) specs.push(property.halfBathrooms + " medio baño" + (property.halfBathrooms > 1 ? "s" : ""));
    if (property.builtArea) specs.push(property.builtArea + " m² const.");
    if (property.lotArea) specs.push(property.lotArea + " m² terreno");
    if (property.parking) specs.push(property.parking + " autos");
    if (property.levels) specs.push(property.levels + " niveles");
    if (property.age) specs.push(property.age + " años antigüedad");
    drawDividedRow(doc, specs, y, pageW);
    y += 26;

    // --- Descripción completa, alineada a la izquierda ---
    if (property.description && y < maxY) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, INK_SECONDARY);
      var descLines = doc.splitTextToSize(property.description, contentW);
      var maxDescLines = Math.max(1, Math.floor((maxY - y) / 12));
      if (descLines.length > maxDescLines) descLines = descLines.slice(0, maxDescLines);
      doc.text(descLines, margin, y);
      y += descLines.length * 12 + 12;
    }

    // --- Amenidades ---
    if (property.features && property.features.length && y < maxY) {
      y = drawLabeledParagraph(doc, "AMENIDADES", property.features.join(" · "), margin, y, contentW, maxY);
    }

    // --- Créditos aceptados ---
    if (property.creditsAccepted && property.creditsAccepted.length && y < maxY) {
      var creditLabels = property.creditsAccepted.map(function (v) {
        var cr = u.CREDIT_TYPES.filter(function (x) { return x.value === v; })[0];
        return cr ? cr.label : v;
      });
      y = drawLabeledParagraph(doc, "CRÉDITOS ACEPTADOS", creditLabels.join(" · "), margin, y, contentW, maxY);
    }

    // --- Franja de contacto, fija al fondo de la página ---
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
