"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

interface Car {
  x: number;
  y: number;
  angle: number;
  speed: number;
  health: number;
  score: number;
  color: string;
  isPlayer: boolean;
  name: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: number;
  color: string;
}

// Base canvas dimensions (will scale for mobile)
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CAR_SIZE = 30;
const BULLET_SIZE = 5;
const BULLET_SPEED = 8;
const MAX_SPEED = 5;
const ACCELERATION = 0.3;
const FRICTION = 0.95;
const TURN_SPEED = 0.08;
const SHOOT_COOLDOWN = 300;

export default function SmashKarts() {
  const [mounted, setMounted] = useState(false);
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [winner, setWinner] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState<string>("");
  
  const carsRef = useRef<Car[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastShotRef = useRef<number>(0);
  const animationIdRef = useRef<number | undefined>(undefined);
  
  // Mobile control states
  const touchControlsRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false,
  });

  useEffect(() => {
    setMounted(true);
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const connectedWallet = wallets[0];

  const initGame = () => {
    carsRef.current = [
      {
        x: 100,
        y: 100,
        angle: 0,
        speed: 0,
        health: 100,
        score: 0,
        color: "#00ff88",
        isPlayer: true,
        name: "You",
      },
      {
        x: 700,
        y: 100,
        angle: Math.PI,
        speed: 0,
        health: 100,
        score: 0,
        color: "#ff4444",
        isPlayer: false,
        name: "Red Bot",
      },
      {
        x: 700,
        y: 500,
        angle: Math.PI,
        speed: 0,
        health: 100,
        score: 0,
        color: "#4444ff",
        isPlayer: false,
        name: "Blue Bot",
      },
      {
        x: 100,
        y: 500,
        angle: 0,
        speed: 0,
        health: 100,
        score: 0,
        color: "#ffaa00",
        isPlayer: false,
        name: "Orange Bot",
      },
    ];
    bulletsRef.current = [];
    setWinner("");
    setMintSuccess(false);
    setMintError("");
  };

  const handleMintTokens = async () => {
    if (!connectedWallet?.address) {
      setMintError("No wallet connected");
      return;
    }

    const playerScore = carsRef.current[0].score;
    // Mint at least 1 token for participation, or the actual score if higher
    const tokensToMint = playerScore > 0 ? playerScore : 1;

    setIsMinting(true);
    setMintError("");

    try {
      const response = await fetch('/api/mint-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientAddress: connectedWallet.address,
          amount: tokensToMint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint tokens');
      }

      setMintSuccess(true);
      console.log('Mint successful:', data);
    } catch (error) {
      console.error('Mint error:', error);
      setMintError(error instanceof Error ? error.message : 'Failed to mint tokens');
    } finally {
      setIsMinting(false);
    }
  };

  const drawCar = (ctx: CanvasRenderingContext2D, car: Car) => {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE / 2, CAR_SIZE, CAR_SIZE);

    // Car direction indicator (front)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(CAR_SIZE / 2 - 5, -5, 8, 10);

    // Health bar
    ctx.restore();
    const healthBarWidth = 40;
    const healthPercent = car.health / 100;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(car.x - healthBarWidth / 2, car.y - 25, healthBarWidth, 5);
    ctx.fillStyle = car.health > 50 ? "#00ff00" : car.health > 25 ? "#ffaa00" : "#ff0000";
    ctx.fillRect(car.x - healthBarWidth / 2, car.y - 25, healthBarWidth * healthPercent, 5);

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(car.name, car.x, car.y - 30);
  };

  const drawBullet = (ctx: CanvasRenderingContext2D, bullet: Bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_SIZE, 0, Math.PI * 2);
    ctx.fill();
  };

  const shootBullet = (carIndex: number) => {
    const now = Date.now();
    if (now - lastShotRef.current < SHOOT_COOLDOWN) return;

    const car = carsRef.current[carIndex];
    if (car.health <= 0) return;

    lastShotRef.current = now;
    const bullet: Bullet = {
      x: car.x + Math.cos(car.angle) * CAR_SIZE,
      y: car.y + Math.sin(car.angle) * CAR_SIZE,
      vx: Math.cos(car.angle) * BULLET_SPEED,
      vy: Math.sin(car.angle) * BULLET_SPEED,
      owner: carIndex,
      color: car.color,
    };
    bulletsRef.current.push(bullet);
  };

  const updateAI = (carIndex: number) => {
    const car = carsRef.current[carIndex];
    if (car.health <= 0) return;

    const player = carsRef.current[0];
    
    // Find closest target (prioritize player if alive)
    let target = player.health > 0 ? player : null;
    
    if (!target) {
      // Find another alive bot
      for (let i = 0; i < carsRef.current.length; i++) {
        if (i !== carIndex && carsRef.current[i].health > 0) {
          target = carsRef.current[i];
          break;
        }
      }
    }

    if (!target) return;

    const dx = target.x - car.x;
    const dy = target.y - car.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const targetAngle = Math.atan2(dy, dx);

    // Turn towards target
    let angleDiff = targetAngle - car.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > 0.1) {
      car.angle += Math.sign(angleDiff) * TURN_SPEED;
    }

    // Move and shoot based on distance
    if (distance > 200) {
      // Move closer
      car.speed = Math.min(car.speed + ACCELERATION, MAX_SPEED);
    } else if (distance < 150) {
      // Back up
      car.speed = Math.max(car.speed - ACCELERATION, -MAX_SPEED / 2);
    } else {
      // Maintain distance
      car.speed *= FRICTION;
    }

    // Shoot if aimed at target
    if (Math.abs(angleDiff) < 0.2 && distance < 400) {
      const now = Date.now();
      if (now - lastShotRef.current > SHOOT_COOLDOWN + Math.random() * 200) {
        shootBullet(carIndex);
      }
    }

    // Apply movement
    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    // Wrap around edges
    if (car.x < 0) car.x = CANVAS_WIDTH;
    if (car.x > CANVAS_WIDTH) car.x = 0;
    if (car.y < 0) car.y = CANVAS_HEIGHT;
    if (car.y > CANVAS_HEIGHT) car.y = 0;
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    const cars = carsRef.current;
    const bullets = bulletsRef.current;

    // Update player car
    const player = cars[0];
    if (player.health > 0) {
      // Check both keyboard and touch controls
      const forward = keysRef.current["w"] || keysRef.current["ArrowUp"] || touchControlsRef.current.forward;
      const backward = keysRef.current["s"] || keysRef.current["ArrowDown"] || touchControlsRef.current.backward;
      const left = keysRef.current["a"] || keysRef.current["ArrowLeft"] || touchControlsRef.current.left;
      const right = keysRef.current["d"] || keysRef.current["ArrowRight"] || touchControlsRef.current.right;
      const shoot = keysRef.current[" "] || touchControlsRef.current.shoot;
      
      if (forward) {
        player.speed = Math.min(player.speed + ACCELERATION, MAX_SPEED);
      }
      if (backward) {
        player.speed = Math.max(player.speed - ACCELERATION, -MAX_SPEED / 2);
      }
      if (left) {
        player.angle -= TURN_SPEED;
      }
      if (right) {
        player.angle += TURN_SPEED;
      }
      if (shoot) {
        shootBullet(0);
      }

      player.speed *= FRICTION;
      player.x += Math.cos(player.angle) * player.speed;
      player.y += Math.sin(player.angle) * player.speed;

      // Wrap around edges
      if (player.x < 0) player.x = CANVAS_WIDTH;
      if (player.x > CANVAS_WIDTH) player.x = 0;
      if (player.y < 0) player.y = CANVAS_HEIGHT;
      if (player.y > CANVAS_HEIGHT) player.y = 0;
    }

    // Update AI cars
    for (let i = 1; i < cars.length; i++) {
      updateAI(i);
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // Remove if out of bounds
      if (
        bullet.x < 0 ||
        bullet.x > CANVAS_WIDTH ||
        bullet.y < 0 ||
        bullet.y > CANVAS_HEIGHT
      ) {
        bullets.splice(i, 1);
        continue;
      }

      // Check collision with cars
      for (let j = 0; j < cars.length; j++) {
        if (j === bullet.owner) continue;
        const car = cars[j];
        if (car.health <= 0) continue;

        const dx = bullet.x - car.x;
        const dy = bullet.y - car.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CAR_SIZE / 2) {
          car.health -= 20;
          if (car.health <= 0) {
            car.health = 0;
            cars[bullet.owner].score += 1;
          }
          bullets.splice(i, 1);
          break;
        }
      }
    }

    // Draw everything
    bullets.forEach((bullet) => drawBullet(ctx, bullet));
    cars.forEach((car) => drawCar(ctx, car));

    // Draw scores
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    let yOffset = 20;
    cars.forEach((car) => {
      ctx.fillStyle = car.color;
      ctx.fillText(`${car.name}: ${car.score} kills`, 10, yOffset);
      yOffset += 25;
    });

    // Draw controls hint
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText("WASD/Arrows: Move | Space: Shoot", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);

    // Check win condition
    const aliveCars = cars.filter((c) => c.health > 0);
    if (aliveCars.length === 1) {
      setWinner(aliveCars[0].name);
      setGameState("gameover");
      return;
    } else if (aliveCars.length === 0) {
      setWinner("Draw");
      setGameState("gameover");
      return;
    }

    animationIdRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === " ") e.preventDefault();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    animationIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const startGame = () => {
    initGame();
    setGameState("playing");
  };

  const returnToMenu = () => {
    setGameState("menu");
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-2 sm:p-4">
      {gameState === "menu" && (
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center max-w-lg w-full px-4">
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-2 sm:mb-4">
            🏎️ SmashKarts
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-md">
            Drive, shoot, and destroy your opponents! Last car standing wins.
          </p>
          <div className="bg-card p-4 sm:p-6 rounded-lg border border-border w-full">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 text-card-foreground">Controls</h2>
            <div className="text-left space-y-2 text-sm sm:text-base text-muted-foreground">
              {isMobile ? (
                <>
                  <p>🎮 <strong>On-screen buttons</strong> - Move & Turn</p>
                  <p>🔫 <strong>Fire button</strong> - Shoot</p>
                </>
              ) : (
                <>
                  <p>🎮 <strong>WASD</strong> or <strong>Arrow Keys</strong> - Move</p>
                  <p>🔫 <strong>Space</strong> - Shoot</p>
                </>
              )}
            </div>
          </div>
          
          {!ready && (
            <div className="px-6 sm:px-8 py-3 sm:py-4 bg-secondary text-secondary-foreground rounded-lg text-lg sm:text-xl font-semibold">
              Loading...
            </div>
          )}
          
          {ready && !authenticated && (
            <div className="flex flex-col gap-4 items-center w-full">
              <p className="text-sm sm:text-base text-muted-foreground">Connect your wallet to play</p>
              <button
                onClick={login}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg text-lg sm:text-xl font-semibold hover:opacity-90 transition-opacity active:scale-95"
              >
                Connect Wallet
              </button>
            </div>
          )}
          
          {ready && authenticated && (
            <div className="flex flex-col gap-4 items-center w-full">
              {connectedWallet && (
                <div className="bg-secondary/50 px-4 py-2 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Connected: {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
                  </p>
                </div>
              )}
              <button
                onClick={startGame}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg text-lg sm:text-xl font-semibold hover:opacity-90 transition-opacity active:scale-95"
              >
                Start Game
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex flex-col items-center gap-2 w-full h-screen justify-center relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 sm:border-4 border-border rounded-lg shadow-2xl max-w-full h-auto"
            style={{
              maxHeight: isMobile ? '50vh' : '80vh',
              width: 'auto',
              height: 'auto',
            }}
          />
          
          {/* Mobile Touch Controls */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-end gap-4 pointer-events-none">
              {/* Left side - D-pad controls */}
              <div className="relative w-40 h-40 pointer-events-auto">
                {/* Up */}
                <button
                  onTouchStart={() => touchControlsRef.current.forward = true}
                  onTouchEnd={() => touchControlsRef.current.forward = false}
                  onMouseDown={() => touchControlsRef.current.forward = true}
                  onMouseUp={() => touchControlsRef.current.forward = false}
                  onMouseLeave={() => touchControlsRef.current.forward = false}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold active:scale-95 transition-all"
                >
                  ▲
                </button>
                {/* Down */}
                <button
                  onTouchStart={() => touchControlsRef.current.backward = true}
                  onTouchEnd={() => touchControlsRef.current.backward = false}
                  onMouseDown={() => touchControlsRef.current.backward = true}
                  onMouseUp={() => touchControlsRef.current.backward = false}
                  onMouseLeave={() => touchControlsRef.current.backward = false}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold active:scale-95 transition-all"
                >
                  ▼
                </button>
                {/* Left */}
                <button
                  onTouchStart={() => touchControlsRef.current.left = true}
                  onTouchEnd={() => touchControlsRef.current.left = false}
                  onMouseDown={() => touchControlsRef.current.left = true}
                  onMouseUp={() => touchControlsRef.current.left = false}
                  onMouseLeave={() => touchControlsRef.current.left = false}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold active:scale-95 transition-all"
                >
                  ◀
                </button>
                {/* Right */}
                <button
                  onTouchStart={() => touchControlsRef.current.right = true}
                  onTouchEnd={() => touchControlsRef.current.right = false}
                  onMouseDown={() => touchControlsRef.current.right = true}
                  onMouseUp={() => touchControlsRef.current.right = false}
                  onMouseLeave={() => touchControlsRef.current.right = false}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold active:scale-95 transition-all"
                >
                  ▶
                </button>
              </div>
              
              {/* Right side - Shoot button */}
              <div className="pointer-events-auto">
                <button
                  onTouchStart={() => touchControlsRef.current.shoot = true}
                  onTouchEnd={() => touchControlsRef.current.shoot = false}
                  onMouseDown={() => touchControlsRef.current.shoot = true}
                  onMouseUp={() => touchControlsRef.current.shoot = false}
                  onMouseLeave={() => touchControlsRef.current.shoot = false}
                  className="w-20 h-20 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full shadow-lg flex items-center justify-center text-3xl font-bold active:scale-95 transition-all"
                >
                  🔫
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {gameState === "gameover" && (
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center max-w-lg w-full px-4">
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-2 sm:mb-4">
            Game Over!
          </h1>
          <div className="bg-card p-4 sm:p-8 rounded-lg border border-border w-full">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4 text-card-foreground">
              🏆 {winner} {winner !== "Draw" && "Wins!"}
            </h2>
            <div className="space-y-2 text-left">
              {carsRef.current.map((car, i) => (
                <p key={i} className="text-base sm:text-lg" style={{ color: car.color }}>
                  {car.name}: {car.score} kills
                </p>
              ))}
            </div>
          </div>
          
          {/* Token Minting Section */}
          {connectedWallet && (
            <div className="bg-accent p-4 sm:p-6 rounded-lg border border-border w-full">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-accent-foreground">
                🎁 Claim Your Rewards!
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {carsRef.current[0].score > 0 ? (
                  <>
                    You earned <strong className="text-primary">{carsRef.current[0].score} SUR tokens</strong> for your {carsRef.current[0].score} {carsRef.current[0].score === 1 ? 'kill' : 'kills'}!
                  </>
                ) : (
                  <>
                    You earned <strong className="text-primary">1 SUR token</strong> for participating! 🎮
                  </>
                )}
              </p>
              
              {!mintSuccess ? (
                <button
                  onClick={handleMintTokens}
                  disabled={isMinting}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg text-base sm:text-lg font-semibold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMinting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Minting...
                    </span>
                  ) : (
                    '🪙 Mint Tokens to Wallet'
                  )}
                </button>
              ) : (
                <div className="bg-primary/10 border border-primary rounded-lg p-3">
                  <p className="text-primary font-semibold flex items-center justify-center gap-2">
                    ✅ Tokens minted successfully!
                  </p>
                </div>
              )}
              
              {mintError && (
                <div className="mt-3 bg-destructive/10 border border-destructive rounded-lg p-3">
                  <p className="text-destructive text-sm">{mintError}</p>
                </div>
              )}
            </div>
          )}
          
          {connectedWallet && (
            <div className="bg-secondary/50 px-4 py-2 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Connected: {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={startGame}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg text-base sm:text-lg font-semibold hover:opacity-90 transition-opacity active:scale-95"
            >
              Play Again
            </button>
            <button
              onClick={returnToMenu}
              className="w-full sm:w-auto px-6 py-3 bg-secondary text-secondary-foreground rounded-lg text-base sm:text-lg font-semibold hover:opacity-90 transition-opacity active:scale-95"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

