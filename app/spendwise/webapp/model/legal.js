sap.ui.define(["sap/ui/model/json/JSONModel"], (JSONModel) => {
  "use strict";

  // Placeholders in [square brackets] must be replaced before a public launch, and
  // the final text should be reviewed by a qualified legal professional.
  const COMPANY = "[Company Legal Name]";
  const EMAIL = "[legal@your-domain.example]";
  const LAW = "[Governing country or state]";
  const EFFECTIVE = "[Effective date]";

  /** Numbers the sections so the views stay free of numbering logic. */
  function build(sTitle, sIntro, aSections) {
    return new JSONModel({
      title: sTitle,
      effective: `Effective date: ${EFFECTIVE}`,
      intro: sIntro,
      sections: aSections.map(([sHeading, aParagraphs], i) => ({
        number: i + 1,
        heading: sHeading,
        paragraphs: aParagraphs
      }))
    });
  }

  return {
    createTermsModel() {
      return build(
        "Terms of Service",
        `These Terms of Service ("Terms") govern your use of SpendWise, a personal finance application operated by ${COMPANY} ("we", "us"). By creating an account ` +
          "or using SpendWise you agree to these Terms. If you do not agree, please do not use the service.",
        [
          [
            "About SpendWise",
            [
              "SpendWise helps you record income and expenses, plan budgets, track recurring payments and follow product prices. It is a personal record-keeping and planning tool.",
              "SpendWise does not hold, move or invest your money, and it is not a bank, broker, lender or payment institution."
            ]
          ],
          [
            "Eligibility and your account",
            [
              "You must be at least 18 years old, or the age of majority where you live, to use SpendWise.",
              "You are responsible for keeping your sign-in credentials confidential and for all activity under your account. Tell us promptly if you suspect unauthorised access."
            ]
          ],
          [
            "No financial advice",
            [
              "Summaries, totals, charts and insights in SpendWise are for information only. They are not financial, investment, tax, legal or accounting advice.",
              "Please consult a qualified professional before making financial decisions."
            ]
          ],
          [
            "Accuracy of your data",
            [
              "Results depend on the data you enter or import. You are responsible for checking that it is complete and correct.",
              "We calculate totals with care and aim for exact results, but we cannot guarantee that the service is free of errors."
            ]
          ],
          [
            "Automated extraction and suggestions",
            [
              "Where SpendWise reads transactions from documents or suggests categories automatically, the results are drafts. Nothing extracted automatically is " +
                "saved to your records until you review and confirm it."
            ]
          ],
          [
            "Acceptable use",
            [
              "You agree not to misuse SpendWise. This includes attempting to access another person's data, probing or disrupting the service, reverse " +
                "engineering it, using it for unlawful activity, or uploading malicious content.",
              "We may suspend accounts that break these rules."
            ]
          ],
          [
            "Your content",
            [
              "You keep ownership of the data you put into SpendWise. You give us a limited licence to store and process it only to provide the service to you, " +
                "as described in our Privacy Policy."
            ]
          ],
          [
            "Availability and changes",
            [
              "We work to keep SpendWise available but do not promise uninterrupted service. We may add, change or remove features, with notice where reasonable."
            ]
          ],
          [
            "Limitation of liability",
            [
              'SpendWise is provided "as is" and "as available". To the extent permitted by law, we are not liable for indirect or consequential losses, lost ' +
                "profits, or financial decisions made using the service.",
              "Nothing in these Terms limits liability that cannot be limited by law."
            ]
          ],
          [
            "Termination",
            [
              "You may stop using SpendWise and delete your account at any time. We may suspend or end access if you breach these Terms or if required by law.",
              "On termination we handle your data as set out in the Privacy Policy."
            ]
          ],
          [
            "Changes to these Terms",
            [
              "We may update these Terms from time to time. We will post the new version here with a new effective date and, for material changes, notify you. " +
                "Continued use after a change means you accept it."
            ]
          ],
          [
            "Governing law",
            [
              `These Terms are governed by the laws of ${LAW}, without regard to conflict-of-law rules. Mandatory consumer protection rights in your country of residence are not affected.`
            ]
          ],
          ["Contact", [`Questions about these Terms: ${EMAIL}.`]]
        ]
      );
    },

    createPrivacyModel() {
      return build(
        "Privacy Policy",
        `${COMPANY} ("we", "us") respects your privacy. This policy explains what personal data SpendWise collects, why, how it is protected, and the choices you have.`,
        [
          [
            "Data we collect",
            [
              "Account data: your name, email address and sign-in details.",
              "Financial records you enter: income, expenses, budgets, recurring payments, categories and product price entries.",
              "Technical data: device and browser type, log data and basic usage information needed to run and secure the service.",
              "We do not ask for your bank login credentials and do not collect card numbers."
            ]
          ],
          [
            "How we use your data",
            [
              "To provide the service: store your records and calculate your totals, budgets and trends.",
              "To secure the service, prevent abuse and fix problems.",
              "To contact you about your account and important changes.",
              "We do not sell your personal data and do not use your financial records for advertising."
            ]
          ],
          [
            "Legal bases",
            [
              "Where data protection law such as the GDPR applies, we process data to perform our contract with you, to meet legal obligations, for our " +
                "legitimate interests in running and securing the service, and with your consent where required."
            ]
          ],
          [
            "Data isolation and security",
            [
              "Each user's data is kept strictly separate: you can only access your own records.",
              "Data is encrypted in transit and protected at rest, access is limited to what is necessary, and we review our safeguards regularly. No system is " +
                "perfectly secure, so we cannot guarantee absolute security."
            ]
          ],
          [
            "Automated processing",
            [
              "If you use features that extract transactions from documents or suggest categories, content is processed only to produce that result for you. " +
                "Extracted transactions are saved only after you confirm them."
            ]
          ],
          [
            "Sharing and service providers",
            [
              "We share data only with providers that help us operate SpendWise, such as hosting, identity and database services, under contracts that require " +
                "them to protect it and use it only on our instructions.",
              "We may disclose data if required by law or to protect rights and safety."
            ]
          ],
          [
            "International transfers",
            [
              "Your data may be processed in countries other than your own. Where required, we use safeguards such as standard contractual clauses."
            ]
          ],
          [
            "Retention",
            [
              "We keep your data while your account is active. After you delete your account we remove or anonymise it within a reasonable period, except where we must keep it by law."
            ]
          ],
          [
            "Your rights",
            [
              "Depending on where you live, you may have the right to access, correct, export or delete your data, to object to or restrict certain processing, " +
                "to withdraw consent, and to complain to your data protection authority.",
              `To exercise these rights, contact us at ${EMAIL}.`
            ]
          ],
          [
            "Cookies and local storage",
            [
              "We use only essential cookies and browser storage needed for sign-in and your preferences. We do not use advertising or cross-site tracking cookies."
            ]
          ],
          [
            "Children",
            [
              "SpendWise is not intended for people under 18 and we do not knowingly collect their data."
            ]
          ],
          [
            "Changes to this policy",
            [
              "We may update this policy. We will post the new version here with a new effective date and notify you of material changes."
            ]
          ],
          ["Contact", [`Privacy questions or requests: ${EMAIL}.`]]
        ]
      );
    }
  };
});
