sap.ui.define(
  [
    "spendwise/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/library",
    "sap/base/i18n/Localization",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
  ],
  (BaseController, JSONModel, coreLibrary, Localization, MessageBox, MessageToast) => {
    "use strict";

    const { ValueState } = coreLibrary;
    const FIELDS = ["displayName", "email", "password", "confirmPassword", "acceptTerms"];
    const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const PASSWORD_MIN = 12;
    const PASSWORD_MAX = 128;

    return BaseController.extend("spendwise.controller.templates.Register", {
      onInit() {
        this.getView().setModel(new JSONModel(this._emptyState()), "reg");
        this.getRouter()
          .getRoute("register")
          .attachPatternMatched(() => this._reset());
      },

      _emptyState() {
        return {
          displayName: "",
          email: "",
          password: "",
          confirmPassword: "",
          acceptTerms: false,
          busy: false,
          message: ""
        };
      },

      _reset() {
        this.getView().getModel("reg").setData(this._emptyState());
        this._clearErrors();
      },

      _clearErrors() {
        FIELDS.forEach((sField) => {
          this.byId(sField).setValueState(ValueState.None);
        });
        this.getView().getModel("reg").setProperty("/message", "");
      },

      onFieldChange(oEvent) {
        const oControl = oEvent.getSource();
        if (oControl.setValueState) {
          oControl.setValueState(ValueState.None);
        }
      },

      onPasswordChange(oEvent) {
        this.onFieldChange(oEvent);
        this._checkPasswordMatch(
          oEvent.getParameter("value"),
          this.byId("confirmPassword").getValue()
        );
      },

      onConfirmChange(oEvent) {
        this.onFieldChange(oEvent);
        this._checkPasswordMatch(this.byId("password").getValue(), oEvent.getParameter("value"));
      },

      // Shown as soon as the confirmation differs, not only on submit. An empty confirmation is
      // not an error yet, the user may still be typing the password.
      async _checkPasswordMatch(sPassword, sConfirm) {
        const oConfirm = this.byId("confirmPassword");
        if (sConfirm && sConfirm !== sPassword) {
          oConfirm.setValueState(ValueState.Error);
          oConfirm.setValueStateText(await this.getText("errPasswordMatch"));
        } else {
          oConfirm.setValueState(ValueState.None);
        }
      },

      // Clears the form first, then asks whether to leave the page.
      async onCancel() {
        this._reset();
        MessageBox.confirm(await this.getText("cancelConfirmText"), {
          title: await this.getText("cancelConfirmTitle"),
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          emphasizedAction: MessageBox.Action.NO,
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.YES) {
              this.onBackToHome();
            }
          }
        });
      },

      // The server is the authority; these checks only save a round trip.
      async _validate(oData) {
        const mErrors = {};
        if (!oData.displayName.trim()) {
          mErrors.displayName = await this.getText("errDisplayName");
        }
        if (!EMAIL.test(oData.email.trim())) {
          mErrors.email = await this.getText("errEmail");
        }
        if (oData.password.length < PASSWORD_MIN || oData.password.length > PASSWORD_MAX) {
          mErrors.password = await this.getText("errPasswordLength", [PASSWORD_MIN, PASSWORD_MAX]);
        } else if (oData.password !== oData.confirmPassword) {
          mErrors.confirmPassword = await this.getText("errPasswordMatch");
        }
        if (!oData.acceptTerms) {
          mErrors.acceptTerms = await this.getText("errTerms");
        }
        return mErrors;
      },

      _showFieldErrors(mErrors) {
        let sRest = "";
        Object.keys(mErrors).forEach((sField) => {
          const oControl = this.byId(sField);
          if (oControl) {
            oControl.setValueState(ValueState.Error);
            oControl.setValueStateText(mErrors[sField]);
          } else {
            sRest += `${mErrors[sField]} `;
          }
        });
        return sRest.trim();
      },

      async onSubmit() {
        const oModel = this.getView().getModel("reg");
        const oData = oModel.getData();
        if (oData.busy) {
          return;
        }
        this._clearErrors();

        const mErrors = await this._validate(oData);
        if (Object.keys(mErrors).length) {
          this._showFieldErrors(mErrors);
          oModel.setProperty("/message", await this.getText("errFixFields"));
          return;
        }

        oModel.setProperty("/busy", true);
        try {
          const oAction = this.getOwnerComponent()
            .getModel("registration")
            .bindContext("/register(...)");
          oAction.setParameter("displayName", oData.displayName.trim());
          oAction.setParameter("email", oData.email.trim());
          oAction.setParameter("password", oData.password);
          oAction.setParameter("acceptTerms", true);
          oAction.setParameter("locale", Localization.getLanguage().slice(0, 2));
          await oAction.invoke();

          MessageToast.show(await this.getText("registerSuccess"));
          this._reset();
          this.navTo("landing");
        } catch (oError) {
          await this._showServerError(oError);
        } finally {
          // The password is not kept in the page after a request, whatever the outcome.
          oModel.setProperty("/password", "");
          oModel.setProperty("/confirmPassword", "");
          oModel.setProperty("/busy", false);
        }
      },

      // 400 carries one entry per field (flat for a single error, under details for several);
      // 409 and everything else is shown once in the message strip.
      async _showServerError(oError) {
        const oBody = oError && oError.error;
        let aEntries = oBody ? [oBody] : [];
        if (oBody && oBody.details && oBody.details.length) {
          aEntries = oBody.details;
        }
        const mErrors = {};
        let sGeneral = "";

        aEntries.forEach((oEntry) => {
          const sTarget = (oEntry.target || "").split("/").pop();
          if (FIELDS.includes(sTarget)) {
            mErrors[sTarget] = oEntry.message;
          } else if (oEntry.message) {
            sGeneral = oEntry.message;
          }
        });

        const sRest = this._showFieldErrors(mErrors);
        const bFieldErrors = Object.keys(mErrors).length > 0;
        let sMessage = sGeneral || sRest;
        if (!sMessage) {
          sMessage = await this.getText(bFieldErrors ? "errFixFields" : "errGeneric");
        }
        this.getView().getModel("reg").setProperty("/message", sMessage);
      },

      async onSignIn() {
        MessageToast.show(await this.getText("comingSoon"));
      }
    });
  }
);
