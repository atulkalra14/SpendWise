sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "spendwise/model/models",
    "spendwise/model/mockData"
  ],
  (UIComponent, JSONModel, models, mockData) => {
    "use strict";

    return UIComponent.extend("spendwise.Component", {
      metadata: {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"]
      },

      init() {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // set the device model
        this.setModel(models.createDeviceModel(), "device");

        // the signed-in user, shared by every page (sidebar user area, profile page).
        // Sample data until the identity provider supplies it. Its texts come from the i18n
        // bundle, so the model is filled as soon as the bundle has loaded.
        const oProfile = new JSONModel({});
        this.setModel(oProfile, "profile");
        this.getModel("i18n")
          .getResourceBundle()
          .then((oBundle) => oProfile.setData(mockData.profileData(oBundle)));

        // enable routing
        this.getRouter().initialize();
      }
    });
  }
);
