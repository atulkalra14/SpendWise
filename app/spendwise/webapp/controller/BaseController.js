sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
  ],
  (Controller, UIComponent, JSONModel, MessageToast) => {
    "use strict";

    /**
     * Shared behaviour for every page template: routing helpers, i18n access and the
     * handlers used by the layout fragments (sidebar, header, bottom navigation).
     */
    return Controller.extend("spendwise.controller.BaseController", {
      getRouter() {
        return UIComponent.getRouterFor(this);
      },

      navTo(sRoute) {
        this.getRouter().navTo(sRoute);
      },

      /**
       * Loads the i18n resource bundle of the app, for code that needs many texts at once.
       * @returns {Promise<module:sap/base/i18n/ResourceBundle>} the bundle in the UI language
       */
      async getBundle() {
        // The model returns the bundle itself once it is loaded; async always hands back a Promise.
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      async getText(sKey, aArgs) {
        return (await this.getBundle()).getText(sKey, aArgs);
      },

      /**
       * Creates the page-level "ui" model read by the layout fragments.
       * @param {object} mProps page state, e.g. { nav: "profile" }
       */
      createUiModel(mProps) {
        const oModel = new JSONModel({
          sidebarCollapsed: false,
          title: "",
          subtitle: "",
          ...mProps
        });
        this.getView().setModel(oModel, "ui");
        return oModel;
      },

      async setHeader(sTitleKey, sSubtitleKey) {
        const oModel = this.getView().getModel("ui");
        oModel.setProperty("/title", await this.getText(sTitleKey));
        oModel.setProperty("/subtitle", await this.getText(sSubtitleKey));
      },

      // Handlers used by the layout fragments

      async onNavPress(oEvent) {
        const sRoute = oEvent.getSource().data("route");
        if (sRoute) {
          this.navTo(sRoute);
        } else {
          MessageToast.show(await this.getText("comingSoon"));
        }
      },

      onToggleSidebar() {
        const oModel = this.getView().getModel("ui");
        oModel.setProperty("/sidebarCollapsed", !oModel.getProperty("/sidebarCollapsed"));
      },

      onOpenProfile() {
        this.navTo("profile");
      },

      // Footer links (see fragments/layout/Footer.fragment.xml)

      onOpenTerms() {
        this.navTo("terms");
      },

      onOpenPrivacy() {
        this.navTo("privacy");
      },

      onBackToHome() {
        this.navTo("landing");
      },

      onSignOut() {
        this.navTo("landing");
      }
    });
  }
);
