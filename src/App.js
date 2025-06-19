import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BIRD_SIZE = 60;
const GRAVITY = 2;
const JUMP_HEIGHT = 60;
const PIPE_WIDTH = 60;
const PIPE_GAP = 200;
const PIPE_SPEED = 3;

function getRandomPipeHeight() {
  const min = 50;
  const max = GAME_HEIGHT - PIPE_GAP - 50;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function App() {
  const [birdPosition, setBirdPosition] = useState(GAME_HEIGHT / 2 - BIRD_SIZE / 2);
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const [pipes, setPipes] = useState([
    { left: GAME_WIDTH, height: getRandomPipeHeight(), scored: false },
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const gameRef = useRef();

  // Generate static stars for dark mode (background)
  const STATIC_STAR_COUNT = 20;
  const staticStars = Array.from({ length: STATIC_STAR_COUNT }, (_, i) => ({
    id: i,
    top: Math.random() * GAME_HEIGHT,
    left: Math.random() * GAME_WIDTH,
    size: 1 + Math.random() * 1.5,
    color: Math.random() > 0.7 ? '#fffde4' : '#fff',
  }));

  // Generate stars for dark mode
  const STAR_COUNT = 30;
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    top: Math.random() * GAME_HEIGHT,
    left: Math.random() * GAME_WIDTH,
    size: 1.5 + Math.random() * 2.5,
    delay: Math.random() * 2,
  }));

  // Bird falling
  useEffect(() => {
    if (!gameHasStarted || gameOver) return;
    const interval = setInterval(() => {
      setBirdPosition((pos) => {
        const next = pos + GRAVITY;
        if (next + BIRD_SIZE >= GAME_HEIGHT) {
          setGameOver(true);
          return GAME_HEIGHT - BIRD_SIZE;
        }
        return next;
      });
    }, 24);
    return () => clearInterval(interval);
  }, [gameHasStarted, gameOver]);

  // Pipes movement
  useEffect(() => {
    if (!gameHasStarted || gameOver) return;
    const interval = setInterval(() => {
      setPipes((pipesArr) => {
        let newPipes = pipesArr
          .map((pipe) => ({ ...pipe, left: pipe.left - PIPE_SPEED }))
          .filter((pipe) => pipe.left + PIPE_WIDTH > 0);
        // Add new pipe
        if (newPipes.length === 0 || newPipes[newPipes.length - 1].left < GAME_WIDTH - 250) {
          newPipes.push({ left: GAME_WIDTH, height: getRandomPipeHeight(), scored: false });
        }
        return newPipes;
      });
    }, 24);
    return () => clearInterval(interval);
  }, [gameHasStarted, gameOver]);

  // Collision detection & scoring
  useEffect(() => {
    if (!gameHasStarted || gameOver) return;
    setPipes((pipesArr) => {
      return pipesArr.map((pipe) => {
        // Pipe collision
        if (
          pipe.left < 60 &&
          pipe.left + PIPE_WIDTH > 30 // bird is at x=30
        ) {
          if (
            birdPosition < pipe.height ||
            birdPosition + BIRD_SIZE > pipe.height + PIPE_GAP
          ) {
            setGameOver(true);
          }
        }
        // Score: when pipe passes the bird and hasn't been scored yet
        if (!pipe.scored && pipe.left + PIPE_WIDTH < 30) {
          setScore((s) => s + 1);
          return { ...pipe, scored: true };
        }
        return pipe;
      });
    });
  }, [birdPosition, pipes, gameHasStarted, gameOver]);

  // Jump
  const handleJump = () => {
    if (!gameHasStarted || gameOver) {
      setGameHasStarted(true);
      setGameOver(false);
      setScore(0);
      setPipes([{ left: GAME_WIDTH, height: getRandomPipeHeight(), scored: false }]);
      setBirdPosition(GAME_HEIGHT / 2 - BIRD_SIZE / 2);
      return;
    }
    setBirdPosition((pos) => Math.max(pos - JUMP_HEIGHT, 0));
  };

  // Keyboard jump
  useEffect(() => {
    const onSpace = (e) => {
      if (e.code === 'Space') handleJump();
    };
    window.addEventListener('keydown', onSpace);
    return () => window.removeEventListener('keydown', onSpace);
  });

  // Click jump
  useEffect(() => {
    const ref = gameRef.current;
    if (!ref) return;
    ref.addEventListener('click', handleJump);
    return () => ref.removeEventListener('click', handleJump);
  });

  // Play sound on game over
  useEffect(() => {
    if (gameOver) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 220;
      g.gain.value = 0.1;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 300);
    }
  }, [gameOver]);

  // Change page background color on mode change
  useEffect(() => {
    document.body.style.background = darkMode ? '#141c2c' : '#e0f7fa';
  }, [darkMode]);

  return (
    <div>
      {/* Dark/Light mode toggle */}
      <div style={{
        width: GAME_WIDTH,
        margin: '20px auto 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}>
        <span style={{ color: darkMode ? '#fff' : '#222', fontWeight: 'bold', marginRight: 8 }}>
          {darkMode ? 'Dark' : 'Light'} Mode
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode((m) => !m)}
          />
          <span className="slider" />
        </label>
      </div>
      <div
        ref={gameRef}
        className="flappy-game"
        style={{
          position: 'relative',
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          margin: '20px auto',
          background: darkMode ? '#19233a' : '#70c5ce',
          overflow: 'hidden',
          border: `2px solid ${darkMode ? '#fff' : '#333'}`,
          borderRadius: 10,
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: darkMode ? '0 0 16px #111' : '0 0 16px #b3e5fc',
        }}
        tabIndex={0}
      >
        {/* Static stars in dark mode (background, no animation) */}
        {darkMode && !gameOver && staticStars.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: star.color,
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}
        {/* Animated stars in dark mode, only on game over */}
        {darkMode && gameOver && stars.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: Math.random() > 0.7 ? '#fffde4' : '#fff',
              opacity: 0.8,
              pointerEvents: 'none',
              animation: `twinkle 2s infinite`,
              animationDelay: `${star.delay}s`,
              zIndex: 0,
            }}
          />
        ))}
        {/* Bird */}
        <img
          src="/bird.png"
          alt="bird"
          style={{
            position: 'absolute',
            left: 30,
            top: birdPosition,
            width: BIRD_SIZE,
            height: BIRD_SIZE,
            objectFit: 'contain',
            zIndex: 2,
          }}
        />
        {/* Pipes */}
        {pipes.map((pipe, idx) => (
          <React.Fragment key={idx}>
            {/* Top pipe (bamboo) */}
            <div
              style={{
                position: 'absolute',
                left: pipe.left,
                top: 0,
                width: PIPE_WIDTH,
                height: pipe.height,
                background: 'linear-gradient(to bottom, #a8e063 0%, #56ab2f 100%)',
                border: '2px solid #388e3c',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                boxShadow: '0 2px 8px #888',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Bamboo bands */}
              <div style={{height: 8, background: '#d0f5a9', borderRadius: 4, margin: '8px 6px 0 6px'}} />
              <div style={{height: 8, background: '#d0f5a9', borderRadius: 4, margin: '0 6px'}} />
              <div style={{height: 8, background: '#d0f5a9', borderRadius: 4, margin: '0 6px 8px 6px'}} />
            </div>
            {/* Bottom pipe (bamboo) */}
            <div
              style={{
                position: 'absolute',
                left: pipe.left,
                top: pipe.height + PIPE_GAP,
                width: PIPE_WIDTH,
                height: GAME_HEIGHT - pipe.height - PIPE_GAP,
                background: 'linear-gradient(to bottom, #a8e063 0%, #56ab2f 100%)',
                border: '2px solid #388e3c',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                boxShadow: '0 2px 8px #888',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Bamboo bands */}
              <div style={{height: 8, background: '#d0f5a9', borderRadius: 4, margin: '8px 6px 0 6px'}} />
              <div style={{height: 8, background: '#d0f5a9', borderRadius: 4, margin: '0 6px'}} />
              <div style={{height: 8, background: '#d0f5a9', borderRadius: 4, margin: '0 6px 8px 6px'}} />
            </div>
          </React.Fragment>
        ))}
        {/* Score & Messages */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 0,
            width: '100%',
            textAlign: 'center',
            fontSize: 32,
            color: darkMode ? '#fff' : '#222',
            textShadow: darkMode ? '2px 2px 4px #333' : '2px 2px 4px #b3e5fc',
            fontWeight: 'bold',
          }}
        >
          {score}
        </div>
        {!gameHasStarted && !gameOver && (
          <div className="flappy-message" style={{color: darkMode ? '#fff' : '#222', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', zIndex: 1000, position: 'absolute', left: 0, width: '100%'}}>
            Click or press Space to start
          </div>
        )}
        {gameOver && (
          <div className="flappy-message" style={{color: darkMode ? '#fff' : '#222', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', zIndex: 1000, position: 'absolute', left: 0, width: '100%'}}>
            Game Over!<br/>Score: {score}<br/>Click or press Space to restart
          </div>
        )}
        {/* Sun in light mode */}
        {!darkMode && (
          <div
            style={{
              position: 'absolute',
              top: 30,
              right: 30,
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 60% 40%, #fffde4 60%, #ffe066 100%)',
              boxShadow: '0 0 60px 20px #ffe06688',
              zIndex: 0,
            }}
          />
        )}
        {/* Crescent moon in dark mode */}
        {darkMode && (
          <div style={{ position: 'absolute', top: 30, right: 30, width: 70, height: 70, zIndex: 0 }}>
            {/* Main moon */}
            <div style={{
              position: 'absolute',
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 60% 40%, #fffde4 60%, #ffe066 100%)',
              boxShadow: '0 0 40px 10px #ffe06655',
            }} />
            {/* Overlay to create crescent */}
            <div style={{
              position: 'absolute',
              left: 18,
              top: 0,
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: '#22305a',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
