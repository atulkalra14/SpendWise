sap.ui.define(["sap/base/i18n/Localization"], (Localization) => {
  "use strict";

  // Sample content for the design pages only. Real data will come from the CAP services.
  // Every text comes from the i18n bundle, so the pages read correctly in each language; names,
  // numbers and device names below are sample data, not translatable text. The functions return
  // plain objects, and the controllers put them into JSON models once the bundle is loaded.

  const fmtMoney = (nAmount) =>
    new Intl.NumberFormat(Localization.getLanguage(), {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(nAmount);

  // A sample budget row: "€312 / €400" in English, "312 € / 400 €" in German.
  const fmtBudget = (nUsed, nLimit) => `${fmtMoney(nUsed)} / ${fmtMoney(nLimit)}`;

  // The landing cards share one shape; only the key prefix differs.
  const feature = (oBundle, sPrefix, mFixed) => ({
    ...mFixed,
    title: oBundle.getText(`${sPrefix}Title`),
    text: oBundle.getText(`${sPrefix}Text`),
    intro: oBundle.getText(`${sPrefix}Intro`),
    points: [1, 2, 3, 4].map((n) => oBundle.getText(`${sPrefix}Point${n}`)),
    note: oBundle.getText(`${sPrefix}Note`)
  });

  return {
    /**
     * Data of the landing page: the preview budgets and the feature cards.
     * @param {module:sap/base/i18n/ResourceBundle} oBundle the loaded i18n bundle
     * @returns {object} data for the "landing" model
     */
    landingData(oBundle) {
      const sAvailable = oBundle.getText("featureStatusAvailable");
      const sSoon = oBundle.getText("featureStatusSoon");
      return {
        previewBudgets: [
          {
            label: oBundle.getText("previewBudgetGroceries"),
            amount: fmtBudget(312, 400),
            pct: 78,
            state: "ok"
          },
          {
            label: oBundle.getText("previewBudgetDining"),
            amount: fmtBudget(190, 200),
            pct: 95,
            state: "warning"
          },
          {
            label: oBundle.getText("previewBudgetTransport"),
            amount: fmtBudget(85, 150),
            pct: 57,
            state: "ok"
          }
        ],
        features: [
          feature(oBundle, "featureIncome", {
            icon: "sap-icon://money-bills",
            tone: "emerald",
            status: sAvailable,
            statusState: "success"
          }),
          feature(oBundle, "featureBudgets", {
            icon: "sap-icon://target-group",
            tone: "blue",
            status: sSoon,
            statusState: "warning"
          }),
          feature(oBundle, "featureSavings", {
            icon: "sap-icon://trend-up",
            tone: "amber",
            status: sSoon,
            statusState: "warning"
          }),
          feature(oBundle, "featurePrices", {
            icon: "sap-icon://tag",
            tone: "purple",
            status: sSoon,
            statusState: "warning"
          }),
          feature(oBundle, "featureRecurring", {
            icon: "sap-icon://synchronize",
            tone: "navy",
            status: sSoon,
            statusState: "warning"
          }),
          feature(oBundle, "featurePrivacy", {
            icon: "sap-icon://locked",
            tone: "red",
            status: sAvailable,
            statusState: "success"
          })
        ]
      };
    },

    /**
     * Stat cards of the profile page, read from a "kpi" model with { items: [...] }.
     * @param {module:sap/base/i18n/ResourceBundle} oBundle the loaded i18n bundle
     * @returns {object} data for the "kpi" model
     */
    profileStatsData(oBundle) {
      const sLocale = Localization.getLanguage();
      return {
        items: [
          {
            label: oBundle.getText("statMemberSince"),
            value: new Intl.DateTimeFormat(sLocale, {
              month: "short",
              year: "numeric",
              timeZone: "UTC"
            }).format(new Date(Date.UTC(2026, 2, 1))),
            hint: oBundle.getText("statMemberSinceHint", [7]),
            icon: "sap-icon://calendar",
            tone: "blue"
          },
          {
            label: oBundle.getText("statTransactions"),
            value: new Intl.NumberFormat(sLocale).format(412),
            hint: oBundle.getText("statTransactionsHint"),
            icon: "sap-icon://receipt",
            tone: "navy"
          },
          {
            label: oBundle.getText("statSavingsRate"),
            value: new Intl.NumberFormat(sLocale, {
              style: "percent",
              maximumFractionDigits: 1
            }).format(0.406),
            hint: oBundle.getText("statSavingsRateHint"),
            icon: "sap-icon://trend-up",
            tone: "emerald"
          },
          {
            label: oBundle.getText("statActiveBudgets"),
            value: "4",
            hint: oBundle.getText("statActiveBudgetsHint", [1]),
            icon: "sap-icon://target-group",
            tone: "amber"
          }
        ]
      };
    },

    /**
     * The sample profile: personal details, preferences, toggles and sessions.
     * @param {module:sap/base/i18n/ResourceBundle} oBundle the loaded i18n bundle
     * @returns {object} data for the "profile" model
     */
    profileData(oBundle) {
      const sPlace = oBundle.getText("sessionLocationBerlin");
      return {
        initials: "SJ",
        firstName: "Sarah",
        lastName: "Johnson",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+49 170 1234567",
        country: "DE",
        timezone: "Europe/Berlin",
        currency: "EUR",
        language: "en",
        dateFormat: "dd.MM.yyyy",
        weekStart: "monday",
        securityToggles: [
          {
            title: oBundle.getText("securityTwoFactorTitle"),
            description: oBundle.getText("securityTwoFactorDescription"),
            enabled: true
          },
          {
            title: oBundle.getText("securitySignInAlertsTitle"),
            description: oBundle.getText("securitySignInAlertsDescription"),
            enabled: true
          }
        ],
        notifications: [
          {
            title: oBundle.getText("notifyBudgetsTitle"),
            description: oBundle.getText("notifyBudgetsDescription"),
            enabled: true
          },
          {
            title: oBundle.getText("notifyWeeklyTitle"),
            description: oBundle.getText("notifyWeeklyDescription"),
            enabled: true
          },
          {
            title: oBundle.getText("notifyPricesTitle"),
            description: oBundle.getText("notifyPricesDescription"),
            enabled: false
          },
          {
            title: oBundle.getText("notifyRecurringTitle"),
            description: oBundle.getText("notifyRecurringDescription"),
            enabled: true
          }
        ],
        sessions: [
          {
            device: "MacBook Pro, Chrome",
            meta: `${sPlace} · ${oBundle.getText("sessionActiveNow")}`,
            icon: "sap-icon://laptop",
            current: true
          },
          {
            device: "iPhone 15, Safari",
            meta: `${sPlace} · ${oBundle.getText("sessionHoursAgo", [2])}`,
            icon: "sap-icon://iphone",
            current: false
          }
        ]
      };
    }
  };
});
