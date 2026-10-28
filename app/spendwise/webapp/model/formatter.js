sap.ui.define(["sap/base/i18n/Localization"], (Localization) => {
  "use strict";

  // Display formatting only. Amounts arrive from the service as decimal strings and are
  // never added up or rounded in the browser. The number format follows the UI language
  // (1,234.56 in English, 1.234,56 in German). Dates use the UI5 OData date type in the views.
  return {
    money(sAmount, sCurrency) {
      if (sAmount === undefined || sAmount === null || sAmount === "") {
        return "";
      }
      return new Intl.NumberFormat(Localization.getLanguage(), {
        style: "currency",
        currency: sCurrency || "EUR"
      }).format(sAmount);
    }
  };
});
