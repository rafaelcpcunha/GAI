import Confetti from "./Confetti";

export default function Home() {
  return (
    <main className="container">
      <Confetti />
      <div className="card">
        <span className="emoji" aria-hidden="true">🚧</span>
        <h1>Site em construção</h1>
        <p>Estamos preparando algo especial. Volte em breve!</p>
      </div>
    </main>
  );
}
