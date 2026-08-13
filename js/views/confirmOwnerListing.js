// Vista "Confirmar publicación": a donde regresa el enlace del correo que
// manda requestOwnerEmailVerification. Para cuando esta vista se monta, la
// sesión temporal ya quedó resuelta en js/app.js (por eso solo se llama
// getSession, sin esperar el evento). Busca la propiedad "pendiente_verificacion"
// de ese correo y la activa con la función confirm_owner_listing de Supabase
// (ahí vive el candado real de una publicación gratuita por correo/teléfono).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var supabase = window.App.supabase;

  function shell(bodyHtml) {
    return '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Confirmar publicación</h1>' +
      '</div>' +
      '<div class="page-wrap" style="max-width:560px">' +
      '  <div class="empty-state" style="padding-top:24px">' + bodyHtml + '</div>' +
      '</div>';
  }

  function renderState(root, icon, color, title, message, cta) {
    root.innerHTML = shell(
      '<span class="empty-state__icon" style="color:' + color + '">' + u.icon(icon, { size: 40 }) + '</span>' +
      '<h3>' + u.escapeHtml(title) + '</h3>' +
      '<p>' + message + '</p>' +
      (cta || '<a class="btn btn--primary" href="#/">Volver al mapa</a>')
    );
  }

  async function render(params, root) {
    document.title = 'Confirmar publicación — InmoMaps';
    c.mountChrome('explore');
    root.innerHTML = shell('<span class="spinner"></span><p>Confirmando tu publicación…</p>');

    if (!supabase) {
      renderState(root, 'alert', 'var(--color-renta)', 'No se pudo confirmar', 'Ocurrió un problema técnico. Intenta abrir el enlace de tu correo de nuevo.');
      return;
    }

    var sessionResult = await supabase.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    var email = session && session.user && session.user.email;

    if (!email) {
      renderState(root, 'alert', 'var(--color-renta)', 'Este enlace ya no es válido', 'Puede que ya lo hayas usado o que haya caducado. Vuelve a publicar tu propiedad para recibir uno nuevo.',
        '<a class="btn btn--primary" href="#/registro-propietario">Publicar de nuevo</a>');
      return;
    }

    try {
      var pending = await state.ownerVerification.findPending(email);
      if (!pending) {
        renderState(root, 'check', 'var(--color-venta)', 'No encontramos nada pendiente', 'Puede que esta publicación ya haya sido confirmada antes, o que no exista ninguna a nombre de ' + u.escapeHtml(email) + '.',
          '<a class="btn btn--primary" href="#/registro-propietario">Publicar una propiedad</a>');
        return;
      }
      var confirmed = await state.ownerVerification.confirm(pending.id);
      renderState(root, 'check', 'var(--color-venta)', '¡Tu propiedad ya está publicada!', 'Ya es visible en el mapa y en las búsquedas de InmoMaps.',
        '<a class="btn btn--primary" href="#/propiedad/' + confirmed.id + '">Ver mi propiedad</a>');
    } catch (err) {
      renderState(root, 'alert', 'var(--color-renta)', 'No se pudo confirmar', u.escapeHtml(err.message || 'Ocurrió un problema al activar tu publicación.'));
    } finally {
      try { await supabase.auth.signOut(); } catch (e) { /* no-op */ }
    }
  }

  window.App.views = window.App.views || {};
  window.App.views.confirmOwnerListing = { render: render };
})();
