sap.ui.define(
  ["spendwise/controller/BaseController", "spendwise/model/mockData", "sap/m/MessageToast"],
  (BaseController, mockData, MessageToast) => {
    "use strict";

    return BaseController.extend("spendwise.controller.templates.Profile", {
      onInit() {
        this.createUiModel({ nav: "profile", tab: "personal" });
        this.setHeader("profileTitle", "profileSubtitle");
        this.getView().setModel(mockData.createProfileStatsModel(), "kpi");
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
