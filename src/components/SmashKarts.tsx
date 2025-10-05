"use client";

import { useEffect, useRef, useState } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [winner, setWinner] = useState<string>("");
  
  const carsRef = useRef<Car[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastShotRef = useRef<number>(0);
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (keysRef.current["w"] || keysRef.current["ArrowUp"]) {
        player.speed = Math.min(player.speed + ACCELERATION, MAX_SPEED);
      }
      if (keysRef.current["s"] || keysRef.current["ArrowDown"]) {
        player.speed = Math.max(player.speed - ACCELERATION, -MAX_SPEED / 2);
      }
      if (keysRef.current["a"] || keysRef.current["ArrowLeft"]) {
        player.angle -= TURN_SPEED;
      }
      if (keysRef.current["d"] || keysRef.current["ArrowRight"]) {
        player.angle += TURN_SPEED;
      }
      if (keysRef.current[" "]) {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {gameState === "menu" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            🏎️ SmashKarts
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Drive, shoot, and destroy your opponents! Last car standing wins.
          </p>
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-3 text-card-foreground">Controls</h2>
            <div className="text-left space-y-2 text-muted-foreground">
              <p>🎮 <strong>WASD</strong> or <strong>Arrow Keys</strong> - Move</p>
              <p>🔫 <strong>Space</strong> - Shoot</p>
            </div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-4 border-border rounded-lg shadow-2xl"
          />
        </div>
      )}

      {gameState === "gameover" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Game Over!
          </h1>
          <div className="bg-card p-8 rounded-lg border border-border">
            <h2 className="text-3xl font-semibold mb-4 text-card-foreground">
              🏆 {winner} {winner !== "Draw" && "Wins!"}
            </h2>
            <div className="space-y-2 text-left">
              {carsRef.current.map((car, i) => (
                <p key={i} className="text-lg" style={{ color: car.color }}>
                  {car.name}: {car.score} kills
                </p>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Play Again
            </button>
            <button
              onClick={returnToMenu}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

