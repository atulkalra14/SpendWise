sap.ui.define([], () => {
  "use strict";

  // Display formatting only. Amounts arrive from the service as decimal strings and are
  // never added up or rounded in the browser. Dates use the UI5 OData date type in the views.
  return {
    money(sAmount, sCurrency) {
      if (sAmount === undefined || sAmount === null || sAmount === "") {
        return "";
      }
      return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: sCurrency || "EUR"
      }).format(sAmount);
    }
  };
});
