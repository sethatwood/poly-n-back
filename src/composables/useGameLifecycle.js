import { ref, onUnmounted } from 'vue';

export function useGameLifecycle(gameStore) {
  const showModal = ref(true);

  const startGame = (timeLeftInput) => {
    showModal.value = false;
    gameStore.startGame(timeLeftInput);
  };

  const handlePause = () => {
    gameStore.pauseGame();
  };

  const handleResume = () => {
    gameStore.resumeGame();
  };

  const handleQuit = () => {
    gameStore.resumeGame();
    gameStore.stopGame();
    showModal.value = true;
  };

  const handleGameOverClose = () => {
    gameStore.dismissGameOverModal();
  };

  const handlePlayAgain = (timeLeftInput) => {
    gameStore.dismissGameOverModal();
    gameStore.startGame(timeLeftInput);
  };

  const handleMainMenu = () => {
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
