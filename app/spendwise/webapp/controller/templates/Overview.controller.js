sap.ui.define([
    "spendwise/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/m/MessageToast",
    "spendwise/model/formatter"
], (BaseController, JSONModel, Log, MessageToast, formatter) => {
    "use strict";

    return BaseController.extend("spendwise.controller.templates.Overview", {
        formatter,

        onInit() {
            this.createUiModel({ nav: "overview", loading: true, error: "" });
            this.getView().setModel(new JSONModel({ items: [] }), "kpi");
            this.getRouter().getRoute("overview").attachPatternMatched(this._load, this);
        },

        async _load() {
            const oUi = this.getView().getModel("ui");
            const oKpi = this.getView().getModel("kpi");
            const dNow = new Date();
            const sMonth = dNow.toISOString().slice(0, 7);
            const sMonthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(dNow);

            oUi.setProperty("/loading", true);
            oUi.setProperty("/error", "");
            oUi.setProperty("/title", await this.getText("overviewTitle"));
            oUi.setProperty("/subtitle", await this.getText("overviewSubtitle", [sMonthLabel]));

            try {
                // Server-side function: exact totals in integer cents for the signed-in user
                const oSummary = await this.getView().getModel()
                    .bindContext(`/monthlySummary(month='${sMonth}')`)
                    .getBoundContext()
                    .requestObject();
                oKpi.setProperty("/items", await this._buildKpis(oSummary, sMonthLabel));
            } catch (oError) {
                oUi.setProperty("/error", await this.getText("overviewLoadError"));
                Log.error("Loading the monthly summary failed", oError.message);
            } finally {
                oUi.setProperty("/loading", false);
            }
        },

        async _buildKpis(oSummary, sMonthLabel) {
            const bAny = oSummary.count > 0;
            const money = (sAmount) => formatter.money(sAmount, oSummary.currency);

            return [
                {
                    label: await this.getText("kpiSpent"),
                    value: money(oSummary.total),
                    hint: sMonthLabel,
                    icon: "sap-icon://trend-down",
                    tone: "red"
                },
                {
                    label: await this.getText("kpiTransactions"),
                    value: String(oSummary.count),
                    hint: await this.getText("kpiTransactionsHint"),
                    icon: "sap-icon://receipt",
                    tone: "navy"
                },
                {
                    label: await this.getText("kpiLargest"),
                    value: bAny ? money(oSummary.largestAmount) : "–",
                    hint: bAny ? oSummary.largestDescription : await this.getText("kpiLargestEmpty"),
                    icon: "sap-icon://arrow-top",
                    tone: "amber"
                },
                {
                    label: await this.getText("kpiIncome"),
                    value: "–",
                    hint: await this.getText("kpiIncomeHint"),
                    icon: "sap-icon://wallet",
                    tone: "emerald"
                }
            ];
        },

        async onViewAll() {
            MessageToast.show(await this.getText("comingSoon"));
        }
    });
});
