sap.ui.define([
    "sap/ui/core/UIComponent",
    "spendwise/model/models",
    "spendwise/model/mockData"
], (UIComponent, models, mockData) => {
    "use strict";

    return UIComponent.extend("spendwise.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // the signed-in user, shared by every page (sidebar user area, profile page).
            // Sample data until the identity provider supplies it.
            this.setModel(mockData.createProfileModel(), "profile");

            // enable routing
            this.getRouter().initialize();
        }
    });
});