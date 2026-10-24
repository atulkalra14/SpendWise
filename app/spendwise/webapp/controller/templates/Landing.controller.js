sap.ui.define([
    "spendwise/controller/BaseController",
    "spendwise/model/mockData"
], (BaseController, mockData) => {
    "use strict";

    return BaseController.extend("spendwise.controller.templates.Landing", {
        onInit() {
            this.getView().setModel(mockData.createLandingModel(), "landing");
        },

        // Placeholder until authentication exists: both actions open the app's home page.
        onSignIn() {
            this.navTo("overview");
        },

        onGetStarted() {
            this.navTo("overview");
        }
    });
});
