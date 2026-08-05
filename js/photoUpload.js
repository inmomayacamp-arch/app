// Subida real de fotos de propiedades: redimensiona la imagen en el navegador
// (para que la carga sea rápida) y la sube al bucket "property-photos" de Supabase Storage.
(function () {
  "use strict";

  function resizeImage(file, maxDim, quality) {
    maxDim = maxDim || 1600;
    quality = quality || 0.82;
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w >= h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
          else { w = Math.round(w * (maxDim / h)); h = maxDim; }
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob); else reject(new Error("No se pudo procesar la imagen"));
        }, "image/jpeg", quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")); };
      img.src = url;
    });
  }

  async function uploadImage(file, folder) {
    var supabaseClient = window.App.supabase;
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var blob = await resizeImage(file);
    var path = folder + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
    var uploadResult = await supabaseClient.storage.from("property-photos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (uploadResult.error) throw uploadResult.error;
    var pub = supabaseClient.storage.from("property-photos").getPublicUrl(path);
    return pub.data.publicUrl;
  }

  window.App.photoUpload = { resizeImage: resizeImage, uploadImage: uploadImage };
})();
