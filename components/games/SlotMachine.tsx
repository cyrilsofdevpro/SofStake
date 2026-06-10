'use client';

import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import { getStoredUser, addTransaction, StoredUser } from '@/lib/user';
import { spinSlot } from '@/lib/games/slots';

const SYMBOL_LABELS: Record<string, string> = {
  cherry: '🍒',
  lemon: '🍋',
  grape: '🍇',
  bar: 'BAR',
  seven: '7️⃣',
  diamond: '💎'
};

const SYMBOL_KEYS = Object.keys(SYMBOL_LABELS);

function formatSymbol(symbolId: string) {
  return SYMBOL_LABELS[symbolId] ?? symbolId;
}

function getRandomSymbol() {
  const symbol = SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)];
  return formatSymbol(symbol);
}

class SlotMachineScene extends Phaser.Scene {
  public reels: Phaser.GameObjects.Text[][] = [];
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SlotMachineScene' });
  }

  create() {
    const width = 760;
    const height = 520;
    this.cameras.main.setBackgroundColor('#111827');

    const panel = this.add.rectangle(width / 2, 90, width - 48, 140, 0x0f172a, 0.65);
    panel.setStrokeStyle(2, 0x22d3ee, 0.4);

    this.statusText = this.add.text(width / 2, 90, 'Ready to spin', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const startX = 100;
    const startY = 200;
    const cellSize = 120;

    for (let reel = 0; reel < 5; reel += 1) {
      const reelColumn: Phaser.GameObjects.Text[] = [];
      for (let row = 0; row < 3; row += 1) {
        const x = startX + reel * (cellSize + 10);
        const y = startY + row * (cellSize + 10);
        const slotBox = this.add.rectangle(x, y, cellSize, cellSize, 0x0f172a);
        slotBox.setStrokeStyle(2, 0x38bdf8, 0.35);

        const text = this.add.text(x, y, getRandomSymbol(), {
          fontFamily: 'Arial',
          fontSize: '44px',
          color: '#f8fafc'
        }).setOrigin(0.5);

        reelColumn.push(text);
      }
      this.reels.push(reelColumn);
    }

    this.add.text(width / 2, height - 40, 'Server-driven slot engine with RTP and paylines', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#94a3b8'
    }).setOrigin(0.5);
  }

  updateStatus(message: string) {
    if (this.statusText) {
      this.statusText.setText(message);
    }
  }

  animateSpin(finalGrid: string[][], onComplete: () => void) {
    if (!this.reels.length) {
      onComplete();
      return;
    }

    const reelCount = this.reels.length;
    let finishedReels = 0;

    for (let reelIndex = 0; reelIndex < reelCount; reelIndex += 1) {
      const reel = this.reels[reelIndex];
      const finalSymbols = finalGrid.map((row) => formatSymbol(row[reelIndex]));
      const spins = 18 + reelIndex * 6;
      let currentSpin = 0;

      const timer = this.time.addEvent({
        delay: 60,
        repeat: spins,
        callback: () => {
          reel.forEach((text) => text.setText(getRandomSymbol()));
          currentSpin += 1;

          if (currentSpin > spins) {
            reel.forEach((text, row) => text.setText(finalSymbols[row]));
            finishedReels += 1;
            if (finishedReels === reelCount) {
              onComplete();
            }
            timer.remove(false);
          }
        }
      });
    }
  }
}

export default function SlotMachine() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultMessage, setResultMessage] = useState('Place your bet and spin the reels.');
  const [payout, setPayout] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [error, setError] = useState('');
  const gameRef = useRef<Game | null>(null);
  const sceneRef = useRef<any | null>(null);

  const canSpin = Boolean(user && betAmount >= 50 && betAmount <= balance && !isSpinning);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setBalance(storedUser.walletBalance);
    }
  }, []);

  useEffect(() => {
    if (gameRef.current) return;

    let isMounted = true;

    async function initPhaser() {
      const PhaserModule = await import('phaser');
      const Phaser = PhaserModule as typeof import('phaser');

      if (!isMounted) return;

      class SlotMachineScene extends Phaser.Scene {
        public reels: Phaser.GameObjects.Text[][] = [];
        private statusText?: Phaser.GameObjects.Text;

        constructor() {
          super({ key: 'SlotMachineScene' });
        }

        create() {
          const width = 760;
          const height = 520;
          this.cameras.main.setBackgroundColor('#111827');

          const panel = this.add.rectangle(width / 2, 90, width - 48, 140, 0x0f172a, 0.65);
          panel.setStrokeStyle(2, 0x22d3ee, 0.4);

          this.statusText = this.add.text(width / 2, 90, 'Ready to spin', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
          }).setOrigin(0.5);

          const startX = 100;
          const startY = 200;
          const cellSize = 120;

          for (let reel = 0; reel < 5; reel += 1) {
            const reelColumn: Phaser.GameObjects.Text[] = [];
            for (let row = 0; row < 3; row += 1) {
              const x = startX + reel * (cellSize + 10);
              const y = startY + row * (cellSize + 10);
              const slotBox = this.add.rectangle(x, y, cellSize, cellSize, 0x0f172a);
              slotBox.setStrokeStyle(2, 0x38bdf8, 0.35);

              const text = this.add.text(x, y, getRandomSymbol(), {
                fontFamily: 'Arial',
                fontSize: '44px',
                color: '#f8fafc'
              }).setOrigin(0.5);

              reelColumn.push(text);
            }
            this.reels.push(reelColumn);
          }

          this.add.text(width / 2, height - 40, 'Server-driven slot engine with RTP and paylines', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#94a3b8'
          }).setOrigin(0.5);
        }

        updateStatus(message: string) {
          if (this.statusText) {
            this.statusText.setText(message);
          }
        }

        animateSpin(finalGrid: string[][], onComplete: () => void) {
          if (!this.reels.length) {
            onComplete();
            return;
          }

          const reelCount = this.reels.length;
          let finishedReels = 0;

          for (let reelIndex = 0; reelIndex < reelCount; reelIndex += 1) {
            const reel = this.reels[reelIndex];
            const finalSymbols = finalGrid.map((row) => formatSymbol(row[reelIndex]));
            const spins = 18 + reelIndex * 6;
            let currentSpin = 0;

            const timer = this.time.addEvent({
              delay: 60,
              repeat: spins,
              callback: () => {
                reel.forEach((text) => text.setText(getRandomSymbol()));
                currentSpin += 1;

                if (currentSpin > spins) {
                  reel.forEach((text, row) => text.setText(finalSymbols[row]));
                  finishedReels += 1;
                  if (finishedReels === reelCount) {
                    onComplete();
                  }
                  timer.remove(false);
                }
              }
            });
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: 'slot-machine-canvas',
        width: 760,
        height: 520,
        backgroundColor: '#0f172a',
        scene: SlotMachineScene
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
      sceneRef.current = game.scene.getScene('SlotMachineScene') as any;
    }

    initPhaser();

    return () => {
      isMounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const handleSpin = async () => {
    if (!user || !canSpin) {
      setError('Unable to spin at this time.');
      return;
    }

    setError('');
    setIsSpinning(true);
    setResultMessage('Spinning the reels...');
    setMultiplier(1);
    setPayout(0);

    try {
      const result = await spinSlot({ userId: user.id, betAmount });
      setBalance(result.newBalance);
      setMultiplier(result.multiplier || 0);
      setPayout(result.payout);

      if (sceneRef.current) {
        sceneRef.current.updateStatus('Reels spinning...');
        sceneRef.current.animateSpin(result.grid, () => {
          if (result.payout > 0) {
            sceneRef.current?.updateStatus(`Win ${result.multiplier}x! Payout ₦${result.payout.toLocaleString()}`);
            setResultMessage(`🎉 You won ₦${result.payout.toLocaleString()} (${result.multiplier}x)`);
            const updated = addTransaction('win', result.payout, `Slot win ${result.multiplier}x`, 'completed');
            if (updated) {
              setUser(updated);
              setBalance(updated.walletBalance);
            }
          } else {
            sceneRef.current?.updateStatus('No win this spin');
            setResultMessage('😕 No win this time. Try again or adjust your bet.');
          }
          setIsSpinning(false);
        });
      } else {
        setResultMessage(result.payout > 0 ? `🎉 You won ₦${result.payout.toLocaleString()}` : '😕 No win this spin');
        setIsSpinning(false);
      }

      const betUpdate = addTransaction('withdraw', -betAmount, `Slot bet ₦${betAmount}`, 'completed');
      if (betUpdate) {
        setUser(betUpdate);
        setBalance(betUpdate.walletBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Spin failed');
      setIsSpinning(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[url('/betting-images/img5.jpg')] bg-cover bg-center text-white">
      <div className="absolute inset-0 bg-slate-950/85" />
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 bg-clip-text text-transparent">
            🎰 Slot Machine Engine
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            Server-selected reels, weighted symbols, and real casino-style payline logic.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8 backdrop-blur-xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">Wallet Balance</p>
                <p className="mt-2 text-4xl font-bold text-orange-300">₦{balance.toLocaleString()}</p>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-sm text-slate-400">Current Payout</p>
                <p className="text-3xl font-bold text-emerald-400">₦{payout.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Multiplier {multiplier.toFixed(2)}x</p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-300">Bet Amount</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={betAmount}
                  disabled={isSpinning}
                  onChange={(event) => setBetAmount(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-fuchsia-500"
                />
              </label>

              <button
                type="button"
                onClick={handleSpin}
                disabled={!canSpin}
                className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-400 px-6 py-4 text-lg font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSpinning ? 'Spinning…' : `Spin ₦${betAmount.toLocaleString()}`}
              </button>

              {error && <div className="rounded-2xl bg-red-500/20 p-4 text-sm text-red-200">{error}</div>}
              <div className="rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-300">{resultMessage}</div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8 backdrop-blur-xl">
            <div id="slot-machine-canvas" className="mx-auto" />
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-slate-400">
              <div className="rounded-2xl bg-slate-900/80 p-4">
                <p className="font-semibold text-white">Reels</p>
                <p>5 reels, 3 rows</p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 p-4">
                <p className="font-semibold text-white">Paylines</p>
                <p>5 active paylines</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
