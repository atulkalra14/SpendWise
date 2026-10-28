sap.ui.define(
  [
    "spendwise/controller/BaseController",
    "spendwise/model/mockData",
    "sap/ui/core/Element",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
  ],
  (BaseController, mockData, Element, Fragment, JSONModel, Device) => {
    "use strict";

    return BaseController.extend("spendwise.controller.templates.Landing", {
      onInit() {
        this.getView().setModel(mockData.createLandingModel(), "landing");
        this.getView().setModel(new JSONModel(Device), "device");
        this.getView().setModel(new JSONModel({}), "feature");
      },

      // The cards are plain layout controls, so clicks and Enter/Space are handled on the grid
      // and mapped back to the card's binding context.
      onAfterRendering() {
        const oGrid = this.byId("featureGrid");
        const oDom = oGrid && oGrid.getDomRef();
        if (!oDom || oDom.dataset.swBound) {
          return;
        }
        oDom.dataset.swBound = "true";
        oDom.querySelectorAll(".sw-feature").forEach((oCard) => {
          oCard.setAttribute("tabindex", "0");
          oCard.setAttribute("role", "button");
        });
        oDom.addEventListener("click", (oEvent) => this._onFeatureActivate(oEvent));
        oDom.addEventListener("keydown", (oEvent) => {
          if (oEvent.key === "Enter" || oEvent.key === " ") {
            oEvent.preventDefault();
            this._onFeatureActivate(oEvent);
          }
        });
      },

      async _onFeatureActivate(oEvent) {
        const oCardDom = oEvent.target.closest(".sw-feature");
        const oCard = oCardDom && Element.closestTo(oCardDom);
        const oContext = oCard && oCard.getBindingContext("landing");
        if (!oContext) {
          return;
        }
        this.getView().getModel("feature").setData(oContext.getObject());
        if (!this._pFeatureDialog) {
          this._pFeatureDialog = Fragment.load({
            id: this.getView().getId(),
            name: "spendwise.view.fragments.ui.FeatureDetail",
            controller: this
          }).then((oDialog) => {
            this.getView().addDependent(oDialog);
            return oDialog;
          });
        }
        (await this._pFeatureDialog).open();
      },

      async onFeatureDialogClose() {
        (await this._pFeatureDialog).close();
      },

      // Placeholder until login exists: sign in still opens the app's home page.
      onSignIn() {
        this.navTo("overview");
      },

      onGetStarted() {
        this.navTo("register");
      }
    });
  }
);
