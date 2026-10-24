sap.ui.define([
    "sap/ui/model/json/JSONModel"
], (JSONModel) => {
    "use strict";

    // Sample content for the design pages only. Real data will come from the CAP services,
    // and amounts are pre-formatted strings here so no money math happens in the UI.
    return {
        createLandingModel() {
            return new JSONModel({
                previewBudgets: [
                    { label: "Groceries", amount: "€312 / €400", pct: 78, state: "ok" },
                    { label: "Dining", amount: "€190 / €200", pct: 95, state: "warning" },
                    { label: "Transport", amount: "€85 / €150", pct: 57, state: "ok" }
                ],
                features: [
                    { icon: "sap-icon://money-bills", tone: "emerald", title: "Income and expenses", text: "Log every transaction in seconds and see exactly where your money goes." },
                    { icon: "sap-icon://target-group", tone: "blue", title: "Budgets that nudge", text: "Set limits per category and get a warning before you overspend." },
                    { icon: "sap-icon://trend-up", tone: "amber", title: "Savings you can see", text: "Income minus expenses, calculated for you, plus a way to set money aside on purpose." },
                    { icon: "sap-icon://tag", tone: "purple", title: "Product price history", text: "Follow what the things you buy regularly cost over time." },
                    { icon: "sap-icon://synchronize", tone: "navy", title: "Recurring payments", text: "Keep subscriptions and bills in one place so nothing surprises you." },
                    { icon: "sap-icon://locked", tone: "red", title: "Private by design", text: "Your data is isolated to your account. Only you can see it." }
                ]
            });
        },

        // Stat cards read from a "kpi" model with { items: [...] }, shared by Profile and Overview.
        createProfileStatsModel() {
            return new JSONModel({
                items: [
                    { label: "Member since", value: "Mar 2026", hint: "7 months with SpendWise", icon: "sap-icon://calendar", tone: "blue" },
                    { label: "Transactions", value: "412", hint: "Logged so far", icon: "sap-icon://receipt", tone: "navy" },
                    { label: "Savings rate", value: "40.6%", hint: "This month", icon: "sap-icon://trend-up", tone: "emerald" },
                    { label: "Active budgets", value: "4", hint: "1 near its limit", icon: "sap-icon://target-group", tone: "amber" }
                ]
            });
        },

        createProfileModel() {
            return new JSONModel({
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
                    { title: "Two-factor authentication", description: "Ask for a verification code when you sign in on a new device.", enabled: true },
                    { title: "Sign-in alerts", description: "Email me when a new device signs in to my account.", enabled: true }
                ],
                notifications: [
                    { title: "Budget alerts", description: "Tell me when a category reaches 90% of its limit.", enabled: true },
                    { title: "Weekly summary", description: "A short email every Monday with last week's income, expenses and savings.", enabled: true },
                    { title: "Price drop alerts", description: "Notify me when a tracked product gets cheaper.", enabled: false },
                    { title: "Recurring payment reminders", description: "Remind me two days before a recurring payment is due.", enabled: true }
                ],
                sessions: [
                    { device: "MacBook Pro, Chrome", meta: "Berlin, Germany · Active now", icon: "sap-icon://laptop", current: true },
                    { device: "iPhone 15, Safari", meta: "Berlin, Germany · 2 hours ago", icon: "sap-icon://iphone", current: false }
                ]
            });
        }
    };
});
