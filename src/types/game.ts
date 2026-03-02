/** The four stimulus attributes the player can match */
export type StimulusAttribute = 'color' | 'emoji' | 'position' | 'shape';

/** Possible stimulus colors */
export type StimulusColor = 'purple' | 'green' | 'blue';

/** Possible stimulus emojis */
export type StimulusEmoji = 'fire' | 'ice' | 'flower';

/** Possible stimulus positions */
export type StimulusPosition = 'left' | 'center' | 'right';

/** Possible stimulus shapes */
export type StimulusShape = 'circle' | 'square' | 'triangle';

/** A single stimulus shown to the player */
export interface Stimulus {
  color: StimulusColor;
  emoji: StimulusEmoji;
  position: StimulusPosition;
  shape: StimulusShape;
}

/** Persisted high score record */
export interface HighScoreData {
  score: number;
  potentialCorrectAnswers: number;
  nBack: number | null;
}

/** Per-turn response tracking (which buttons have been pressed) */
export interface RespondedThisTurn {
  color: boolean;
  emoji: boolean;
  position: boolean;
  shape: boolean;
}

/** Feedback state for visual effects on response */
export interface FeedbackState {
  type: 'correct' | 'incorrect' | null;
  button: StimulusAttribute | null;
  timestamp: number | null;
}

/** Sound names used by the audio system */
export type SoundName = 'stimulus' | 'increment' | 'strike';

/** A response button definition */
export interface ResponseButton {
  type: StimulusAttribute;
  label: string;
}

/** Achievement definition */
export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}

/** Tutorial step definition */
export interface TutorialStep {
  icon: string;
  title: string;
  description: string;
  example?: TutorialExample[];
}

/** Tutorial step visual example */
export interface TutorialExample {
  emoji: string;
  label: string;
  color?: string;
}

/** Hint definition */
export interface GameHintDef {
  icon: string;
  text: string;
  priority: number;
}

/** Overall game state (menu, active play, paused, or game over) */
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';
