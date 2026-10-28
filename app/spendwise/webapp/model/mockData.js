sap.ui.define(["sap/ui/model/json/JSONModel"], (JSONModel) => {
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
          {
            icon: "sap-icon://money-bills",
            tone: "emerald",
            title: "Income and expenses",
            text: "Log every transaction in seconds and see exactly where your money goes.",
            status: "Available",
            statusState: "success",
            intro:
              "Record what comes in and what goes out, so you always know where your money went.",
            points: [
              "Add each transaction with an amount, date, category and an optional note.",
              "Amounts are stored and calculated as exact decimal values in euros, so totals always add up to the cent.",
              "Review your transactions by month and see a summary of income, expenses and what is left.",
              "Edit or delete an entry at any time. Your history stays under your control."
            ],
            note: "Amounts are entered by you. SpendWise does not connect to your bank and never moves money."
          },
          {
            icon: "sap-icon://target-group",
            tone: "blue",
            title: "Budgets that nudge",
            text: "Set limits per category and get a warning before you overspend.",
            status: "Coming soon",
            statusState: "warning",
            intro:
              "Set a monthly limit for the categories that matter to you and keep spending on track.",
            points: [
              "Choose a monthly limit for each category, such as groceries, dining or transport.",
              "A progress bar shows how much of each limit you have used so far this month.",
              "You get a warning when a category reaches 90% of its limit, before you go over it.",
              "Budgets are planning tools. They never block a transaction."
            ],
            note: "Budgets are not available yet. This describes how the feature is planned to work."
          },
          {
            icon: "sap-icon://trend-up",
            tone: "amber",
            title: "Savings you can see",
            text: "Income minus expenses, calculated for you, plus a way to set money aside on purpose.",
            status: "Coming soon",
            statusState: "warning",
            intro: "See how much you keep each month, and set money aside deliberately.",
            points: [
              "Savings are calculated for you as income minus expenses. You never enter them by hand.",
              "Your savings rate shows what share of your income you kept.",
              'A separate "transfer to savings" entry lets you record money you set aside on purpose.',
              "Everything is calculated in your account currency, using exact decimal math."
            ],
            note: "SpendWise shows your own numbers. It does not give financial, investment or tax advice."
          },
          {
            icon: "sap-icon://tag",
            tone: "purple",
            title: "Product price history",
            text: "Follow what the things you buy regularly cost over time.",
            status: "Coming soon",
            statusState: "warning",
            intro: "Track the prices of products you buy often and notice when they change.",
            points: [
              "Link a purchase to a product, such as a brand of coffee or a monthly transport pass.",
              "See a price history over time, with the lowest and highest price you paid.",
              "Spot price increases early and compare what you paid at different stores.",
              "Price drop alerts are optional and can be switched off in your profile."
            ],
            note: "Prices come from the purchases you log yourself. SpendWise does not collect prices from other websites."
          },
          {
            icon: "sap-icon://synchronize",
            tone: "navy",
            title: "Recurring payments",
            text: "Keep subscriptions and bills in one place so nothing surprises you.",
            status: "Coming soon",
            statusState: "warning",
            intro:
              "Keep your subscriptions, rent and bills in one list so nothing catches you off guard.",
            points: [
              "Add a payment once and set how often it repeats: weekly, monthly or yearly.",
              "See your total fixed costs per month and the next due date for each payment.",
              "Optional reminders arrive two days before a payment is due.",
              "Pause or end a recurring payment whenever you cancel it."
            ],
            note: "SpendWise only records and reminds. It never pays a bill or cancels a subscription for you."
          },
          {
            icon: "sap-icon://locked",
            tone: "red",
            title: "Private by design",
            text: "Your data is isolated to your account. Only you can see it.",
            status: "Available",
            statusState: "success",
            intro:
              "Your financial data belongs to you. SpendWise is built so that only you can see it.",
            points: [
              "Every record is tied to your account, and the server only returns your own data.",
              "Passwords are never stored as plain text. Only a salted hash is kept, and it is never sent to the app.",
              "We do not sell your data or use it for advertising.",
              "Our Privacy Policy explains what we collect and the rights you have over it."
            ],
            note: "Read the Terms of Service and Privacy Policy linked in the footer for the full details."
          }
        ]
      });
    },

    // Stat cards read from a "kpi" model with { items: [...] }, shared by Profile and Overview.
    createProfileStatsModel() {
      return new JSONModel({
        items: [
          {
            label: "Member since",
            value: "Mar 2026",
            hint: "7 months with SpendWise",
            icon: "sap-icon://calendar",
            tone: "blue"
          },
          {
            label: "Transactions",
            value: "412",
            hint: "Logged so far",
            icon: "sap-icon://receipt",
            tone: "navy"
          },
          {
            label: "Savings rate",
            value: "40.6%",
            hint: "This month",
            icon: "sap-icon://trend-up",
            tone: "emerald"
          },
          {
            label: "Active budgets",
            value: "4",
            hint: "1 near its limit",
            icon: "sap-icon://target-group",
            tone: "amber"
          }
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
          {
            title: "Two-factor authentication",
            description: "Ask for a verification code when you sign in on a new device.",
            enabled: true
          },
          {
            title: "Sign-in alerts",
            description: "Email me when a new device signs in to my account.",
            enabled: true
          }
        ],
        notifications: [
          {
            title: "Budget alerts",
            description: "Tell me when a category reaches 90% of its limit.",
            enabled: true
          },
          {
            title: "Weekly summary",
            description:
              "A short email every Monday with last week's income, expenses and savings.",
            enabled: true
          },
          {
            title: "Price drop alerts",
            description: "Notify me when a tracked product gets cheaper.",
            enabled: false
          },
          {
            title: "Recurring payment reminders",
            description: "Remind me two days before a recurring payment is due.",
            enabled: true
          }
        ],
        sessions: [
          {
            device: "MacBook Pro, Chrome",
            meta: "Berlin, Germany · Active now",
            icon: "sap-icon://laptop",
            current: true
          },
          {
            device: "iPhone 15, Safari",
            meta: "Berlin, Germany · 2 hours ago",
            icon: "sap-icon://iphone",
            current: false
          }
        ]
      });
    }
  };
});
