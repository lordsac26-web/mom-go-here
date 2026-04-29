import SubPageHeader from "../components/SubPageHeader";

export default function TermsOfService() {
  const lastUpdated = "April 29, 2026";

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <SubPageHeader backTo="/settings" title="Terms of Service" emoji="📜" />

      <div className="max-w-2xl mx-auto prose prose-invert prose-lg">
        <p className="text-muted-foreground text-sm mb-6">Last updated: {lastUpdated}</p>

        <section className="space-y-4 text-foreground text-base leading-relaxed">
          <h2 className="text-xl font-black text-primary">1. Acceptance of Terms</h2>
          <p>
            By accessing or using <strong>Mom, Go Here</strong> ("the App"), you agree to be bound by these
            Terms of Service. If you do not agree, please do not use the App.
          </p>

          <h2 className="text-xl font-black text-primary">2. Description of Service</h2>
          <p>
            Mom, Go Here is a personal wellness and entertainment app designed for seniors. It provides
            daily spiritual inspiration, brain games, a memory journal, contact management, and personalized
            content. The App is free to use with no in-app purchases.
          </p>

          <h2 className="text-xl font-black text-primary">3. User Accounts</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must create an account to use the App.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must provide accurate information during registration.</li>
            <li>You may delete your account and all associated data at any time through Settings.</li>
          </ul>

          <h2 className="text-xl font-black text-primary">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the App for any unlawful purpose.</li>
            <li>Attempt to gain unauthorized access to other users' data.</li>
            <li>Upload harmful, offensive, or inappropriate content to the journal feature.</li>
            <li>Interfere with the App's operation or security.</li>
            <li>Use automated tools to access the App.</li>
          </ul>

          <h2 className="text-xl font-black text-primary">5. Intellectual Property</h2>
          <p>
            All content, design, and code within the App is owned by or licensed to the App developers.
            Religious texts are sourced from publicly available APIs and translations.
            You retain ownership of any personal content you create (journal entries, photos).
          </p>

          <h2 className="text-xl font-black text-primary">6. AI-Generated Content</h2>
          <p>
            The App uses artificial intelligence to generate daily inspiration, art, history facts,
            and chatbot responses. AI-generated content is provided "as is" and may not always be
            perfectly accurate. It should not be relied upon as professional, medical, legal, or
            theological advice.
          </p>

          <h2 className="text-xl font-black text-primary">7. Simulated Gambling</h2>
          <p>
            The "Lucky Slots" game is a simulated slot machine for <strong>entertainment purposes only</strong>.
            No real money is involved. Virtual credits have no real-world value and cannot be
            exchanged for money, goods, or services. By using this feature, you acknowledge
            that it is a game of chance simulation with no monetary stakes.
          </p>

          <h2 className="text-xl font-black text-primary">8. Disclaimer of Warranties</h2>
          <p>
            The App is provided "as is" and "as available" without warranties of any kind, either
            express or implied. We do not guarantee that the App will be uninterrupted, error-free,
            or completely secure.
          </p>

          <h2 className="text-xl font-black text-primary">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, the App developers shall not be liable for any
            indirect, incidental, special, or consequential damages arising from your use of the App.
          </p>

          <h2 className="text-xl font-black text-primary">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the App after
            changes constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-xl font-black text-primary">11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable law.
            Any disputes shall be resolved through good-faith negotiation.
          </p>

          <h2 className="text-xl font-black text-primary">12. Contact</h2>
          <p>
            For questions about these Terms, please contact us through the app's support channels.
          </p>
        </section>
      </div>
    </div>
  );
}