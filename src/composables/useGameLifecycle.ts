import { type Ref, ref, onUnmounted } from 'vue';
import type { useGameStore } from '@/stores/gameStore';

type GameStore = ReturnType<typeof useGameStore>;

export function useGameLifecycle(gameStore: GameStore): {
  showModal: Ref<boolean>
  startGame: (timeLeftInput: number) => void
  handlePause: () => void
  handleResume: () => void
  handleQuit: () => void
  handleGameOverClose: () => void
  handlePlayAgain: (timeLeftInput: number) => void
  handleMainMenu: () => void
} {
  const showModal = ref(true);

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
