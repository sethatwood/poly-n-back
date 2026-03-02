import { type Ref, ref, onUnmounted } from 'vue';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import type { useGameStore } from '@/stores/gameStore';

type GameStore = ReturnType<typeof useGameStore>;

export function useGameLifecycle(gameStore: GameStore): {
  showModal: Ref<boolean>;
  startGame: (timeLeftInput: number) => void;
  handlePause: () => void;
  handleResume: () => void;
  handleQuit: () => void;
  handleGameOverClose: () => void;
  handlePlayAgain: (timeLeftInput: number) => void;
  handleMainMenu: () => void;
} {
  const showModal = ref(true);
  let appStateListener: PluginListenerHandle | null = null;

  async function setupAppStateListener(): Promise<void> {
    appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && !gameStore.isStopped && !gameStore.isPaused) {
        gameStore.pauseGame();
      }
      // Do NOT auto-resume -- user must tap Resume explicitly
    });
  }

  // Fire-and-forget: register listener at composable setup time
  setupAppStateListener();

  const startGame = (timeLeftInput: number): void => {
    showModal.value = false;
    gameStore.startGame(timeLeftInput);
  };

  const handlePause = (): void => {
    gameStore.pauseGame();
  };

  const handleResume = (): void => {
    gameStore.resumeGame();
  };

  const handleQuit = (): void => {
    gameStore.resumeGame();
    gameStore.stopGame();
    showModal.value = true;
  };

  const handleGameOverClose = (): void => {
    gameStore.dismissGameOverModal();
  };

  const handlePlayAgain = (timeLeftInput: number): void => {
    gameStore.dismissGameOverModal();
    gameStore.startGame(timeLeftInput);
  };

  const handleMainMenu = (): void => {
    gameStore.dismissGameOverModal();
    showModal.value = true;
  };

  onUnmounted(() => {
    appStateListener?.remove();
    gameStore.stopGame();
  });

  return {
    showModal,
    startGame,
    handlePause,
    handleResume,
    handleQuit,
    handleGameOverClose,
    handlePlayAgain,
    handleMainMenu,
  };
}
