import "./AccountActions.css";

function AccountActions({ onLogout }) {
  return (
    <section className="profile-dashboard-card account-actions">
      <div>
        <h2>Account Actions</h2>
        <p>Sign out of this Stocklume session.</p>
      </div>
      <button className="account-actions__logout" type="button" onClick={onLogout}>
        Logout
      </button>
    </section>
  );
}

export default AccountActions;
