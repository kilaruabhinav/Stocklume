function ProfileOverview({ user }) {
  const displayName = user?.name || user?.email || "Stocklume User";
  const email = user?.email || "Not available";

  return (
    <section className="profile-card">
      <div className="profile-avatar" aria-hidden="true">
        {displayName.charAt(0).toUpperCase()}
      </div>

      <div>
        <span className="profile-card__label">Account</span>
        <h2>{displayName}</h2>
        <p>{email}</p>
      </div>
    </section>
  );
}

export default ProfileOverview;
