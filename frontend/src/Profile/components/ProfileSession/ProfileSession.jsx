function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function ProfileSession({ user }) {
  return (
    <section className="profile-card profile-card--session">
      <span className="profile-card__label">Session</span>
      <div className="profile-session-list">
        <div>
          <span>Status</span>
          <strong>Active</strong>
        </div>
        <div>
          <span>Logged in</span>
          <strong>{formatDate(user?.loggedInAt)}</strong>
        </div>
        <div>
          <span>Auth mode</span>
          <strong>JWT token</strong>
        </div>
      </div>
    </section>
  );
}

export default ProfileSession;
