"use client";

import { useEffect, useRef, useState } from "react";
import { createGame } from "./engine";
import { pixelFont } from "../fonts";

export default function Game() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [ui, setUi] = useState({ state: "menu", score: 0, best: 0, newBest: false, muted: false, lap: 1 });

  useEffect(() => {
    const game = createGame(canvasRef.current, {
      onChange: setUi,
      fontFamily: pixelFont.style.fontFamily,
    });
    gameRef.current = game;
    return () => game.destroy();
  }, []);

  const hold = (key) => {
    const set = (down) => (e) => {
      e.preventDefault();
      gameRef.current?.setKey(key, down);
    };
    return {
      onPointerDown: set(true),
      onPointerUp: set(false),
      onPointerLeave: set(false),
      onPointerCancel: set(false),
      onContextMenu: (e) => e.preventDefault(),
    };
  };

  const racing = ui.state === "playing" || ui.state === "countdown";

  return (
    <div className="game">
      <canvas ref={canvasRef} className="screen" aria-label="Estrada Neon — tela do jogo" />

      {ui.state === "menu" && (
        <div className="overlay">
          <h1 className="title">
            ESTRADA
            <br />
            NEON
          </h1>
          <p className="tagline">Corra contra o relógio rumo ao pôr do sol</p>
          <button className="btn" onClick={() => gameRef.current?.start()} autoFocus>
            JOGAR
          </button>
          <ul className="help">
            <li>SETAS ou WASD para dirigir</li>
            <li>CIMA/W acelera · BAIXO/S freia</li>
            <li>P: pausar · M: som</li>
          </ul>
          {ui.best > 0 && <p className="best">RECORDE: {ui.best}</p>}
        </div>
      )}

      {ui.state === "paused" && (
        <div className="overlay">
          <h2 className="subtitle">PAUSADO</h2>
          <button className="btn" onClick={() => gameRef.current?.resume()} autoFocus>
            CONTINUAR
          </button>
        </div>
      )}

      {ui.state === "gameover" && (
        <div className="overlay">
          <h2 className="subtitle">TEMPO ESGOTADO</h2>
          <p className="score">PONTOS: {ui.score}</p>
          <p className="best">{ui.newBest ? "NOVO RECORDE!" : `RECORDE: ${ui.best}`}</p>
          <button className="btn" onClick={() => gameRef.current?.start()} autoFocus>
            JOGAR DE NOVO
          </button>
        </div>
      )}

      <div className="topbar">
        {racing && (
          <button className="icon" onClick={() => gameRef.current?.pause()} aria-label="Pausar">
            II
          </button>
        )}
        <button
          className="icon wide"
          onClick={() => gameRef.current?.toggleMute()}
          aria-label={ui.muted ? "Ativar som" : "Desativar som"}
        >
          {ui.muted ? "SOM: NÃO" : "SOM: SIM"}
        </button>
      </div>

      {racing && (
        <div className="touch" aria-hidden="true">
          <div className="pad">
            <button {...hold("left")}>ESQ</button>
            <button {...hold("right")}>DIR</button>
          </div>
          <div className="pad">
            <button {...hold("down")}>FREIO</button>
            <button className="gas" {...hold("up")}>
              GÁS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
