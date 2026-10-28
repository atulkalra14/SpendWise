sap.ui.define(
  [
    "spendwise/controller/BaseController",
    "spendwise/model/mockData",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
  ],
  (BaseController, mockData, JSONModel, MessageToast) => {
    "use strict";

    return BaseController.extend("spendwise.controller.templates.Profile", {
      onInit() {
        this.createUiModel({ nav: "profile", tab: "personal" });
        this.setHeader("profileTitle", "profileSubtitle");
        // The stat card texts come from the i18n bundle, so the model is filled once it has loaded.
        const oKpi = new JSONModel({ items: [] });
        this.getView().setModel(oKpi, "kpi");
        this.getBundle().then((oBundle) => oKpi.setData(mockData.profileStatsData(oBundle)));
      },

      // Design preview only: nothing is persisted yet.
      async onSave() {
        MessageToast.show(await this.getText("previewSaved"));
      },

      async onPreviewAction() {
        MessageToast.show(await this.getText("comingSoon"));
      }
    });
  }
);
