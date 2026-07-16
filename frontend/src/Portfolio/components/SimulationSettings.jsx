import "./SimulationSettings.css";

function SimulationSettings({ onResetClick }) {
  return (
    <section className="simulation-settings" aria-label="Simulation settings">
      <div>
        <h2>Simulation Settings</h2>
        <p>Restart your virtual portfolio and practice from the beginning.</p>
      </div>
      <button
        className="simulation-settings__reset"
        type="button"
        onClick={onResetClick}
      >
        Reset Simulation
      </button>
    </section>
  );
}

export default SimulationSettings;
