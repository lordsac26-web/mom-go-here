import SubPageHeader from "../components/SubPageHeader";

export default function PrivacyPolicy() {
  const lastUpdated = "April 29, 2026";

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <SubPageHeader backTo="/settings" title="Privacy Policy" emoji="🔒" />

      <div className="max-w-2xl mx-auto prose prose-invert prose-lg">
        <p className="text-muted-foreground text-sm mb-6">Last updated: {lastUpdated}</p>

        <section className="space-y-4 text-foreground text-base leading-relaxed">
          <h2 className="text-xl font-black text-primary">1. Introduction</h2>
          <p>
            Welcome to <strong>Mom, Go Here</strong> ("the App"). We respect your privacy and are committed
            to protecting your personal data. This Privacy Policy explains what information we collect,
            how we use it, and your rights regarding your data.
          </p>

          <h2 className="text-xl font-black text-primary">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account Information:</strong> Email address and full name (provided during sign-up).</li>
            <li><strong>Profile Information:</strong> Display name, birthday, and religious preference (provided voluntarily during onboarding).</li>
            <li><strong>Location Data:</strong> Approximate city and coordinates (only when you explicitly grant permission, used for weather and local history facts).</li>
            <li><strong>Contacts:</strong> Names, birthdays, anniversaries, and relationship types of people you choose to add (stored only for you).</li>
            <li><strong>Game Data:</strong> Scores, achievements, streaks, saved game states, and play time statistics.</li>
            <li><strong>Journal Entries:</strong> Photos and text you voluntarily add to your memory journal.</li>
            <li><strong>Usage Data:</strong> Pages visited and features used (anonymized analytics).</li>
          </ul>

          <h2 className="text-xl font-black text-primary">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide personalized daily inspiration based on your religious preference.</li>
            <li>To display local weather using your approximate location.</li>
            <li>To track game scores, achievements, and progress.</li>
            <li>To send birthday and event reminders for contacts you've added.</li>
            <li>To improve app performance and fix bugs.</li>
          </ul>
          <p>We do <strong>not</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>

          <h2 className="text-xl font-black text-primary">4. Data Storage & Security</h2>
          <p>
            Your data is stored securely on Base44's cloud infrastructure with encryption at rest and in transit.
            Access to your personal data is restricted to your authenticated account only through row-level security rules.
          </p>

          <h2 className="text-xl font-black text-primary">5. Third-Party Services</h2>
          <p>The App uses the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Base44:</strong> Authentication, data storage, and backend services.</li>
            <li><strong>Open-Meteo:</strong> Weather data (no personal data is shared — only coordinates).</li>
            <li><strong>AI Language Models:</strong> Used to generate daily inspiration, art, and history facts. No personal data is included in prompts beyond your chosen religious preference.</li>
            <li><strong>Bible API, Al Quran Cloud, Sefaria, Vedic Scriptures:</strong> Religious text retrieval (no personal data shared).</li>
          </ul>

          <h2 className="text-xl font-black text-primary">6. Children's Privacy</h2>
          <p>
            The App is not directed at children under 13. We do not knowingly collect personal information from
            children under 13. If you believe we have collected data from a child under 13, please contact us
            so we can delete it.
          </p>

          <h2 className="text-xl font-black text-primary">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access</strong> your personal data at any time through the Settings page.</li>
            <li><strong>Update</strong> your information through the Settings page.</li>
            <li><strong>Delete</strong> your entire account and all associated data through Settings → Delete My Account.</li>
            <li><strong>Withdraw consent</strong> for location services at any time through your device settings.</li>
          </ul>

          <h2 className="text-xl font-black text-primary">8. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. When you delete your account,
            all personal data is permanently removed from our systems.
          </p>

          <h2 className="text-xl font-black text-primary">9. Simulated Gambling Disclosure</h2>
          <p>
            The App contains a "Lucky Slots" game that simulates a slot machine experience. This is for
            <strong> entertainment purposes only</strong>. No real money, real currency, or items of real-world value
            are wagered, won, or lost. There are no in-app purchases. The game uses virtual credits
            that have no monetary value and cannot be exchanged, transferred, or cashed out.
          </p>

          <h2 className="text-xl font-black text-primary">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by updating the "Last updated" date at the top of this page.
          </p>

          <h2 className="text-xl font-black text-primary">11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or your data, please contact us
            through the app's support channels.
          </p>
        </section>
      </div>
    </div>
  );
}