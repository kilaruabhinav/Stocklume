const steps = [
  "Is price near the top or bottom of its range?",
  "Are higher closes becoming consistent?",
  "Does valuation support the move?",
  "Did news explain the change?"
];

function HomeWorkflow() {
  return (
    <section className="home-workflow">
      <div className="home-section__header">
        <span className="home-section__eyebrow">Analyst Checklist</span>
        <h2>Ask better questions before adding a ticker to your shortlist.</h2>
      </div>

      <div className="home-workflow__steps">
        {steps.map((step, index) => (
          <div className="home-workflow__step" key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeWorkflow;
