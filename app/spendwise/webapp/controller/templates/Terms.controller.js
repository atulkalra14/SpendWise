sap.ui.define([
    "spendwise/controller/BaseController",
    "spendwise/model/legal"
], (BaseController, legal) => {
    "use strict";

    return BaseController.extend("spendwise.controller.templates.Terms", {
        onInit() {
            this.getView().setModel(legal.createTermsModel(), "legal");
        }
    });
});
