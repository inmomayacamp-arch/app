// Ficha técnica en PDF: fotos, características, precio, ubicación, contacto
// y un código QR que abre la propiedad dentro de InmoMap. Usa jsPDF y qrcode
// (cargados por CDN) para generarla completamente en el navegador.
(function () {
  "use strict";

  var u = window.App.utils;

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

  async function generate(property, agent) {
    if (!window.jspdf || !window.QRCode) {
      u.toast("La generación de PDF no está disponible en este momento.");
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" });
    var pageW = doc.internal.pageSize.getWidth();
    var margin = 40;
    var y = margin;

    var photoData = await loadImageAsDataUrl(property.photos && property.photos[0]);
    if (photoData) {
      var imgW = pageW - margin * 2, imgH = imgW * 0.58;
      try { doc.addImage(photoData, "JPEG", margin, y, imgW, imgH); y += imgH + 18; } catch (e) { /* imagen no compatible, se omite */ }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(property.title || "Propiedad", margin, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(220, 38, 38);
    doc.text(window.App.components.propertyPriceLabel(property), margin, y);
    doc.setTextColor(20, 20, 20);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text((property.neighborhood || "") + ", " + (property.city || ""), margin, y);
    y += 20;

    var specs = [];
    if (property.bedrooms) specs.push(property.bedrooms + " recámaras");
    if (property.bathrooms) specs.push(property.bathrooms + " baños");
    if (property.builtArea) specs.push(property.builtArea + " m² construcción");
    if (property.lotArea) specs.push(property.lotArea + " m² terreno");
    if (property.parking) specs.push(property.parking + " estacionamientos");
    if (specs.length) {
      doc.setFont("helvetica", "bold");
      doc.text(specs.join("   ·   "), margin, y);
      y += 22;
    }

    var qrTarget = window.location.origin + window.location.pathname + "#/propiedad/" + property.id;
    var qrDataUrl = await window.QRCode.toDataURL(qrTarget, { width: 220, margin: 1 });
    var qrSize = 96;
    doc.addImage(qrDataUrl, "PNG", pageW - margin - qrSize, y, qrSize, qrSize);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize("Escanea para ver la ficha completa en InmoMap", qrSize), pageW - margin - qrSize, y + qrSize + 12);

    if (property.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      var lines = doc.splitTextToSize(property.description, pageW - margin * 2 - qrSize - 20);
      doc.text(lines, margin, y + 14);
    }
    y += qrSize + 30;

    if (agent) {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(agent.name || "", margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("WhatsApp / Tel: " + (agent.whatsapp || agent.phone || ""), margin, y);
    }

    doc.save((property.title || "propiedad").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".pdf");
  }

  window.App.pdfFicha = { generate: generate };
})();
