sap.ui.define([
    "spendwise/controller/BaseController",
    "spendwise/model/legal"
], (BaseController, legal) => {
    "use strict";

    return BaseController.extend("spendwise.controller.templates.Privacy", {
        onInit() {
            this.getView().setModel(legal.createPrivacyModel(), "legal");
        }
    });
});
